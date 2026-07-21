export default function BudgetStatus({ rows }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="empty-state">
        No budgets set yet — click "Set budgets" above to get alerted before you overspend.
      </div>
    );
  }

  return (
    <div className="budget-status-list">
      {rows.map((r) => (
        <div className="budget-status-row" key={r.label}>
          <div className="budget-status-top">
            <span className="watch-item-name">{r.label}</span>
            <span className={`budget-status-amount ${r.status}`}>
              ${r.spent.toFixed(2)} / ${r.budget.toFixed(2)}
            </span>
          </div>
          <div className="budget-bar-track">
            <div
              className={`budget-bar-fill ${r.status}`}
              style={{ width: `${Math.min(r.pct, 100)}%` }}
            />
          </div>
          {r.status === "over" && (
            <div className="budget-status-note over">
              {r.pct - 100}% over budget this month
            </div>
          )}
          {r.status === "close" && (
            <div className="budget-status-note close">Approaching your limit — {r.pct}% used</div>
          )}
        </div>
      ))}
    </div>
  );
}
