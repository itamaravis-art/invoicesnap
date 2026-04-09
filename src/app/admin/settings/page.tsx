import { verifyAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) redirect("/dashboard");

  const { data: settings } = await adminClient.from("system_settings").select("*").order("key");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">הגדרות</h1>
        <p className="text-slate-500 mt-1">הגדרות מערכת כלליות</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {(settings || []).map((s) => (
          <div key={s.key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div>
              <p className="font-bold text-slate-900">{s.key}</p>
              <p className="text-xs text-slate-400">
                עודכן: {s.updated_at ? new Date(s.updated_at).toLocaleString("he-IL") : "—"}
                {s.updated_by && ` · ${s.updated_by}`}
              </p>
            </div>
            <div className="bg-slate-100 px-4 py-2 rounded-lg font-mono text-sm">
              {JSON.stringify(s.value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
