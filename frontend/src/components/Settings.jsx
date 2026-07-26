import { useEffect, useState } from "react";
import { fetchDeductibleCategories, setDeductibleCategories, resetData } from "../api.js";

const RESET_OPTIONS = [
  { id: "receipts", label: "Receipts & expenses", hint: "Every scanned receipt and its line items" },
  { id: "budgets", label: "Budgets", hint: "Your overall and per-category budget targets" },
  { id: "savings", label: "Savings goal", hint: "Your goal and every logged contribution" },
  { id: "settings", label: "Deductible settings", hint: "Your per-category tax-deductible defaults" },
];

function DangerZone({ onReset }) {
  const [confirming, setConfirming] = useState(false);
  const [selected, setSelected] = useState([]);
  const [confirmText, setConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);

  function toggleTarget(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function startConfirm() {
    if (selected.length === 0) return;
    setConfirming(true);
  }

  async function handleConfirmedReset() {
    setResetting(true);
    try {
      await resetData(selected);
      onReset?.();
      setConfirming(false);
      setConfirmText("");
      setSelected([]);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="danger-zone">
      <p className="settings-block-title" style={{ color: "var(--red)" }}>
        Danger zone
      </p>
      <p className="settings-block-hint">
        Pick exactly what to wipe. Deleted data can't be recovered — there's no backup kept
        anywhere.
      </p>

      <div className="reset-option-list">
        {RESET_OPTIONS.map((opt) => (
          <label key={opt.id} className="reset-option-row">
            <input
              type="checkbox"
              checked={selected.includes(opt.id)}
              onChange={() => toggleTarget(opt.id)}
            />
            <span>
              <span className="reset-option-label">{opt.label}</span>
              <span className="reset-option-hint">{opt.hint}</span>
            </span>
          </label>
        ))}
      </div>

      {!confirming ? (
        <button className="danger-btn" disabled={selected.length === 0} onClick={startConfirm}>
          Reset selected data
        </button>
      ) : (
        <div className="danger-confirm">
          <p className="settings-block-hint" style={{ margin: "0 0 8px" }}>
            This will permanently delete: <strong>{selected.map((id) => RESET_OPTIONS.find((o) => o.id === id)?.label).join(", ")}</strong>.
            Type <strong>RESET</strong> to confirm.
          </p>
          <div className="goal-form-row">
            <input
              className="goal-input"
              style={{ flex: 1 }}
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET"
            />
            <button
              className="danger-btn"
              disabled={confirmText !== "RESET" || resetting}
              onClick={handleConfirmedReset}
            >
              {resetting ? "Resetting…" : "Confirm reset"}
            </button>
            <button
              className="budget-cancel"
              onClick={() => {
                setConfirming(false);
                setConfirmText("");
              }}
            >
              cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Settings({ onSaved }) {
  const [categories, setCategories] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchDeductibleCategories().then(setCategories);
  }, []);

  function toggle(cat) {
    setCategories((c) => ({ ...c, [cat]: !c[cat] }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await setDeductibleCategories(categories);
      setSaved(true);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="chart-card">
      <div className="settings-block">
        <p className="settings-block-title">Tax-deductible categories</p>
        <p className="settings-block-hint">
          Turn on any category that's deductible by default for you (e.g. Transport for a
          freelancer). You can still override any single item on its receipt card — that
          override always wins over these defaults.
        </p>

        <div className="settings-toggle-grid">
          {Object.entries(categories).map(([cat, enabled]) => (
            <button
              key={cat}
              className={`settings-toggle${enabled ? " on" : ""}`}
              onClick={() => toggle(cat)}
              type="button"
            >
              <span className="settings-toggle-dot" />
              {cat}
            </button>
          ))}
        </div>

        <div className="budget-actions">
          <button className="upload-btn" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
          </button>
        </div>
      </div>

      <DangerZone onReset={onSaved} />
    </div>
  );
}
