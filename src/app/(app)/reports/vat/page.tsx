import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";

const VAT_PERIODS: Record<number, string> = {
  1: "ינואר-פברואר", 2: "מרץ-אפריל", 3: "מאי-יוני",
  4: "יולי-אוגוסט", 5: "ספטמבר-אוקטובר", 6: "נובמבר-דצמבר",
};

export default async function VatReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const year = new Date().getFullYear();

  // Calculate periods from receipts
  const periods = [];
  for (let p = 1; p <= 6; p++) {
    const m1 = p * 2 - 1;
    const m2 = p * 2;
    const startDate = `${year}-${String(m1).padStart(2, "0")}-01`;
    const endDate = new Date(year, m2, 0).toISOString().split("T")[0];

    const { data: receipts } = await supabase
      .from("receipts")
      .select("total_amount, vat_amount, is_vat_reclaimable")
      .eq("user_id", user.id)
      .eq("is_archived", false)
      .gte("receipt_date", startDate)
      .lte("receipt_date", endDate);

    const items = receipts || [];
    periods.push({
      period: p,
      total_amount: items.reduce((s, r) => s + (r.total_amount || 0), 0),
      reclaimable_vat: items.filter(r => r.is_vat_reclaimable !== false).reduce((s, r) => s + (r.vat_amount || 0), 0),
      receipt_count: items.length,
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-on-surface">דוחות מע״מ</h2>
          <p className="text-sm text-on-surface-variant">דיווח דו-חודשי — {year}</p>
        </div>
        <Link href="/reports" className="text-primary font-bold text-sm flex items-center gap-1">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
          דוחות חודשיים
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {periods.map((p) => (
          <Link
            key={p.period}
            href={`/reports/vat/${year}/${p.period}`}
            className="bg-surface-container-lowest hover:bg-surface-bright transition-all p-5 rounded-3xl"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary-container text-lg">receipt_long</span>
              </div>
              <div>
                <p className="font-bold text-on-surface">{VAT_PERIODS[p.period]}</p>
                <p className="text-xs text-on-surface-variant">{p.receipt_count} קבלות</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-on-surface-variant">סה״כ הוצאות</p>
                <p className="font-black text-on-surface">{formatCurrency(p.total_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">מע״מ לניכוי</p>
                <p className="font-black text-primary">{formatCurrency(p.reclaimable_vat)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {periods.every(p => p.receipt_count === 0) && (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3 block">calculate</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">עדיין אין נתונים</h3>
          <p className="text-sm text-on-surface-variant mb-6">סרוק קבלות כדי לראות דוחות מע״מ דו-חודשיים</p>
          <Link href="/receipts/new" className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold inline-flex items-center gap-2">
            <span className="material-symbols-outlined">photo_camera</span>
            סרוק קבלה
          </Link>
        </div>
      )}
    </section>
  );
}
