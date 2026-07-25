import { Search, Bell, Wallet } from "lucide-react";

export default function TopBar({ search, onSearchChange, alertCount, onBellClick, monthLabel, monthTotal }) {
  return (
    <div className="topbar">
      <div className="topbar-search">
        <Search size={16} strokeWidth={2.5} />
        <input
          type="text"
          placeholder="Search merchant or item…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {monthTotal !== undefined && (
        <div className="topbar-chip">
          <span className="topbar-chip-icon">
            <Wallet size={15} strokeWidth={2.2} />
          </span>
          <span className="topbar-chip-text">
            <span className="topbar-chip-label">{monthLabel || "This month"}</span>
            <span className="topbar-chip-amount">${monthTotal.toFixed(2)}</span>
          </span>
        </div>
      )}

      <button className="topbar-bell" onClick={onBellClick} aria-label="View alerts">
        <Bell size={18} strokeWidth={2.2} />
        {alertCount > 0 && <span className="topbar-bell-badge">{alertCount}</span>}
      </button>
    </div>
  );
}
