import { verifyAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/admin/KpiCard";

export default async function AdminAnalyticsPage() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) redirect("/dashboard");

  // Top vendors
  const { data: allReceipts } = await adminClient
    .from("receipts")
    .select("vendor_name, total_amount, ocr_status, ocr_confidence, gdrive_synced, category:categories(name_he)")
    .eq("is_archived", false);

  const vendorMap = new Map<string, { count: number; amount: number }>();
  const categoryMap = new Map<string, { count: number; amount: number }>();
  let totalConfidence = 0;
  let confidenceCount = 0;
  let driveCount = 0;

  for (const r of allReceipts || []) {
    if (r.vendor_name) {
      const v = vendorMap.get(r.vendor_name) || { count: 0, amount: 0 };
      v.count += 1;
      v.amount += r.total_amount || 0;
      vendorMap.set(r.vendor_name, v);
    }
    const catName = (r.category as { name_he?: string } | null)?.name_he;
    if (catName) {
      const c = categoryMap.get(catName) || { count: 0, amount: 0 };
      c.count += 1;
      c.amount += r.total_amount || 0;
      categoryMap.set(catName, c);
    }
    if (r.ocr_confidence) { totalConfidence += r.ocr_confidence; confidenceCount++; }
    if (r.gdrive_synced) driveCount++;
  }

  const topVendors = Array.from(vendorMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10);

  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1].amount - a[1].amount)
    .slice(0, 10);

  const { count: userCount } = await adminClient.from("user_settings").select("user_id", { count: "exact", head: true });
  const totalReceipts = allReceipts?.length || 0;
  const avgPerUser = userCount ? Math.round(totalReceipts / userCount) : 0;
  const avgAmount = totalReceipts ? Math.round((allReceipts || []).reduce((s, r) => s + (r.total_amount || 0), 0) / totalReceipts) : 0;
  const avgConfidence = confidenceCount ? Math.round((totalConfidence / confidenceCount) * 100) : 0;
  const driveRate = totalReceipts ? Math.round((driveCount / totalReceipts) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">אנליטיקס</h1>
        <p className="text-slate-500 mt-1">סטטיסטיקות מתקדמות על כל המערכת</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon="person" label="ממוצע קבלות/משתמש" value={avgPerUser} color="blue" />
        <KpiCard icon="payments" label="ממוצע סכום/קבלה" value={formatCurrency(avgAmount)} color="green" />
        <KpiCard icon="psychology" label="ממוצע OCR confidence" value={`${avgConfidence}%`} color="amber" />
        <KpiCard icon="cloud_sync" label="שיעור סנכרון Drive" value={`${driveRate}%`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Vendors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Top 10 ספקים</h3>
          <div className="space-y-2">
            {topVendors.map(([name, data], i) => (
              <div key={name} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400 w-5">{i + 1}</span>
                  <span className="text-sm font-bold text-slate-900">{name}</span>
                </div>
                <div className="text-end">
                  <p className="text-sm font-black">{formatCurrency(data.amount)}</p>
                  <p className="text-xs text-slate-400">{data.count} קבלות</p>
                </div>
              </div>
            ))}
            {topVendors.length === 0 && <p className="text-sm text-slate-400 text-center py-4">אין נתונים</p>}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 mb-4">Top 10 קטגוריות</h3>
          <div className="space-y-2">
            {topCategories.map(([name, data], i) => (
              <div key={name} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400 w-5">{i + 1}</span>
                  <span className="text-sm font-bold text-slate-900">{name}</span>
                </div>
                <div className="text-end">
                  <p className="text-sm font-black">{formatCurrency(data.amount)}</p>
                  <p className="text-xs text-slate-400">{data.count} קבלות</p>
                </div>
              </div>
            ))}
            {topCategories.length === 0 && <p className="text-sm text-slate-400 text-center py-4">אין נתונים</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
