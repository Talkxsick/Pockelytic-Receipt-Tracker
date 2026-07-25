import { useState } from "react";
import {
  LayoutGrid,
  Receipt,
  PiggyBank,
  TrendingUp,
  ScanLine,
  Flame,
  Target,
  Store,
  Download,
  Settings as SettingsIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "budgets", label: "Budgets", icon: PiggyBank },
  { id: "goals", label: "Savings goal", icon: Target },
  { id: "watch", label: "Smart watch", icon: TrendingUp },
  { id: "merchants", label: "Merchants", icon: Store },
  { id: "receipts", label: "Receipts", icon: Receipt },
  { id: "export", label: "Export", icon: Download },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Sidebar({ onScan }) {
  const [active, setActive] = useState("overview");

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" title="Pocketalyst">
        <Flame size={17} strokeWidth={2.5} />
      </div>

      <button className="sidebar-scan-btn" onClick={onScan} title="Scan receipt">
        <ScanLine size={18} />
      </button>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={active === id ? "active" : ""}
            title={label}
            onClick={() => {
              setActive(id);
              scrollToSection(id);
            }}
          >
            <Icon size={18} strokeWidth={2} />
          </button>
        ))}
      </nav>
    </aside>
  );
}
