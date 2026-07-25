const TABS = [
  { id: "all", label: "All" },
  { id: "month", label: "This month" },
  { id: "deductible", label: "Deductible" },
];

export default function ReceiptFilterTabs({ active, onChange }) {
  return (
    <div className="filter-tabs">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`filter-tab${active === t.id ? " active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
