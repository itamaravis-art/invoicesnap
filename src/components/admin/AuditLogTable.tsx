interface LogEntry {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function AuditLogTable({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <th className="text-start px-4 py-3 font-bold">{"\u05d6\u05de\u05df"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05d0\u05d3\u05de\u05d9\u05df"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05e4\u05e2\u05d5\u05dc\u05d4"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05e1\u05d5\u05d2"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05de\u05d6\u05d4\u05d4"}</th>
              <th className="text-start px-4 py-3 font-bold">{"\u05e4\u05e8\u05d8\u05d9\u05dd"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("he-IL")}
                </td>
                <td className="px-4 py-3 text-xs" dir="ltr">{log.admin_email}</td>
                <td className="px-4 py-3 font-bold text-slate-900">{log.action}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                    {log.target_type}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 font-mono" dir="ltr">
                  {log.target_id ? log.target_id.slice(0, 8) + "..." : "\u2014"}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">
                  {log.details ? JSON.stringify(log.details) : "\u2014"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  {"\u05d0\u05d9\u05df \u05e8\u05e9\u05d5\u05de\u05d5\u05ea \u05d1\u05dc\u05d5\u05d2"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
