import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

const VAT_PERIODS: Record<number, string> = {
  1: "ינואר-פברואר", 2: "מרץ-אפריל", 3: "מאי-יוני",
  4: "יולי-אוגוסט", 5: "ספטמבר-אוקטובר", 6: "נובמבר-דצמבר",
};

export default async function VatPeriodDetailPage({ params }: { params: Promise<{ year: string; period: string }> }) {
  const { year: yearStr, period: periodStr } = await params;
  const year = parseInt(yearStr);
  const period = parseInt(periodStr);
  if (isNaN(year) || isNaN(period) || period < 1 || period > 6) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const m1 = period * 2 - 1;
  const m2 = period * 2;
  const startDate = `${year}-${String(m1).padStart(2, "0")}-01`;
  const endDate = new Date(year, m2, 0).toISOString().split("T")[0];

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*, category:categories(*)")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .gte("receipt_date", startDate)
    .lte("receipt_date", endDate)
    .order("receipt_date", { ascending: false });

  const items = receipts || [];
  const reclaimable = items.filter(r => r.is_vat_reclaimable !== false);
  const nonReclaimable = items.filter(r => r.is_vat_reclaimable === false);
  const totalAmount = items.reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalVat = items.reduce((s, r) => s + (r.vat_amount || 0), 0);
  const reclaimableVat = reclaimable.reduce((s, r) => s + (r.vat_amount || 0), 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/reports/vat" className="flex items-center gap-1 text-primary font-bold text-sm">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
          חזור לדוחות מע״מ
        </Link>
      </div>

      <h2 className="text-2xl font-black text-on-surface">
        {VAT_PERIODS[period]} {year}
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
          <p className="text-xs text-on-surface-variant mb-1">סה״כ הוצאות</p>
          <p className="text-lg font-black text-on-surface">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-primary-container rounded-2xl p-4 text-center">
          <p className="text-xs text-on-primary-container mb-1 opacity-80">מע״מ לניכוי</p>
          <p className="text-lg font-black text-on-primary-container">{formatCurrency(reclaimableVat)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
          <p className="text-xs text-on-surface-variant mb-1">קבלות</p>
          <p className="text-lg font-black text-on-surface">{items.length}</p>
        </div>
      </div>

      {/* Reclaimable receipts */}
      {reclaimable.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-secondary text-sm align-middle">check_circle</span>
            {" "}מע״מ לניכוי ({reclaimable.length})
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {reclaimable.map((r) => (
              <Link key={r.id} href={`/receipts/${r.id}`} className="bg-surface-container-lowest p-3 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-on-surface">{r.vendor_name || "שם ספק לא זוהה"}</p>
                  <p className="text-xs text-on-surface-variant">{r.receipt_date ? formatDate(r.receipt_date) : ""}</p>
                </div>
                <div className="text-start">
                  <p className="font-black text-sm">{r.total_amount ? formatCurrency(r.total_amount) : "\u2014"}</p>
                  <p className="text-xs text-secondary font-bold">{r.vat_amount ? formatCurrency(r.vat_amount) : "\u2014"} מע״מ</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Non-reclaimable receipts */}
      {nonReclaimable.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-on-surface-variant mb-2">
            <span className="material-symbols-outlined text-outline text-sm align-middle">block</span>
            {" "}ללא ניכוי מע״מ ({nonReclaimable.length})
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {nonReclaimable.map((r) => (
              <Link key={r.id} href={`/receipts/${r.id}`} className="bg-surface-container-lowest p-3 rounded-2xl flex items-center justify-between opacity-70">
                <div>
                  <p className="font-bold text-sm text-on-surface">{r.vendor_name || "שם ספק לא זוהה"}</p>
                  <p className="text-xs text-on-surface-variant">{r.receipt_date ? formatDate(r.receipt_date) : ""}</p>
                </div>
                <p className="font-black text-sm">{r.total_amount ? formatCurrency(r.total_amount) : "\u2014"}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">receipt_long</span>
          <p className="text-on-surface-variant">אין קבלות לתקופה זו</p>
        </div>
      )}

      {/* Export button */}
      {items.length > 0 && (
        <Link href={`/export?year=${year}&month=${m1}`} className="block bg-primary text-on-primary text-center py-3 rounded-full font-bold">
          שלח לרואה חשבון
        </Link>
      )}
    </section>
  );
}
