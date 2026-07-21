"""
Tiny SQLite layer. No ORM on purpose -- this is a single-user local app,
so plain SQL keeps it easy to read and easy to inspect with any SQLite
browser if you want to poke at the data yourself.
"""
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
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS budgets (
            category TEXT PRIMARY KEY,
            amount REAL NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()
