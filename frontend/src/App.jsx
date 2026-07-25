import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import UploadReceipt from "./components/UploadReceipt.jsx";
import ReceiptTape from "./components/ReceiptTape.jsx";
import ReceiptFilterTabs from "./components/ReceiptFilterTabs.jsx";
import MonthlyChart from "./components/MonthlyChart.jsx";
import MonthlyVariationChart from "./components/MonthlyVariationChart.jsx";
import CategoryPieChart from "./components/CategoryPieChart.jsx";
import SmartAlerts from "./components/SmartAlerts.jsx";
import BudgetSettings from "./components/BudgetSettings.jsx";
import BudgetStatus from "./components/BudgetStatus.jsx";
import SavingsGoal from "./components/SavingsGoal.jsx";
import MerchantInsights from "./components/MerchantInsights.jsx";
import ExportPanel from "./components/ExportPanel.jsx";
import Settings from "./components/Settings.jsx";
import {
  fetchReceipts,
  fetchExpenses,
  fetchInsights,
  fetchSmartInsights,
  fetchDeductibleCategories,
  setExpenseDeductible,
  deleteReceipt,
} from "./api.js";

function receiptMatchesSearch(receipt, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (receipt.merchant.toLowerCase().includes(q)) return true;
  try {
    const items = JSON.parse(receipt.raw_json || "{}").items || [];
    return items.some((item) => item.name?.toLowerCase().includes(q));
  } catch {
    return false;
  }
}

function resolveDeductible(item, deductibleDefaults) {
  if (item.deductible === null || item.deductible === undefined) {
    return !!deductibleDefaults[item.category];
  }
  return !!item.deductible;
}

export default function App() {
  const [receipts, setReceipts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [insights, setInsights] = useState(null);
  const [smart, setSmart] = useState(null);
  const [deductibleDefaults, setDeductibleDefaults] = useState({});
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");

  async function refresh() {
    const [r, e, i, s, d] = await Promise.all([
      fetchReceipts(),
      fetchExpenses(),
      fetchInsights(),
      fetchSmartInsights(),
      fetchDeductibleCategories(),
    ]);
    setReceipts(r);
    setExpenses(e);
    setInsights(i);
    setSmart(s);
    setDeductibleDefaults(d);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id) {
    await deleteReceipt(id);
    refresh();
  }

  async function handleToggleDeductible(expenseId, value) {
    await setExpenseDeductible(expenseId, value);
    refresh();
  }

  const itemsByReceipt = useMemo(() => {
    const map = {};
    for (const e of expenses) {
      (map[e.receipt_id] ||= []).push(e);
    }
    return map;
  }, [expenses]);

  const filteredReceipts = useMemo(() => {
    const currentMonth = insights?.current_month;
    return receipts.filter((r) => {
      if (!receiptMatchesSearch(r, search)) return false;
      if (filterTab === "month" && currentMonth) return r.date.startsWith(currentMonth);
      if (filterTab === "deductible") {
        const items = itemsByReceipt[r.id] || [];
        return items.some((item) => resolveDeductible(item, deductibleDefaults));
      }
      return true;
    });
  }, [receipts, search, filterTab, insights, itemsByReceipt, deductibleDefaults]);

  const alertCount =
    (insights?.alerts.length || 0) +
    (smart?.budget_status.filter((r) => r.status !== "ok").length || 0) +
    (smart?.deadlines.length || 0);

  return (
    <div className="app-shell">
      <Sidebar onScan={() => window.scrollTo({ top: 0, behavior: "smooth" })} />

      <main className="app-main">
        <TopBar
          search={search}
          onSearchChange={setSearch}
          alertCount={alertCount}
          onBellClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          monthLabel={insights?.current_month}
          monthTotal={insights?.current_month_total}
        />

        <header className="app-header" id="overview">
          <div>
            <h1 className="app-title">
              Pocketalyst<span>.</span>
            </h1>
            <div className="app-subtitle">receipt scanner &amp; expense dashboard</div>
          </div>
        </header>

        <UploadReceipt onUploaded={refresh} />

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

        <h2 className="section-title" id="budgets">
          Budgets
        </h2>
        <BudgetSettings onSaved={refresh} />
        <div className="chart-card" style={{ marginTop: 12 }}>
          {smart && <BudgetStatus rows={smart.budget_status} />}
        </div>

        <h2 className="section-title" id="goals">
          Savings goal
        </h2>
        <SavingsGoal />

        <h2 className="section-title">Monthly spend</h2>
        {insights && <MonthlyChart monthly={insights.monthly} />}

        <h2 className="section-title">Month-over-month variation</h2>
        {insights && <MonthlyVariationChart monthly={insights.monthly} />}

        <h2 className="section-title">By category</h2>
        <CategoryPieChart expenses={expenses} />

        <div id="watch">
          <SmartAlerts smart={smart} />
        </div>

        <h2 className="section-title" id="merchants">
          Merchant insights
        </h2>
        <MerchantInsights />

        <h2 className="section-title" id="receipts">
          Recent receipts
        </h2>
        <ReceiptFilterTabs active={filterTab} onChange={setFilterTab} />
        <div className="tape-list">
          {filteredReceipts.length === 0 && receipts.length === 0 && (
            <div className="empty-state">No receipts yet — scan your first one above.</div>
          )}
          {filteredReceipts.length === 0 && receipts.length > 0 && (
            <div className="empty-state">No receipts match this filter.</div>
          )}
          {filteredReceipts.map((r) => (
            <ReceiptTape
              key={r.id}
              receipt={r}
              items={itemsByReceipt[r.id] || []}
              deductibleDefaults={deductibleDefaults}
              onDelete={handleDelete}
              onToggleDeductible={handleToggleDeductible}
            />
          ))}
        </div>

        <h2 className="section-title" id="export">
          Export &amp; reports
        </h2>
        <ExportPanel expenses={expenses} />

        <h2 className="section-title" id="settings">
          Settings
        </h2>
        <Settings onSaved={refresh} />
      </main>
    </div>
  );
}
