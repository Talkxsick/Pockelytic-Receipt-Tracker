import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import BottomNav from "./components/BottomNav.jsx";
import TopBar from "./components/TopBar.jsx";
import { RouterProvider, Routes, useRouter } from "./router.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import BudgetsGoals from "./pages/BudgetsGoals.jsx";
import Receipts from "./pages/Receipts.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
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

function AppShell() {
  const { navigate } = useRouter();
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
      <Sidebar onScan={() => navigate("/")} />

      <main className="app-main">
        <TopBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            if (value) navigate("/receipts");
          }}
          alertCount={alertCount}
          onBellClick={() => navigate("/")}
          monthLabel={insights?.current_month}
          monthTotal={insights?.current_month_total}
        />

        <Routes
          routes={[
            {
              path: "/",
              element: <Dashboard insights={insights} smart={smart} expenses={expenses} onUploaded={refresh} />,
            },
            {
              path: "/budgets",
              element: <BudgetsGoals smart={smart} onSaved={refresh} />,
            },
            {
              path: "/receipts",
              element: (
                <Receipts
                  receipts={receipts}
                  filteredReceipts={filteredReceipts}
                  itemsByReceipt={itemsByReceipt}
                  deductibleDefaults={deductibleDefaults}
                  filterTab={filterTab}
                  onFilterChange={setFilterTab}
                  onDelete={handleDelete}
                  onToggleDeductible={handleToggleDeductible}
                  expenses={expenses}
                />
              ),
            },
            {
              path: "/settings",
              element: <SettingsPage onSaved={refresh} />,
            },
          ]}
        />
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AppShell />
    </RouterProvider>
  );
}
