import { verifyAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { KpiCard } from "@/components/admin/KpiCard";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { SystemStatus } from "@/components/admin/SystemStatus";
import { formatCurrency } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) redirect("/dashboard");

  // Fetch stats
  const { count: userCount } = await adminClient
    .from("user_settings")
    .select("user_id", { count: "exact", head: true });

  const { count: receiptCount } = await adminClient
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("is_archived", false);

  const { count: todayReceipts } = await adminClient
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

  const { data: totalAmountData } = await adminClient
    .from("receipts")
    .select("total_amount")
    .eq("is_archived", false);

  const totalAmount = (totalAmountData || []).reduce((sum, r) => sum + (r.total_amount || 0), 0);

  const { count: ocrCompleted } = await adminClient
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("ocr_status", "completed");

  const ocrRate = receiptCount ? Math.round(((ocrCompleted || 0) / receiptCount) * 100) : 0;

  const { count: pendingOcr } = await adminClient
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .in("ocr_status", ["pending", "processing"]);

  const { count: failedOcr } = await adminClient
    .from("receipts")
    .select("id", { count: "exact", head: true })
    .eq("ocr_status", "failed");

  const { count: driveConnected } = await adminClient
    .from("gdrive_connections")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  // Recent activity
  const { data: recentReceipts } = await adminClient
    .from("receipts")
    .select("id, vendor_name, total_amount, created_at, user_id")
    .order("created_at", { ascending: false })
    .limit(8);

  const activities = (recentReceipts || []).map((r) => ({
    id: r.id,
    type: "receipt" as const,
    description: `קבלה חדשה: ${r.vendor_name || "ספק לא ידוע"} - ${r.total_amount ? formatCurrency(r.total_amount) : "—"}`,
    time: new Date(r.created_at).toLocaleString("he-IL", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }),
    user_email: r.user_id?.slice(0, 8) + "...",
  }));

  // System status
  const systemItems = [
    { name: "Supabase DB", status: "healthy" as const, value: "Online", icon: "storage" },
    { name: "OCR Queue", status: (pendingOcr || 0) > 10 ? "warning" as const : "healthy" as const, value: `${pendingOcr || 0} pending`, icon: "document_scanner" },
    { name: "OCR Failures", status: (failedOcr || 0) > 0 ? "warning" as const : "healthy" as const, value: `${failedOcr || 0} failed`, icon: "error" },
    { name: "Drive Sync", status: "healthy" as const, value: `${driveConnected || 0} connected`, icon: "cloud" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">סקירה כללית</h1>
        <p className="text-slate-500 mt-1">מבט על המערכת בזמן אמת</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="group" label="משתמשים" value={userCount || 0} color="blue" />
        <KpiCard icon="receipt_long" label="קבלות" value={receiptCount || 0} subtitle={`${todayReceipts || 0} היום`} color="green" />
        <KpiCard icon="payments" label="סכום כולל" value={formatCurrency(totalAmount)} color="purple" />
        <KpiCard icon="document_scanner" label="OCR הצלחה" value={`${ocrRate}%`} subtitle={`${failedOcr || 0} כשלונות`} color="amber" />
      </div>

      {/* Activity + System */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} />
        </div>
        <SystemStatus items={systemItems} />
      </div>
    </div>
  );
}
