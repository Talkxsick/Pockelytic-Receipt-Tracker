import { useEffect, useState } from "react";
import { fetchDeductibleCategories, setDeductibleCategories } from "../api.js";

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
    </div>
  );
}
