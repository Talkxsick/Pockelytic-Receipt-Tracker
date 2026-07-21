import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function MonthlyChart({ monthly }) {
  const data = Object.entries(monthly).map(([month, total]) => ({ month, total }));

  if (data.length === 0) {
    return <div className="empty-state">Scan a receipt to see monthly trends.</div>;
  }

  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#ecdfc0" strokeDasharray="2 3" />
          <XAxis
            dataKey="month"
            tick={{ fontFamily: "Inter", fontSize: 11, fill: "#7c7362" }}
            axisLine={{ stroke: "#ecdfc0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontFamily: "Inter", fontSize: 11, fill: "#7c7362" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(v) => [`$${v.toFixed(2)}`, "Spent"]}
            contentStyle={{ fontFamily: "Inter", fontSize: 12, borderRadius: 10, border: "none", boxShadow: "0 6px 20px rgba(34,32,27,0.12)" }}
          />
          <Bar dataKey="total" fill="#e8623d" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
