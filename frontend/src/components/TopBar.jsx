import { Search, Bell } from "lucide-react";

export default function TopBar({ search, onSearchChange, alertCount, onBellClick }) {
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

      <button className="topbar-bell" onClick={onBellClick} aria-label="View alerts">
        <Bell size={18} strokeWidth={2.2} />
        {alertCount > 0 && <span className="topbar-bell-badge">{alertCount}</span>}
      </button>
    </div>
  );
}
