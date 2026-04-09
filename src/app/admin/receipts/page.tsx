import { verifyAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

export default async function AdminReceiptsPage() {
  const { authorized, adminClient } = await verifyAdmin();
  if (!authorized || !adminClient) redirect("/dashboard");

  const { data: receipts, count } = await adminClient
    .from("receipts")
    .select("*, category:categories(name_he)", { count: "exact" })
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(50);

  // OCR status counts
  const { count: completed } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).eq("ocr_status", "completed");
  const { count: failed } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).eq("ocr_status", "failed");
  const { count: pending } = await adminClient.from("receipts").select("id", { count: "exact", head: true }).in("ocr_status", ["pending", "processing"]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900">קבלות</h1>
        <p className="text-slate-500 mt-1">{count || 0} קבלות במערכת</p>
      </div>

      {/* Status pills */}
      <div className="flex gap-3">
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">הושלם: {completed || 0}</span>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">בתהליך: {pending || 0}</span>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700">נכשל: {failed || 0}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-start px-4 py-3 font-bold">ספק</th>
                <th className="text-start px-4 py-3 font-bold">סכום</th>
                <th className="text-start px-4 py-3 font-bold">מע&quot;מ</th>
                <th className="text-start px-4 py-3 font-bold">תאריך</th>
                <th className="text-start px-4 py-3 font-bold">קטגוריה</th>
                <th className="text-start px-4 py-3 font-bold">OCR</th>
                <th className="text-start px-4 py-3 font-bold">Drive</th>
                <th className="text-start px-4 py-3 font-bold">נוצר</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(receipts || []).map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-bold text-slate-900">{r.vendor_name || "—"}</td>
                  <td className="px-4 py-3 font-bold">{r.total_amount ? formatCurrency(r.total_amount) : "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.vat_amount ? formatCurrency(r.vat_amount) : "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.receipt_date || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{(r.category as { name_he?: string } | null)?.name_he || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      r.ocr_status === "completed" ? "bg-emerald-100 text-emerald-700" :
                      r.ocr_status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{r.ocr_status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.gdrive_synced ? (
                      <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: 16 }}>check_circle</span>
                    ) : (
                      <span className="material-symbols-outlined text-slate-300" style={{ fontSize: 16 }}>cloud_off</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString("he-IL")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
