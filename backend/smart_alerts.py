"""
The three "hidden problem" detectors. Each one answers a question you
can't easily answer from memory, even though the data to answer it
was sitting on paper receipts in your wallet the whole time:

  1. Price creep   -- did an item you buy regularly quietly get more
                       expensive between visits?
  2. Recurring charges -- which merchants are billing you on a
                       monthly-ish cadence, and how much does that add
                       up to?
  3. Return/warranty windows -- which recent purchases still have a
                       return or warranty clock running out?
"""
from collections import defaultdict
from datetime import date, datetime, timedelta
from difflib import SequenceMatcher

# Categories where a physical return window realistically applies.
RETURN_WINDOW_DAYS = {
    "Shopping": 30,
    "Entertainment": 14,
}

# Categories where a purchase over WARRANTY_MIN_PRICE likely carries a
# longer manufacturer warranty worth remembering.
WARRANTY_WINDOW_DAYS = {
    "Shopping": 365,
}
WARRANTY_MIN_PRICE = 50

# How far in advance to start surfacing an upcoming deadline.
RETURN_LOOKAHEAD_DAYS = 7
WARRANTY_LOOKAHEAD_DAYS = 21


def _similar(a: str, b: str, threshold: float = 0.82) -> bool:
    return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio() >= threshold


def _parse_date(value: str):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except (TypeError, ValueError):
        return None


def detect_price_creep(expenses: list[dict]) -> list[dict]:
    """Group same/similar items at the same merchant and flag ones
    whose price rose meaningfully between the earliest and latest
    purchase on record."""
    by_merchant = defaultdict(list)
    for e in expenses:
        if e.get("price") and e.get("date"):
            by_merchant[e["merchant"]].append(e)

    alerts = []
    for merchant, items in by_merchant.items():
        items_sorted = sorted(items, key=lambda x: x["date"])
        groups: list[dict] = []
        for item in items_sorted:
            match = next((g for g in groups if _similar(g["name"], item["item_name"])), None)
            if match:
                match["history"].append((item["date"], item["price"]))
            else:
                groups.append({"name": item["item_name"], "history": [(item["date"], item["price"])]})

        for group in groups:
            history = sorted(group["history"])
            if len(history) < 2:
                continue
            first_date, first_price = history[0]
            last_date, last_price = history[-1]
            if first_price > 0 and last_price > first_price * 1.10 and last_date != first_date:
                pct = round((last_price / first_price - 1) * 100)
                alerts.append(
                    {
                        "item": group["name"],
                        "merchant": merchant,
                        "first_price": round(first_price, 2),
                        "first_date": first_date,
                        "last_price": round(last_price, 2),
                        "last_date": last_date,
                        "pct_increase": pct,
                        "times_seen": len(history),
                    }
                )

    alerts.sort(key=lambda a: -a["pct_increase"])
    return alerts


def detect_recurring_charges(receipts: list[dict]) -> dict:
    """Flag merchants that bill on a roughly-monthly cadence at a
    roughly-stable amount -- the signature of a subscription, even
    when it's not literally labeled as one."""
    by_merchant = defaultdict(list)
    for r in receipts:
        d = _parse_date(r.get("date"))
        if d:
            by_merchant[r["merchant"]].append((d, r.get("total", 0) or 0))

    detected = []
    for merchant, occurrences in by_merchant.items():
        occurrences.sort(key=lambda x: x[0])
        if len(occurrences) < 2:
            continue

        intervals = [
            (occurrences[i][0] - occurrences[i - 1][0]).days for i in range(1, len(occurrences))
        ]
        monthly_like = [d for d in intervals if 25 <= d <= 35]
        if not monthly_like or len(monthly_like) / len(intervals) < 0.5:
            continue

        prices = [p for _, p in occurrences]
        avg_price = sum(prices) / len(prices)
        if avg_price <= 0:
            continue
        if not all(abs(p - avg_price) / avg_price < 0.15 for p in prices):
            continue

        detected.append(
            {
                "merchant": merchant,
                "occurrences": len(occurrences),
                "avg_amount": round(avg_price, 2),
                "last_date": occurrences[-1][0].isoformat(),
            }
        )

    detected.sort(key=lambda s: -s["avg_amount"])
    monthly_total = round(sum(s["avg_amount"] for s in detected), 2)
    return {"detected": detected, "monthly_total": monthly_total}


def compute_deadlines(expenses: list[dict], today: date | None = None) -> list[dict]:
    """Surface return and warranty deadlines that are approaching or
    were recently missed, so they don't quietly lapse unnoticed."""
    today = today or date.today()
    deadlines = []

    for e in expenses:
        purchase_date = _parse_date(e.get("date"))
        if not purchase_date:
            continue
        category = e.get("category")
        price = e.get("price") or 0

        return_days = RETURN_WINDOW_DAYS.get(category)
        if return_days:
            deadline = purchase_date + timedelta(days=return_days)
            days_left = (deadline - today).days
            if -3 <= days_left <= RETURN_LOOKAHEAD_DAYS:
                deadlines.append(
                    {
                        "type": "return",
                        "item": e["item_name"],
                        "merchant": e["merchant"],
                        "price": round(price, 2),
                        "purchase_date": e["date"],
                        "deadline": deadline.isoformat(),
                        "days_left": days_left,
                    }
                )

        warranty_days = WARRANTY_WINDOW_DAYS.get(category)
        if warranty_days and price >= WARRANTY_MIN_PRICE:
            deadline = purchase_date + timedelta(days=warranty_days)
            days_left = (deadline - today).days
            if 0 <= days_left <= WARRANTY_LOOKAHEAD_DAYS:
                deadlines.append(
                    {
                        "type": "warranty",
                        "item": e["item_name"],
                        "merchant": e["merchant"],
                        "price": round(price, 2),
                        "purchase_date": e["date"],
                        "deadline": deadline.isoformat(),
                        "days_left": days_left,
                    }
                )

    deadlines.sort(key=lambda d: d["days_left"])
    return deadlines


def compute_budget_status(expenses: list[dict], budgets: dict[str, float], today: date | None = None) -> list[dict]:
    """Compare this month's spend (overall and per-category) against
    whatever budgets the user has set, and flag anything close to or
    over its limit."""
    today = today or date.today()
    current_month = today.strftime("%Y-%m")

    spent_by_category: dict[str, float] = defaultdict(float)
    total_spent = 0.0
    for e in expenses:
        if (e.get("date") or "")[:7] != current_month:
            continue
        amount = e.get("price") or 0
        spent_by_category[e.get("category") or "Other"] += amount
        total_spent += amount

    def _row(label: str, spent: float, budget: float) -> dict:
        pct = round((spent / budget) * 100) if budget else 0
        if pct >= 100:
            status = "over"
        elif pct >= 80:
            status = "close"
        else:
            status = "ok"
        return {"label": label, "spent": round(spent, 2), "budget": round(budget, 2), "pct": pct, "status": status}

    rows = []
    overall_budget = budgets.get("Overall")
    if overall_budget:
        rows.append(_row("Overall", total_spent, overall_budget))

    for category, budget in budgets.items():
        if category == "Overall" or not budget:
            continue
        rows.append(_row(category, spent_by_category.get(category, 0), budget))

    return rows
