import { verifyAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { KpiCard } from "@/components/admin/KpiCard";

export default async function AdminSystemPage() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) redirect("/dashboard");

  const { count: totalReceipts } = await adminClient.from("receipts").select("id", { count: "exact", head: true });
  const { count: pendingOcr } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).in("ocr_status", ["pending", "processing"]);
  const { count: failedOcr } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).eq("ocr_status", "failed");
  const { count: unsyncedDrive } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).eq("gdrive_synced", false).eq("is_archived", false);
  const { count: driveErrors } = await adminClient.from("gdrive_connections").select("id", { count: "exact", head: true }).not("last_sync_error", "is", null);
  const { count: totalUsers } = await adminClient.from("user_settings").select("user_id", { count: "exact", head: true });
  const { data: sysSettings } = await adminClient.from("system_settings").select("*");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">מערכת</h1>
        <p className="text-slate-500 mt-1">ניטור בריאות המערכת</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="storage" label="סה&quot;כ קבלות" value={totalReceipts || 0} color="blue" />
        <KpiCard icon="hourglass_top" label="OCR בתור" value={pendingOcr || 0} color="amber" />
        <KpiCard icon="error" label="OCR כשלונות" value={failedOcr || 0} color="red" />
        <KpiCard icon="cloud_off" label="לא מסונכרן" value={unsyncedDrive || 0} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">מידע מערכת</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <dt className="text-slate-500">משתמשים רשומים</dt>
              <dd className="font-bold">{totalUsers || 0}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <dt className="text-slate-500">סה&quot;כ קבלות</dt>
              <dd className="font-bold">{totalReceipts || 0}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <dt className="text-slate-500">Drive Sync Errors</dt>
              <dd className="font-bold text-red-600">{driveErrors || 0}</dd>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <dt className="text-slate-500">Framework</dt>
              <dd className="font-bold">Next.js 16</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-slate-500">Database</dt>
              <dd className="font-bold">Supabase PostgreSQL</dd>
            </div>
          </dl>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">הגדרות מערכת</h3>
          <dl className="space-y-3 text-sm">
            {(sysSettings || []).map((s) => (
              <div key={s.key} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                <dt className="text-slate-500 font-mono text-xs">{s.key}</dt>
                <dd className="font-bold">{JSON.stringify(s.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
