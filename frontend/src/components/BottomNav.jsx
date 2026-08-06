import { Link, useRouter } from "../router.jsx";
import { NAV_ITEMS } from "../navItems.js";

export default function BottomNav() {
  const { path } = useRouter();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ path: itemPath, label, icon: Icon }) => (
        <Link key={itemPath} to={itemPath} className={path === itemPath ? "active" : ""}>
          <Icon size={20} strokeWidth={2} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
