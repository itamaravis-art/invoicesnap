"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface UserRow {
  id: string;
  email: string;
  display_name: string | null;
  business_name: string | null;
  receipt_count: number;
  total_amount: number;
  onboarding_completed: boolean;
  created_at: string;
}

export function UsersTable({ users }: { users: UserRow[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-start px-4 py-3 font-bold">{"\u05de\u05e9\u05ea\u05de\u05e9"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05e2\u05e1\u05e7"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05e7\u05d1\u05dc\u05d5\u05ea"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05e1\u05db\u05d5\u05dd"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05e1\u05d8\u05d8\u05d5\u05e1"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05d4\u05e6\u05d8\u05e8\u05e3"}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-900">{user.display_name || "\u2014"}</p>
                    <p className="text-xs text-slate-500" dir="ltr">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">{user.business_name || "\u2014"}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{user.receipt_count}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{formatCurrency(user.total_amount)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    user.onboarding_completed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {user.onboarding_completed ? "\u05e4\u05e2\u05d9\u05dc" : "onboarding"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {new Date(user.created_at).toLocaleDateString("he-IL")}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                  >
                    {"\u05e6\u05e4\u05d4"}
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  {"\u05d0\u05d9\u05df \u05de\u05e9\u05ea\u05de\u05e9\u05d9\u05dd \u05e2\u05d3\u05d9\u05d9\u05df"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
