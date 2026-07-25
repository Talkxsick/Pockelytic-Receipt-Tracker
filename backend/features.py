"""
Pure-logic helpers for three of the four "life easier" features:
tax-deductible summaries, merchant insights, and savings-goal
progress. Kept dependency-free from FastAPI/SQLite so they're easy to
reason about and test in isolation. (Export/reports logic lives in
reports.py; budgets/price-creep/subscriptions/deadlines live in
smart_alerts.py.)
"""
from collections import defaultdict
from datetime import date, datetime


def resolve_deductible(expense: dict, category_defaults: dict) -> bool:
    """An expense's effective deductible status: an explicit per-item
    override always wins; otherwise fall back to the category default
    set in Settings."""
    override = expense.get("deductible")
    if override is not None:
        return bool(override)
    return bool(category_defaults.get(expense.get("category"), False))


def compute_deductible_summary(expenses: list[dict], category_defaults: dict) -> dict:
    total = 0.0
    by_category: dict[str, float] = defaultdict(float)
    count = 0
    for e in expenses:
        if resolve_deductible(e, category_defaults):
            amount = e.get("price") or 0
            total += amount
            by_category[e.get("category") or "Other"] += amount
            count += 1

    return {
        "total": round(total, 2),
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
        "count": count,
    }


def compute_merchant_insights(expenses: list[dict]) -> list[dict]:
    """Total spend, visit count, and average per visit for every
    merchant -- the kind of number people never add up in their head
    but that changes habits once they see it."""
    by_merchant: dict[str, dict] = defaultdict(
        lambda: {"total": 0.0, "receipt_ids": set(), "categories": defaultdict(float)}
    )
    for e in expenses:
        m = by_merchant[e["merchant"]]
        m["total"] += e.get("price") or 0
        m["receipt_ids"].add(e["receipt_id"])
        m["categories"][e.get("category") or "Other"] += e.get("price") or 0

    rows = []
    for merchant, data in by_merchant.items():
        visits = len(data["receipt_ids"])
        top_category = (
            max(data["categories"].items(), key=lambda kv: kv[1])[0] if data["categories"] else None
        )
        rows.append(
            {
                "merchant": merchant,
                "total": round(data["total"], 2),
                "visits": visits,
                "avg_per_visit": round(data["total"] / visits, 2) if visits else 0,
                "top_category": top_category,
            }
        )

    rows.sort(key=lambda r: -r["total"])
    return rows


def compute_savings_progress(goal: dict | None, contributions: list[dict], today: date | None = None) -> dict | None:
    """How much has been saved toward the goal, whether the current
    contribution pace will hit the target date, and how much per week
    is actually needed from here."""
    if not goal:
        return None
    today = today or date.today()

    saved = round(sum(c["amount"] for c in contributions), 2)
    target = goal["target_amount"]
    remaining = round(max(target - saved, 0), 2)
    pct = round((saved / target) * 100) if target else 0

    try:
        target_date = datetime.strptime(goal["target_date"], "%Y-%m-%d").date()
    except (ValueError, TypeError):
        target_date = None
    try:
        created_date = datetime.strptime(goal["created_at"][:10], "%Y-%m-%d").date()
    except (ValueError, TypeError, KeyError):
        created_date = None

    days_left = (target_date - today).days if target_date else None
    on_track = None
    required_weekly_pace = None
    actual_weekly_pace = None

    if target_date and created_date and days_left is not None:
        days_elapsed = max((today - created_date).days, 1)
        weeks_elapsed = max(days_elapsed / 7, 1 / 7)
        actual_weekly_pace = round(saved / weeks_elapsed, 2)

        weeks_left = max(days_left / 7, 1 / 7)
        required_weekly_pace = round(remaining / weeks_left, 2) if remaining > 0 else 0.0

        on_track = remaining <= 0 or actual_weekly_pace >= required_weekly_pace

    return {
        "name": goal["name"],
        "target_amount": target,
        "target_date": goal["target_date"],
        "saved": saved,
        "remaining": remaining,
        "pct": min(pct, 100),
        "days_left": days_left,
        "on_track": on_track,
        "actual_weekly_pace": actual_weekly_pace,
        "required_weekly_pace": required_weekly_pace,
    }
