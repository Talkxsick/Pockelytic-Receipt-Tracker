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
