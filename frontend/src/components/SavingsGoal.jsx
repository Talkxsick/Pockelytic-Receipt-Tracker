import { useEffect, useState } from "react";
import { fetchSavingsGoal, setSavingsGoal, deleteSavingsGoal, addContribution, deleteContribution } from "../api.js";

function GoalForm({ onSaved }) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name || !targetAmount || !targetDate) return;
    setSaving(true);
    try {
      await setSavingsGoal({ name, target_amount: parseFloat(targetAmount), target_date: targetDate });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="goal-form" onSubmit={handleSubmit}>
      <p className="settings-block-title">Set a savings goal</p>
      <input
        className="goal-input"
        placeholder="What are you saving for? (e.g. Trip to Japan)"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="goal-form-row">
        <div className="budget-input-wrap">
          <span>$</span>
          <input
            type="number"
            min="0"
            placeholder="Target amount"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
          />
        </div>
        <input
          className="goal-date-input"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
      </div>
      <button className="upload-btn" type="submit" disabled={saving}>
        {saving ? "Saving…" : "Start goal"}
      </button>
    </form>
  );
}

function GoalProgress({ goal, progress, contributions, onChanged }) {
  const [amount, setAmount] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    if (!amount) return;
    setAdding(true);
    try {
      await addContribution({ amount: parseFloat(amount) });
      setAmount("");
      onChanged();
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteGoal() {
    await deleteSavingsGoal();
    onChanged();
  }

  return (
    <div>
      <div className="goal-header">
        <div>
          <p className="settings-block-title" style={{ marginBottom: 2 }}>
            {goal.name}
          </p>
          <p className="settings-block-hint" style={{ margin: 0 }}>
            Target ${goal.target_amount.toFixed(2)} by {goal.target_date}
          </p>
        </div>
        <button className="budget-cancel" onClick={handleDeleteGoal}>
          delete goal
        </button>
      </div>

      <div className="budget-bar-track" style={{ height: 12, marginTop: 14 }}>
        <div
          className={`budget-bar-fill ${progress.on_track === false ? "over" : ""}`}
          style={{ width: `${Math.min(progress.pct, 100)}%` }}
        />
      </div>

      <div className="goal-stats-row">
        <div>
          <p className="stat-label">Saved</p>
          <p className="stat-value" style={{ fontSize: 20 }}>
            ${progress.saved.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="stat-label">Remaining</p>
          <p className="stat-value" style={{ fontSize: 20 }}>
            ${progress.remaining.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="stat-label">Days left</p>
          <p className="stat-value" style={{ fontSize: 20 }}>
            {progress.days_left ?? "—"}
          </p>
        </div>
      </div>

      {progress.on_track !== null && (
        <div className={`watch-card${progress.on_track ? "" : " urgent"}`} style={{ marginTop: 14 }}>
          <div className="watch-card-top">
            <span className="watch-item-name">{progress.on_track ? "On track 🎯" : "Behind pace"}</span>
            <span className={`watch-pct${progress.on_track ? " green" : ""}`}>
              ${progress.actual_weekly_pace}/wk actual
            </span>
          </div>
          <div className="watch-card-detail">
            {progress.remaining > 0
              ? `Needs about $${progress.required_weekly_pace}/week from here to hit your date.`
              : "Goal reached — nice work."}
          </div>
        </div>
      )}

      <form className="goal-form-row" style={{ marginTop: 16 }} onSubmit={handleAdd}>
        <div className="budget-input-wrap">
          <span>$</span>
          <input
            type="number"
            min="0"
            placeholder="Add contribution"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <button className="upload-btn" type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add"}
        </button>
      </form>

      {contributions.length > 0 && (
        <div className="goal-contributions">
          {contributions.slice(0, 6).map((c) => (
            <div className="goal-contribution-row" key={c.id}>
              <span>{c.date}</span>
              <span>${c.amount.toFixed(2)}</span>
              <button
                className="tape-delete"
                onClick={async () => {
                  await deleteContribution(c.id);
                  onChanged();
                }}
              >
                remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SavingsGoal() {
  const [data, setData] = useState(null);

  async function refresh() {
    const d = await fetchSavingsGoal();
    setData(d);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (!data) return null;

  return (
    <div className="chart-card">
      {data.goal ? (
        <GoalProgress goal={data.goal} progress={data.progress} contributions={data.contributions} onChanged={refresh} />
      ) : (
        <GoalForm onSaved={refresh} />
      )}
    </div>
  );
}
