import { useEffect, useState } from "react";
import { fetchMerchantInsights } from "../api.js";
import { categoryColor } from "../categoryColors.js";

export default function MerchantInsights() {
  const [merchants, setMerchants] = useState(null);

  useEffect(() => {
    fetchMerchantInsights().then(setMerchants);
  }, []);

  if (!merchants) return null;

  if (merchants.length === 0) {
    return (
      <div className="chart-card">
        <div className="empty-state">Merchant totals appear after your first scan.</div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <div className="watch-list">
        {merchants.slice(0, 10).map((m) => {
          const c = categoryColor(m.top_category);
          return (
            <div className="watch-card" key={m.merchant}>
              <div className="watch-card-top">
                <span className="watch-item-name">{m.merchant}</span>
                <span className="watch-pct green">${m.total.toFixed(2)}</span>
              </div>
              <div className="watch-card-detail">
                {m.visits} visit{m.visits === 1 ? "" : "s"} · ${m.avg_per_visit.toFixed(2)} avg ·{" "}
                <span
                  className="tape-item-category"
                  style={{ background: c.bg, color: c.text, marginLeft: 2 }}
                >
                  {m.top_category}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
