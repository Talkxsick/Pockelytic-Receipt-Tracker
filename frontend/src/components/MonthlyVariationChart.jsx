import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function buildVariationData(monthly) {
  const months = Object.keys(monthly).sort();
  const data = [];
  for (let i = 1; i < months.length; i++) {
    const prev = monthly[months[i - 1]];
    const curr = monthly[months[i]];
    const change = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
    data.push({ month: months[i], change: Math.round(change * 10) / 10 });
  }
  return data;
}

function VariationDot({ cx, cy, payload }) {
  const color = payload.change >= 0 ? "#d9483a" : "#33512a";
  return <circle cx={cx} cy={cy} r={4.5} fill={color} stroke="#fffdf8" strokeWidth={2} />;
}

export default function MonthlyVariationChart({ monthly }) {
  const data = buildVariationData(monthly);

  if (data.length === 0) {
    return (
      <div className="chart-card">
        <div className="empty-state">
          Scan receipts across at least two months to see how your spending is trending.
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#ecdfc0" strokeDasharray="2 3" />
          <XAxis
            dataKey="month"
            tick={{ fontFamily: "Inter", fontSize: 11, fill: "#7c7362" }}
            axisLine={{ stroke: "#ecdfc0" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `${v}%`}
            tick={{ fontFamily: "Inter", fontSize: 11, fill: "#7c7362" }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <ReferenceLine y={0} stroke="#c9bd98" strokeDasharray="3 3" />
          <Tooltip
            formatter={(v) => [`${v > 0 ? "+" : ""}${v}%`, "vs previous month"]}
            contentStyle={{
              fontFamily: "Inter",
              fontSize: 12,
              borderRadius: 10,
              border: "none",
              boxShadow: "0 6px 20px rgba(34,32,27,0.12)",
            }}
          />
          <Line type="monotone" dataKey="change" stroke="#e8623d" strokeWidth={2.5} dot={<VariationDot />} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
