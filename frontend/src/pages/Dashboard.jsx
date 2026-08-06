import UploadReceipt from "../components/UploadReceipt.jsx";
import MonthlyChart from "../components/MonthlyChart.jsx";
import MonthlyVariationChart from "../components/MonthlyVariationChart.jsx";
import CategoryPieChart from "../components/CategoryPieChart.jsx";
import SmartAlerts from "../components/SmartAlerts.jsx";

export default function Dashboard({ insights, smart, expenses, onUploaded }) {
  return (
    <>
      <header className="app-header">
        <div>
          <h1 className="app-title">
            Pocketalyst<span>.</span>
          </h1>
          <div className="app-subtitle">receipt scanner &amp; expense dashboard</div>
        </div>
      </header>

      <UploadReceipt onUploaded={onUploaded} />

      {insights && insights.alerts.length > 0 && (
        <div>
          {insights.alerts.map((a, i) => (
            <div className="alert-banner" key={i}>
              {a}
            </div>
          ))}
        </div>
      )}

      {smart &&
        smart.budget_status
          .filter((r) => r.status !== "ok")
          .map((r) => (
            <div className="alert-banner" key={r.label}>
              {r.status === "over"
                ? `${r.label} budget: you're $${(r.spent - r.budget).toFixed(2)} over this month.`
                : `${r.label} budget: ${r.pct}% used this month — getting close.`}
            </div>
          ))}

      {insights && (
        <div className="stat-strip">
          <div className="stat-card yellow">
            <p className="stat-label">Total tracked</p>
            <p className="stat-value">${insights.total_spent.toFixed(2)}</p>
          </div>
          <div className="stat-card pink">
            <p className="stat-label">{insights.current_month || "This month"}</p>
            <p className="stat-value">${insights.current_month_total.toFixed(2)}</p>
          </div>
          <div className="stat-card green">
            <p className="stat-label">Avg / month</p>
            <p className="stat-value">${insights.avg_monthly.toFixed(2)}</p>
          </div>
        </div>
      )}

      <h2 className="section-title">Monthly spend</h2>
      {insights && <MonthlyChart monthly={insights.monthly} />}

      <h2 className="section-title">Month-over-month variation</h2>
      {insights && <MonthlyVariationChart monthly={insights.monthly} />}

      <h2 className="section-title">By category</h2>
      <CategoryPieChart expenses={expenses} />

      <h2 className="section-title">Smart watch</h2>
      <SmartAlerts smart={smart} />
    </>
  );
}
