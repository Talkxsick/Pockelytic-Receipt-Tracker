"""
CSV and PDF export of expense data, scoped to all-time, a single
year, or a single month. Deductible status is pre-resolved onto each
expense dict as "_is_deductible" by the caller before these functions
are used.
"""
import csv
import io
from datetime import date


def filter_expenses(expenses: list[dict], scope: str) -> list[dict]:
    """scope is 'all', a 4-digit year ('2026'), or a month ('2026-07')."""
    if scope == "all":
        return expenses
    return [e for e in expenses if (e.get("date") or "").startswith(scope)]


def scope_label(scope: str) -> str:
    if scope == "all":
        return "All time"
    return scope


def generate_csv(expenses: list[dict]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Date", "Merchant", "Item", "Category", "Price", "Tax deductible"])
    for e in sorted(expenses, key=lambda x: x.get("date") or ""):
        writer.writerow(
            [
                e.get("date", ""),
                e.get("merchant", ""),
                e.get("item_name", ""),
                e.get("category", ""),
                f"{e.get('price', 0):.2f}",
                "Yes" if e.get("_is_deductible") else "No",
            ]
        )
    return buffer.getvalue()


def generate_pdf(expenses: list[dict], label: str) -> bytes:
    from fpdf import FPDF

    pdf = FPDF()
    pdf.add_page()

    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "Pocketalyst Expense Report", ln=True)

    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, f"Period: {label}", ln=True)
    pdf.cell(0, 8, f"Generated: {date.today().isoformat()}", ln=True)
    pdf.ln(4)

    total = sum(e.get("price", 0) or 0 for e in expenses)
    deductible_total = sum(e.get("price", 0) or 0 for e in expenses if e.get("_is_deductible"))

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, f"Total spent: ${total:.2f}", ln=True)
    pdf.cell(0, 8, f"Tax-deductible total: ${deductible_total:.2f}", ln=True)
    pdf.ln(4)

    col_widths = [22, 42, 55, 30, 20, 18]
    headers = ["Date", "Merchant", "Item", "Category", "Price", "Ded."]

    pdf.set_font("Helvetica", "B", 10)
    for w, h in zip(col_widths, headers):
        pdf.cell(w, 8, h, border=1)
    pdf.ln()

    pdf.set_font("Helvetica", "", 9)
    for e in sorted(expenses, key=lambda x: x.get("date") or ""):
        pdf.cell(col_widths[0], 7, str(e.get("date", ""))[:10], border=1)
        pdf.cell(col_widths[1], 7, str(e.get("merchant", ""))[:24], border=1)
        pdf.cell(col_widths[2], 7, str(e.get("item_name", ""))[:32], border=1)
        pdf.cell(col_widths[3], 7, str(e.get("category", ""))[:16], border=1)
        pdf.cell(col_widths[4], 7, f"${e.get('price', 0):.2f}", border=1)
        pdf.cell(col_widths[5], 7, "Y" if e.get("_is_deductible") else "N", border=1)
        pdf.ln()

    output = pdf.output()
    return bytes(output)
