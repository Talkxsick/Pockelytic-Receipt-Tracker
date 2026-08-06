import { ScanLine, Flame } from "lucide-react";
import { Link, useRouter } from "../router.jsx";
import { NAV_ITEMS } from "../navItems.js";

export default function Sidebar({ onScan }) {
  const { path } = useRouter();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" title="Pocketalyst">
        <Flame size={17} strokeWidth={2.5} />
      </div>

      <button className="sidebar-scan-btn" onClick={onScan} title="Scan receipt">
        <ScanLine size={18} />
      </button>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path: itemPath, label, icon: Icon }) => (
          <Link key={itemPath} to={itemPath} className={path === itemPath ? "active" : ""} title={label}>
            <Icon size={18} strokeWidth={2} />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
