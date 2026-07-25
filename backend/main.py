import json
from collections import defaultdict
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from database import CATEGORIES, get_db, get_setting, init_db, set_setting
from features import compute_deductible_summary, compute_merchant_insights, compute_savings_progress, resolve_deductible
from receipt_processor import process_receipt_image
from reports import filter_expenses, generate_csv, generate_pdf, scope_label
from smart_alerts import compute_budget_status, compute_deadlines, detect_price_creep, detect_recurring_charges

app = FastAPI(title="Receipt Scanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # local single-user app; tighten if you deploy this
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/receipts/upload")
async def upload_receipt(file: UploadFile = File(...)):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file upload.")

    try:
        parsed = process_receipt_image(image_bytes, file.content_type or "image/jpeg")
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Could not read receipt: {exc}") from exc

    date = parsed.get("date") or datetime.now().strftime("%Y-%m-%d")

    db = get_db()
    cur = db.cursor()
    cur.execute(
        "INSERT INTO receipts (merchant, date, total, raw_json, created_at) "
        "VALUES (?, ?, ?, ?, ?)",
        (parsed["merchant"], date, parsed["total"], json.dumps(parsed), datetime.now().isoformat()),
    )
    receipt_id = cur.lastrowid

    for item in parsed["items"]:
        cur.execute(
            "INSERT INTO expenses (receipt_id, merchant, date, item_name, price, category) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (receipt_id, parsed["merchant"], date, item["name"], item["price"], item["category"]),
        )

    db.commit()
    db.close()

    return {"receipt_id": receipt_id, **parsed, "date": date}


@app.get("/api/receipts")
def list_receipts():
    db = get_db()
    rows = db.execute("SELECT * FROM receipts ORDER BY date DESC, id DESC").fetchall()
    db.close()
    return [dict(r) for r in rows]


@app.get("/api/expenses")
def list_expenses():
    db = get_db()
    rows = db.execute("SELECT * FROM expenses ORDER BY date DESC, id DESC").fetchall()
    db.close()
    return [dict(r) for r in rows]


@app.delete("/api/receipts/{receipt_id}")
def delete_receipt(receipt_id: int):
    db = get_db()
    cur = db.cursor()
    cur.execute("DELETE FROM receipts WHERE id = ?", (receipt_id,))
    if cur.rowcount == 0:
        db.close()
        raise HTTPException(status_code=404, detail="Receipt not found.")
    db.commit()
    db.close()
    return {"status": "deleted", "receipt_id": receipt_id}


@app.get("/api/insights")
def get_insights():
    db = get_db()
    expenses = [dict(r) for r in db.execute("SELECT * FROM expenses").fetchall()]
    db.close()

    monthly = defaultdict(float)
    category = defaultdict(float)
    for e in expenses:
        month = (e["date"] or "")[:7]  # "YYYY-MM"
        monthly[month] += e["price"] or 0
        category[e["category"] or "Other"] += e["price"] or 0

    months_sorted = sorted(monthly.keys())
    current_month = months_sorted[-1] if months_sorted else None
    prior_months = months_sorted[:-1]
    avg_prior = sum(monthly[m] for m in prior_months) / len(prior_months) if prior_months else 0
    current_total = monthly.get(current_month, 0) if current_month else 0

    alerts = []
    if current_month and avg_prior > 0 and current_total > avg_prior * 1.2:
        pct = round((current_total / avg_prior - 1) * 100)
        alerts.append(f"You're {pct}% above your average monthly spend this month.")
    elif current_month and avg_prior > 0 and current_total < avg_prior * 0.8:
        pct = round((1 - current_total / avg_prior) * 100)
        alerts.append(f"Nice -- you're {pct}% under your average monthly spend this month.")

    if category:
        top_cat, top_amt = max(category.items(), key=lambda kv: kv[1])
        if current_total > 0:
            share = round(top_amt / sum(category.values()) * 100)
            alerts.append(f"{top_cat} is your biggest category at {share}% of total spend.")

    return {
        "monthly": dict(sorted(monthly.items())),
        "category": dict(sorted(category.items(), key=lambda kv: -kv[1])),
        "total_spent": round(sum(monthly.values()), 2),
        "current_month": current_month,
        "current_month_total": round(current_total, 2),
        "avg_monthly": round(avg_prior, 2),
        "alerts": alerts,
    }


class BudgetInput(BaseModel):
    amount: float


@app.get("/api/budgets")
def list_budgets():
    db = get_db()
    rows = db.execute("SELECT category, amount FROM budgets").fetchall()
    db.close()
    return {r["category"]: r["amount"] for r in rows}


@app.put("/api/budgets/{category}")
def set_budget(category: str, body: BudgetInput):
    db = get_db()
    if body.amount <= 0:
        db.execute("DELETE FROM budgets WHERE category = ?", (category,))
    else:
        db.execute(
            "INSERT INTO budgets (category, amount) VALUES (?, ?) "
            "ON CONFLICT(category) DO UPDATE SET amount = excluded.amount",
            (category, body.amount),
        )
    db.commit()
    db.close()
    return {"category": category, "amount": body.amount}


@app.delete("/api/budgets/{category}")
def delete_budget(category: str):
    db = get_db()
    db.execute("DELETE FROM budgets WHERE category = ?", (category,))
    db.commit()
    db.close()
    return {"status": "deleted", "category": category}


@app.get("/api/smart-insights")
def get_smart_insights():
    db = get_db()
    expenses = [dict(r) for r in db.execute("SELECT * FROM expenses").fetchall()]
    receipts = [dict(r) for r in db.execute("SELECT * FROM receipts").fetchall()]
    budgets = {r["category"]: r["amount"] for r in db.execute("SELECT category, amount FROM budgets").fetchall()}
    db.close()

    return {
        "price_creep": detect_price_creep(expenses),
        "subscriptions": detect_recurring_charges(receipts),
        "deadlines": compute_deadlines(expenses),
        "budget_status": compute_budget_status(expenses, budgets),
    }


class DeductibleCategoriesInput(BaseModel):
    categories: dict[str, bool]


class ExpenseDeductibleInput(BaseModel):
    deductible: Optional[bool] = None  # None resets to the category default


@app.get("/api/settings/deductible-categories")
def get_deductible_categories():
    defaults = get_setting("deductible_categories", {})
    # Always return every known category so the Settings UI has a full grid.
    return {cat: bool(defaults.get(cat, False)) for cat in CATEGORIES}


@app.put("/api/settings/deductible-categories")
def set_deductible_categories(body: DeductibleCategoriesInput):
    set_setting("deductible_categories", body.categories)
    return body.categories


@app.patch("/api/expenses/{expense_id}/deductible")
def set_expense_deductible(expense_id: int, body: ExpenseDeductibleInput):
    db = get_db()
    cur = db.cursor()
    value = None if body.deductible is None else int(body.deductible)
    cur.execute("UPDATE expenses SET deductible = ? WHERE id = ?", (value, expense_id))
    if cur.rowcount == 0:
        db.close()
        raise HTTPException(status_code=404, detail="Expense not found.")
    db.commit()
    db.close()
    return {"id": expense_id, "deductible": body.deductible}


@app.get("/api/deductible-summary")
def get_deductible_summary(scope: str = "all"):
    db = get_db()
    expenses = [dict(r) for r in db.execute("SELECT * FROM expenses").fetchall()]
    db.close()

    category_defaults = get_setting("deductible_categories", {})
    filtered = filter_expenses(expenses, scope)
    return compute_deductible_summary(filtered, category_defaults)


@app.get("/api/merchant-insights")
def get_merchant_insights():
    db = get_db()
    expenses = [dict(r) for r in db.execute("SELECT * FROM expenses").fetchall()]
    db.close()
    return compute_merchant_insights(expenses)


class SavingsGoalInput(BaseModel):
    name: str
    target_amount: float
    target_date: str  # "YYYY-MM-DD"


class ContributionInput(BaseModel):
    amount: float
    date: Optional[str] = None
    note: Optional[str] = None


@app.get("/api/savings-goal")
def get_savings_goal():
    db = get_db()
    goal_row = db.execute("SELECT * FROM savings_goal WHERE id = 1").fetchone()
    contributions = [
        dict(r) for r in db.execute("SELECT * FROM savings_contributions ORDER BY date DESC, id DESC").fetchall()
    ]
    db.close()

    goal = dict(goal_row) if goal_row else None
    return {
        "goal": goal,
        "contributions": contributions,
        "progress": compute_savings_progress(goal, contributions),
    }


@app.put("/api/savings-goal")
def set_savings_goal(body: SavingsGoalInput):
    db = get_db()
    db.execute(
        "INSERT INTO savings_goal (id, name, target_amount, target_date, created_at) "
        "VALUES (1, ?, ?, ?, ?) "
        "ON CONFLICT(id) DO UPDATE SET name = excluded.name, target_amount = excluded.target_amount, "
        "target_date = excluded.target_date",
        (body.name, body.target_amount, body.target_date, datetime.now().isoformat()),
    )
    db.commit()
    db.close()
    return {"status": "saved"}


@app.delete("/api/savings-goal")
def delete_savings_goal():
    db = get_db()
    db.execute("DELETE FROM savings_goal WHERE id = 1")
    db.execute("DELETE FROM savings_contributions")
    db.commit()
    db.close()
    return {"status": "deleted"}


@app.post("/api/savings-goal/contributions")
def add_contribution(body: ContributionInput):
    db = get_db()
    cur = db.cursor()
    cur.execute(
        "INSERT INTO savings_contributions (amount, date, note) VALUES (?, ?, ?)",
        (body.amount, body.date or datetime.now().strftime("%Y-%m-%d"), body.note),
    )
    db.commit()
    contribution_id = cur.lastrowid
    db.close()
    return {"id": contribution_id}


@app.delete("/api/savings-goal/contributions/{contribution_id}")
def delete_contribution(contribution_id: int):
    db = get_db()
    db.execute("DELETE FROM savings_contributions WHERE id = ?", (contribution_id,))
    db.commit()
    db.close()
    return {"status": "deleted"}


def _expenses_with_deductible_flag() -> list[dict]:
    db = get_db()
    expenses = [dict(r) for r in db.execute("SELECT * FROM expenses").fetchall()]
    db.close()
    category_defaults = get_setting("deductible_categories", {})
    for e in expenses:
        e["_is_deductible"] = resolve_deductible(e, category_defaults)
    return expenses


@app.get("/api/export/csv")
def export_csv(scope: str = "all"):
    filtered = filter_expenses(_expenses_with_deductible_flag(), scope)
    csv_text = generate_csv(filtered)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="pocketalyst-{scope}.csv"'},
    )


@app.get("/api/export/pdf")
def export_pdf(scope: str = "all"):
    filtered = filter_expenses(_expenses_with_deductible_flag(), scope)
    try:
        pdf_bytes = generate_pdf(filtered, scope_label(scope))
    except ModuleNotFoundError as exc:
        raise HTTPException(
            status_code=500,
            detail="PDF export needs the fpdf2 package. Run `pip install -r requirements.txt` "
            "again in your backend venv, then restart the server.",
        ) from exc
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="pocketalyst-{scope}.pdf"'},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
