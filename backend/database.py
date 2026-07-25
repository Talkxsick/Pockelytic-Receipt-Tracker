"""
Tiny SQLite layer. No ORM on purpose -- this is a single-user local app,
so plain SQL keeps it easy to read and easy to inspect with any SQLite
browser if you want to poke at the data yourself.
"""
import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "expenses.db"

CATEGORIES = [
    "Groceries", "Dining", "Transport", "Shopping",
    "Health", "Entertainment", "Utilities", "Other",
]


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            merchant TEXT NOT NULL,
            date TEXT NOT NULL,
            total REAL NOT NULL DEFAULT 0,
            raw_json TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER NOT NULL,
            merchant TEXT NOT NULL,
            date TEXT NOT NULL,
            item_name TEXT NOT NULL,
            price REAL NOT NULL DEFAULT 0,
            category TEXT NOT NULL DEFAULT 'Other',
            FOREIGN KEY (receipt_id) REFERENCES receipts (id) ON DELETE CASCADE
        )
        """
    )

    # Migration: add the "deductible" column to pre-existing databases.
    # NULL = "use the category default", 0/1 = explicit per-item override.
    cols = [r["name"] for r in conn.execute("PRAGMA table_info(expenses)").fetchall()]
    if "deductible" not in cols:
        conn.execute("ALTER TABLE expenses ADD COLUMN deductible INTEGER")

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS budgets (
            category TEXT PRIMARY KEY,
            amount REAL NOT NULL
        )
        """
    )

    # Generic key/value store for app-wide settings (JSON-encoded values).
    # Currently holds deductible-category defaults; the single place any
    # future "mode" toggle should live, per the app's settings section.
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        """
    )

    # Single-row table (id is always 1) holding the one active savings goal.
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS savings_goal (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            target_date TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS savings_contributions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            note TEXT
        )
        """
    )

    conn.commit()
    conn.close()


def get_setting(key: str, default=None):
    conn = get_db()
    row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
    conn.close()
    if row is None:
        return default
    return json.loads(row["value"])


def set_setting(key: str, value) -> None:
    conn = get_db()
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?, ?) "
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        (key, json.dumps(value)),
    )
    conn.commit()
    conn.close()
