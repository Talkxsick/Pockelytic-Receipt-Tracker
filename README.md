# Pocketalyst — AI Receipt Scanner & Expense Tracker

Photo a receipt → Gemini's vision model reads it → items, prices, and
categories land in a local SQLite ledger → a dashboard shows monthly
spend, category breakdown, and three things people usually only
notice months too late:

- **Price watch** — flags an item you've bought before that quietly got
  more expensive (shrinkflation/inflation you'd never remember on your own)
- **Recurring charges** — detects merchants billing you on a roughly
  monthly cadence and totals up what that's silently costing you
- **Return & warranty deadlines** — surfaces purchases whose return
  window or manufacturer warranty is about to close

```
receipt-tracker/
├── backend/          FastAPI + Gemini vision + SQLite
│   ├── main.py
│   ├── database.py
│   ├── receipt_processor.py
│   └── requirements.txt
└── frontend/          React (Vite) dashboard
    └── src/
```

## 1. Backend setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

export GEMINI_API_KEY=...       # Windows: set GEMINI_API_KEY=...

python main.py
```

This starts the API on `http://localhost:8000`. A `expenses.db` SQLite
file is created automatically in `backend/` on first run — no setup
needed.

**Get a free Gemini API key:** go to
[aistudio.google.com/apikey](https://aistudio.google.com/apikey), sign
in with a Google account, and click **Create API key** — no credit
card required. The receipt-reading call uses `gemini-2.5-flash`, which
is on Gemini's free tier (rate-limited, but plenty for personal use —
check current limits at ai.google.dev/gemini-api/docs/pricing since
Google adjusts them periodically).

## 2. Frontend setup

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api`
requests to the backend on port 8000, so both must be running.

## 3. Using it

- Click **Scan a receipt** and pick or photograph a receipt image.
- Gemini extracts merchant, date, line items, categories, and total.
- The dashboard updates: total tracked, this month's spend vs. your
  average, a monthly bar chart, a category breakdown, a scrolling
  list of past receipts styled like torn receipt tape, and the three
  smart-alert panels below (price watch, recurring charges, deadlines).
- Alerts appear automatically when a month runs notably above or
  below your average, or call out your top spending category.
- Click **remove** on any receipt to delete it (and its line items).

## How the three "hidden problem" features work

All three run entirely off data you already have from scanning receipts
— no extra input needed. Logic lives in `backend/smart_alerts.py`,
exposed via `GET /api/smart-insights`.

- **Price watch** — groups items by merchant and fuzzy-matches similar
  item names (handles small wording differences like "Whole Milk 1gal"
  vs "Milk 1 Gallon"). If the same item's price rose more than 10%
  between its earliest and latest purchase, it's flagged.
- **Recurring charges** — groups receipts by merchant and checks for a
  roughly 25–35 day gap between visits with a stable amount (within
  15%) — the fingerprint of a subscription, whether or not it's
  labeled one.
- **Return & warranty deadlines** — applies a return window to
  `Shopping`/`Entertainment` category items (30 / 14 days) and a
  365-day warranty window to `Shopping` items over $50, then surfaces
  any that are closing within the next 1–3 weeks. These are simple
  fixed rules, not store-specific policies — treat them as a nudge to
  double-check, not a guarantee.

## How the AI part works

`backend/receipt_processor.py` sends the uploaded photo to Gemini
(`gemini-2.5-flash`) with a system prompt that asks for a fixed JSON
schema: merchant, date, items (name/price/category), and total. The
call sets `response_mime_type="application/json"` so Gemini returns
clean JSON directly. FastAPI then writes that structured data into two
SQLite tables (`receipts` and `expenses`), which the `/api/insights`
endpoint aggregates into monthly and category totals for the
dashboard.

**Note on the free tier:** Gemini's free tier is rate- and
quota-limited (requests per minute/day), and Google may use free-tier
inputs/outputs to improve their models — check
[ai.google.dev/gemini-api/docs/pricing](https://ai.google.dev/gemini-api/docs/pricing)
for current terms and limits before relying on it for anything
sensitive. If you outgrow it, enabling billing on the same project
switches you to paid, non-training-data usage without any code
changes.

## Notes on deploying it live

This runs entirely locally by default. To put it on a free tier like
Railway or Render:

- Deploy `backend/` as a Python web service; set `GEMINI_API_KEY`
  as an environment variable in that platform's dashboard (never
  commit it to git).
- SQLite works fine for a low-traffic personal demo, but most
  platforms' filesystems are ephemeral on redeploy — for a persistent
  demo, swap `database.py` for a hosted Postgres instance (a handful
  of `sqlite3` calls would need to become `psycopg`/SQLAlchemy calls).
- Deploy `frontend/` as a static build (`npm run build` → the `dist/`
  folder) and point its API calls at the backend's public URL instead
  of the local Vite proxy.
