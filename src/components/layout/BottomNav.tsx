"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

const tabs = [
  { href: "/dashboard", icon: "dashboard", label: "דאשבורד" },
  { href: "/receipts/new", icon: "photo_camera", label: "סריקה" },
  { href: "/receipts", icon: "fact_check", label: "סקירה" },
  { href: "/reports", icon: "archive", label: "ארכיון" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full z-50 rounded-t-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center w-full px-2 py-3">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href ||
            (tab.href === "/receipts" && pathname.startsWith("/receipts") && pathname !== "/receipts/new") ||
            (tab.href === "/reports" && pathname.startsWith("/reports"));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center px-4 py-1.5 active:scale-90 transition-all duration-200 ease-out text-[11px] font-medium ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 rounded-xl"
                  : "text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-300"
              }`}
            >
              <MaterialIcon icon={tab.icon} filled={isActive} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
