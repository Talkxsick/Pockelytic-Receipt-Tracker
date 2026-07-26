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

...plus a layer of tools for actually acting on that data: **budgets**
with over/close alerts, a **savings goal** tracker, **tax-deductible**
flagging with CSV/PDF **export**, and **merchant insights** showing
where your money quietly concentrates.

```
pocketalyst/
├── backend/          FastAPI + Gemini vision + SQLite
│   ├── main.py
│   ├── database.py
│   ├── receipt_processor.py
│   ├── smart_alerts.py      # price watch, subscriptions, deadlines, budgets
│   ├── features.py          # deductible summary, merchant insights, savings progress
│   ├── reports.py           # CSV/PDF export
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
```

**Set your API key once, permanently** — copy `.env.example` to `.env`
in the `backend/` folder and put your real key in it:

```
GEMINI_API_KEY=your-actual-key-here
```

(Windows: `copy .env.example .env` then edit it in Notepad; Mac/Linux:
`cp .env.example .env`.) The app loads this file automatically on
startup, so you never need to `export`/`set` the key in your terminal
again — it works the same way every time you open the project, in any
terminal. `.env` is already gitignored, so the key won't get committed
if you push this to git.

Then just run:

```bash
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

<details>
<summary>Prefer setting it as a real environment variable instead?</summary>

If you'd rather not use a `.env` file, you can set `GEMINI_API_KEY`
permanently at the OS level so every new terminal already has it,
without a `.env` file:

- **Windows (PowerShell):**
  `[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "your-key", "User")`
  then close and reopen your terminal.
- **Mac/Linux:** add `export GEMINI_API_KEY=your-key` to `~/.zshrc` or
  `~/.bashrc`, then run `source ~/.zshrc` (or open a new terminal).

If both a `.env` file and a real environment variable are set, the
real environment variable wins.
</details>

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

## The four "make it more useful" features

- **Export & reports** — go to the **Export** section, pick a period
  (all time / a year / a month), and download a CSV (for
  spreadsheets) or a PDF (for printing/filing). Both include a
  Tax-deductible column so a report doubles as backup for a tax
  filing.
- **Tax-deductible flagging** — go to **Settings** to turn on
  deductible-by-default for whole categories (e.g. Transport for a
  freelancer). Any individual line item on a receipt can still be
  overridden with its own toggle, which always wins over the category
  default — click it to cycle default → deductible → not deductible →
  back to default.
- **Savings goal** — set one active goal (name, target amount, target
  date) under **Savings goal**, then log contributions as you save.
  The progress bar and "on track / behind pace" indicator are driven
  by your actual logged contributions and the time remaining, not a
  guess from your spending.
- **Merchant insights** — the **Merchants** section ranks every place
  you've scanned a receipt from by total spent, visit count, and
  average per visit — the "you've spent $340 at Starbucks across 42
  visits" number that's hard to add up in your head.

All four read/write the same SQLite file as everything else — no new
services, no extra setup beyond the one `pip install` for the new
`fpdf2` dependency (PDF export).

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

## Deploying it live

Full step-by-step instructions (Vercel for the frontend, Railway/Render
for the backend, including making SQLite persist and locking down
CORS) are in **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
