import { useEffect, useState } from "react";
import { fetchBudgets, setBudget } from "../api.js";

const CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Shopping",
  "Health",
  "Entertainment",
  "Utilities",
  "Other",
];

export default function BudgetSettings({ onSaved }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBudgets().then((b) => setValues(b));
  }, []);

  function handleChange(category, raw) {
    setValues((v) => ({ ...v, [category]: raw }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const entries = Object.entries(values);
      await Promise.all(
        entries.map(([category, amount]) => setBudget(category, parseFloat(amount) || 0))
      );
      onSaved();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button className="budget-toggle" onClick={() => setOpen(true)}>
        Set budgets
      </button>
    );
  }

  return (
    <div className="budget-panel">
      <div className="budget-row">
        <label htmlFor="budget-overall">Overall monthly budget</label>
        <div className="budget-input-wrap">
          <span>$</span>
          <input
            id="budget-overall"
            type="number"
            min="0"
            placeholder="0"
            value={values.Overall ?? ""}
            onChange={(e) => handleChange("Overall", e.target.value)}
          />
        </div>
      </div>

      <div className="budget-divider" />

      {CATEGORIES.map((cat) => (
        <div className="budget-row" key={cat}>
          <label htmlFor={`budget-${cat}`}>{cat}</label>
          <div className="budget-input-wrap">
            <span>$</span>
            <input
              id={`budget-${cat}`}
              type="number"
              min="0"
              placeholder="0"
              value={values[cat] ?? ""}
              onChange={(e) => handleChange(cat, e.target.value)}
            />
          </div>
        </div>
      ))}

      <div className="budget-actions">
        <button className="upload-btn" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save budgets"}
        </button>
        <button className="budget-cancel" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
