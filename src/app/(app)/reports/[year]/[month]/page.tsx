import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, getHebrewMonthName } from "@/lib/utils";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CategoryChart } from "@/components/reports/CategoryChart";

export default async function ReportDetailPage({ params }: { params: Promise<{ year: string; month: string }> }) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch report
  const { data: report } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  // Fetch receipts with categories
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*, category:categories(*)")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .gte("receipt_date", startDate)
    .lte("receipt_date", endDate)
    .order("receipt_date", { ascending: false });

  const items = receipts || [];
  const totalAmount = report?.total_amount || items.reduce((s, r) => s + (r.total_amount || 0), 0);
  const totalVat = report?.total_vat || items.reduce((s, r) => s + (r.vat_amount || 0), 0);

  // Previous month comparison
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { data: prevReport } = await supabase
    .from("monthly_reports")
    .select("total_amount, receipt_count")
    .eq("user_id", user.id)
    .eq("year", prevYear)
    .eq("month", prevMonth)
    .maybeSingle();

  const changePercent = prevReport?.total_amount && totalAmount
    ? Math.round(((totalAmount - prevReport.total_amount) / prevReport.total_amount) * 100)
    : null;

  // Category breakdown
  const categoryMap = new Map<string, { name: string; amount: number; color: string }>();
  const defaultColors = ["#6366f1", "#06b6d4", "#f59e0b", "#ef4444", "#22c55e", "#8b5cf6", "#ec4899", "#14b8a6"];
  for (const r of items) {
    const cat = r.category as Record<string, string> | null;
    const key = cat?.id || "uncategorized";
    const existing = categoryMap.get(key);
    if (existing) {
      existing.amount += r.total_amount || 0;
    } else {
      categoryMap.set(key, {
        name: cat?.name_he || "ללא קטגוריה",
        amount: r.total_amount || 0,
        color: cat?.color || defaultColors[categoryMap.size % defaultColors.length],
      });
    }
  }
  const categoryData = Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/reports" className="flex items-center gap-1 text-primary font-bold text-sm">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
          חזור לדוחות
        </Link>
        {report && (
          <span className={`text-xs px-3 py-1 rounded-full font-bold ${
            report.status === "sent" ? "bg-secondary-container text-on-secondary-container" :
            report.status === "closed" ? "bg-tertiary-container text-on-tertiary-container" :
            "bg-surface-container-high text-on-surface-variant"
          }`}>
            {report.status === "sent" ? "נשלח" : report.status === "closed" ? "סגור" : "פתוח"}
          </span>
        )}
      </div>

      <h2 className="text-2xl font-black text-on-surface">
        {getHebrewMonthName(month)} {year}
      </h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
          <p className="text-xs text-on-surface-variant mb-1">סה&quot;כ הוצאות</p>
          <p className="text-lg font-black text-on-surface">{formatCurrency(totalAmount)}</p>
          {changePercent !== null && (
            <p className={`text-xs font-bold mt-1 ${changePercent > 0 ? "text-error" : "text-secondary"}`}>
              {changePercent > 0 ? "+" : ""}{changePercent}% מחודש קודם
            </p>
          )}
        </div>
        <div className="bg-primary-container rounded-2xl p-4 text-center">
          <p className="text-xs text-on-primary-container mb-1 opacity-80">מע&quot;מ</p>
          <p className="text-lg font-black text-on-primary-container">{formatCurrency(totalVat)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
          <p className="text-xs text-on-surface-variant mb-1">קבלות</p>
          <p className="text-lg font-black text-on-surface">{items.length}</p>
        </div>
      </div>

      {/* Category chart */}
      <CategoryChart data={categoryData} />

      {/* Category breakdown list */}
      {categoryData.length > 0 && (
        <div className="bg-surface-container-lowest rounded-3xl p-4 space-y-2">
          {categoryData.map((cat, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-on-surface">{cat.name}</span>
              </div>
              <span className="text-sm font-bold text-on-surface">{formatCurrency(cat.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Receipt list */}
      {items.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-on-surface-variant">קבלות ({items.length})</h3>
          {items.map((r) => (
            <Link
              key={r.id}
              href={`/receipts/${r.id}`}
              className="bg-surface-container-lowest p-3 rounded-2xl flex items-center justify-between hover:bg-surface-bright transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: (r.category as Record<string, string> | null)?.color ? `${(r.category as Record<string, string>).color}20` : "#6366f120" }}>
                  <span className="material-symbols-outlined text-sm" style={{ color: (r.category as Record<string, string> | null)?.color || "#6366f1" }}>
                    {(r.category as Record<string, string> | null)?.icon || "receipt_long"}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-sm text-on-surface">{r.vendor_name || "שם ספק לא זוהה"}</p>
                  <p className="text-xs text-on-surface-variant">{r.receipt_date ? formatDate(r.receipt_date) : ""}</p>
                </div>
              </div>
              <p className="font-black text-sm text-on-surface">{r.total_amount ? formatCurrency(r.total_amount) : "\u2014"}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-outline mb-2 block">receipt_long</span>
          <p className="text-on-surface-variant">אין קבלות לחודש זה</p>
        </div>
      )}

      {/* Export button */}
      {items.length > 0 && (
        <Link
          href={`/export?year=${year}&month=${month}`}
          className="block bg-primary text-on-primary text-center py-3.5 rounded-full font-bold active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg align-middle me-1">send</span>
          שלח לרואה חשבון
        </Link>
      )}
    </section>
  );
}
