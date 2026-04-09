"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

const navItems = [
  { href: "/admin", icon: "dashboard", label: "\u05e1\u05e7\u05d9\u05e8\u05d4 \u05db\u05dc\u05dc\u05d9\u05ea", exact: true },
  { href: "/admin/users", icon: "group", label: "\u05de\u05e9\u05ea\u05de\u05e9\u05d9\u05dd" },
  { href: "/admin/receipts", icon: "receipt_long", label: "\u05e7\u05d1\u05dc\u05d5\u05ea" },
  { href: "/admin/analytics", icon: "insights", label: "\u05d0\u05e0\u05dc\u05d9\u05d8\u05d9\u05e7\u05e1" },
  { href: "/admin/system", icon: "dns", label: "\u05de\u05e2\u05e8\u05db\u05ea" },
  { href: "/admin/logs", icon: "history", label: "\u05dc\u05d5\u05d2 \u05e4\u05e2\u05d5\u05dc\u05d5\u05ea" },
  { href: "/admin/settings", icon: "tune", label: "\u05d4\u05d2\u05d3\u05e8\u05d5\u05ea" },
];

export function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 sticky top-0 h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-lg font-black tracking-tight">
          <span className="text-blue-400">InvoiceSnap</span>
          <span className="text-slate-400 text-sm font-medium block">Admin Panel</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <MaterialIcon icon={item.icon} size={20} className={isActive ? "text-blue-400" : ""} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
        >
          <MaterialIcon icon="arrow_forward" size={18} />
          <span>{"\u05d7\u05d6\u05e8\u05d4 \u05dc\u05d0\u05e4\u05dc\u05d9\u05e7\u05e6\u05d9\u05d4"}</span>
        </Link>
        <div className="px-4">
          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
        </div>
      </div>
    </aside>
  );
}
