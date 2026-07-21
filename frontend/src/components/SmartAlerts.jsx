function fmt(d) {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function PriceWatch({ items }) {
  if (items.length === 0) {
    return <div className="empty-state">No repeat items yet — price creep shows up once you scan the same item twice.</div>;
  }
  return (
    <div className="watch-list">
      {items.map((a, i) => (
        <div className="watch-card" key={i}>
          <div className="watch-card-top">
            <span className="watch-item-name">{a.item}</span>
            <span className="watch-pct">+{a.pct_increase}%</span>
          </div>
          <div className="watch-card-detail">
            {a.merchant} · ${a.first_price.toFixed(2)} on {fmt(a.first_date)} → ${a.last_price.toFixed(2)} on {fmt(a.last_date)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Subscriptions({ data }) {
  if (data.detected.length === 0) {
    return <div className="empty-state">No recurring monthly charges detected yet.</div>;
  }
  return (
    <div className="watch-list">
      <div className="subscription-total">
        <span>Recurring monthly total</span>
        <span className="subscription-total-amount">${data.monthly_total.toFixed(2)}/mo</span>
      </div>
      {data.detected.map((s, i) => (
        <div className="watch-card" key={i}>
          <div className="watch-card-top">
            <span className="watch-item-name">{s.merchant}</span>
            <span className="watch-pct green">${s.avg_amount.toFixed(2)}/mo</span>
          </div>
          <div className="watch-card-detail">
            Seen {s.occurrences} times · last on {fmt(s.last_date)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Deadlines({ items }) {
  if (items.length === 0) {
    return <div className="empty-state">No return or warranty windows closing soon.</div>;
  }
  return (
    <div className="watch-list">
      {items.map((d, i) => (
        <div className={`watch-card${d.days_left <= 3 ? " urgent" : ""}`} key={i}>
          <div className="watch-card-top">
            <span className="watch-item-name">{d.item}</span>
            <span className="watch-pct">
              {d.days_left < 0 ? "expired" : d.days_left === 0 ? "today" : `${d.days_left}d left`}
            </span>
          </div>
          <div className="watch-card-detail">
            {d.type === "return" ? "Return window" : "Warranty"} · {d.merchant} · bought {fmt(d.purchase_date)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SmartAlerts({ smart }) {
  if (!smart) return null;

  return (
    <>
      <h2 className="section-title">Price watch</h2>
      <div className="chart-card">
        <PriceWatch items={smart.price_creep} />
      </div>

      <h2 className="section-title">Recurring charges</h2>
      <div className="chart-card">
        <Subscriptions data={smart.subscriptions} />
      </div>

      <h2 className="section-title">Return &amp; warranty deadlines</h2>
      <div className="chart-card">
        <Deadlines items={smart.deadlines} />
      </div>
    </>
  );
}
