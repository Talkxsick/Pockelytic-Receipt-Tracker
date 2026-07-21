import { useMemo, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryColor } from "../categoryColors.js";

export default function CategoryPieChart({ expenses }) {
  const [scope, setScope] = useState("all");

  const monthOptions = useMemo(() => {
    const set = new Set(expenses.map((e) => (e.date || "").slice(0, 7)).filter(Boolean));
    return Array.from(set).sort().reverse();
  }, [expenses]);

  const data = useMemo(() => {
    const totals = {};
    for (const e of expenses) {
      if (scope !== "all" && (e.date || "").slice(0, 7) !== scope) continue;
      const cat = e.category || "Other";
      totals[cat] = (totals[cat] || 0) + (e.price || 0);
    }
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, scope]);

  if (expenses.length === 0) {
    return (
      <div className="chart-card">
        <div className="empty-state">Category split appears after your first scan.</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="pie-scope-row">
        <label htmlFor="pie-scope">Showing</label>
        <select id="pie-scope" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">All time</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">No expenses in this month.</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={92}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={categoryColor(entry.name).bg} stroke="#fffdf8" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v, n) => [`$${v.toFixed(2)}`, n]}
              contentStyle={{
                fontFamily: "Inter",
                fontSize: 12,
                borderRadius: 10,
                border: "none",
                boxShadow: "0 6px 20px rgba(34,32,27,0.12)",
              }}
            />
            <Legend
              formatter={(value) => <span style={{ fontFamily: "Inter", fontSize: 12, color: "#22201b" }}>{value}</span>}
              iconType="circle"
              iconSize={9}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
