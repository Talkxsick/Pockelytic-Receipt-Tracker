const BASE = "/api";

async function handle(res) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function uploadReceipt(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/receipts/upload`, {
    method: "POST",
    body: formData,
  });
  return handle(res);
}

export async function fetchReceipts() {
  const res = await fetch(`${BASE}/receipts`);
  return handle(res);
}

export async function fetchExpenses() {
  const res = await fetch(`${BASE}/expenses`);
  return handle(res);
}

export async function fetchInsights() {
  const res = await fetch(`${BASE}/insights`);
  return handle(res);
}

export async function fetchSmartInsights() {
  const res = await fetch(`${BASE}/smart-insights`);
  return handle(res);
}

export async function fetchBudgets() {
  const res = await fetch(`${BASE}/budgets`);
  return handle(res);
}

export async function setBudget(category, amount) {
  const res = await fetch(`${BASE}/budgets/${encodeURIComponent(category)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  return handle(res);
}

export async function deleteReceipt(id) {
  const res = await fetch(`${BASE}/receipts/${id}`, { method: "DELETE" });
  return handle(res);
}

// ---------- tax-deductible ----------

export async function fetchDeductibleCategories() {
  const res = await fetch(`${BASE}/settings/deductible-categories`);
  return handle(res);
}

export async function setDeductibleCategories(categories) {
  const res = await fetch(`${BASE}/settings/deductible-categories`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categories }),
  });
  return handle(res);
}

export async function setExpenseDeductible(expenseId, deductible) {
  const res = await fetch(`${BASE}/expenses/${expenseId}/deductible`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deductible }),
  });
  return handle(res);
}

export async function fetchDeductibleSummary(scope = "all") {
  const res = await fetch(`${BASE}/deductible-summary?scope=${encodeURIComponent(scope)}`);
  return handle(res);
}

// ---------- merchant insights ----------

export async function fetchMerchantInsights() {
  const res = await fetch(`${BASE}/merchant-insights`);
  return handle(res);
}

// ---------- savings goal ----------

export async function fetchSavingsGoal() {
  const res = await fetch(`${BASE}/savings-goal`);
  return handle(res);
}

export async function setSavingsGoal(goal) {
  const res = await fetch(`${BASE}/savings-goal`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goal),
  });
  return handle(res);
}

export async function deleteSavingsGoal() {
  const res = await fetch(`${BASE}/savings-goal`, { method: "DELETE" });
  return handle(res);
}

export async function addContribution(contribution) {
  const res = await fetch(`${BASE}/savings-goal/contributions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contribution),
  });
  return handle(res);
}

export async function deleteContribution(id) {
  const res = await fetch(`${BASE}/savings-goal/contributions/${id}`, { method: "DELETE" });
  return handle(res);
}

// ---------- export ----------

export function exportUrl(format, scope) {
  return `${BASE}/export/${format}?scope=${encodeURIComponent(scope)}`;
}
