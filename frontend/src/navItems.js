import { LayoutGrid, PiggyBank, Receipt, Settings as SettingsIcon } from "lucide-react";

export const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: LayoutGrid },
  { path: "/budgets", label: "Budgets", icon: PiggyBank },
  { path: "/receipts", label: "Receipts", icon: Receipt },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];
