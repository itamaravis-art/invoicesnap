import { verifyAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { AuditLogTable } from "@/components/admin/AuditLogTable";

export default async function AdminLogsPage() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) redirect("/dashboard");

  const { data: logs } = await adminClient
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">לוג פעולות</h1>
        <p className="text-slate-500 mt-1">כל הפעולות שבוצעו על ידי אדמינים</p>
      </div>
      <AuditLogTable logs={logs || []} />
    </div>
  );
}
