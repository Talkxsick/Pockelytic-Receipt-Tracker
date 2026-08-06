import BudgetSettings from "../components/BudgetSettings.jsx";
import BudgetStatus from "../components/BudgetStatus.jsx";
import SavingsGoal from "../components/SavingsGoal.jsx";

export default function BudgetsGoals({ smart, onSaved }) {
  return (
    <>
      <header className="app-header">
        <div>
          <h1 className="app-title">
            Budgets &amp; goals<span>.</span>
          </h1>
          <div className="app-subtitle">set limits and track your savings</div>
        </div>
      </header>

      <h2 className="section-title">Budgets</h2>
      <BudgetSettings onSaved={onSaved} />
      <div className="chart-card" style={{ marginTop: 12 }}>
        {smart && <BudgetStatus rows={smart.budget_status} />}
      </div>

      <h2 className="section-title">Savings goal</h2>
      <SavingsGoal />
    </>
  );
}
