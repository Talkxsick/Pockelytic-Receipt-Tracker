import { useState } from "react";
import { LayoutGrid, Receipt, PiggyBank, TrendingUp, ScanLine, Flame } from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "budgets", label: "Budgets", icon: PiggyBank },
  { id: "watch", label: "Smart watch", icon: TrendingUp },
  { id: "receipts", label: "Receipts", icon: Receipt },
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Sidebar({ onScan }) {
  const [active, setActive] = useState("overview");

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">
          <Flame size={16} strokeWidth={2.5} />
        </span>
        <span className="sidebar-brand-name">Pocketalyst</span>
      </div>

      <button className="sidebar-scan-btn" onClick={onScan}>
        <ScanLine size={16} />
        Scan receipt
      </button>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={active === id ? "active" : ""}
            onClick={() => {
              setActive(id);
              scrollToSection(id);
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">Local &amp; private — your data stays on this device.</div>
    </aside>
  );
}
