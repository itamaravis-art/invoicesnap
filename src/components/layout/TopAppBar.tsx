"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/shared/MaterialIcon";

interface TopAppBarProps {
  userName?: string;
  avatarUrl?: string;
}

export function TopAppBar({ userName = "משתמש", avatarUrl }: TopAppBarProps) {
  return (
    <header className="w-full top-0 sticky z-50 glass border-b border-outline-variant/20">
      <div className="flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                <MaterialIcon icon="person" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-on-surface-variant font-medium">שלום, {userName}</span>
          </div>
        </div>
        <h1 className="text-xl font-black text-blue-800 dark:text-blue-200 tracking-tight">
          InvoiceSnap
        </h1>
        <Link
          href="/settings"
          title="הגדרות"
          className="text-blue-700 dark:text-blue-400 active:scale-95 transition-transform duration-150 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 p-2 rounded-xl"
        >
          <MaterialIcon icon="settings" />
        </Link>
      </div>
    </header>
  );
}
