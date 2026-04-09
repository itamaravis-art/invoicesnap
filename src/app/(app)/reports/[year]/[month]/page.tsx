import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getHebrewMonthName } from "@/lib/utils";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function ReportDetailPage({ params }: { params: Promise<{ year: string; month: string }> }) {
  const { year: yearStr, month: monthStr } = await params;
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const monthName = getHebrewMonthName(month);
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const { data: report } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*, category:categories(name_he, icon, color)")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .gte("receipt_date", startDate)
    .lte("receipt_date", endDate)
    .order("receipt_date", { ascending: false });

  const totalAmount = report?.total_amount || 0;
  const totalVat = report?.total_vat || 0;
  const receiptCount = report?.receipt_count || 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/reports" className="flex items-center gap-1 text-primary font-bold text-sm">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
          חזרה
        </Link>
        <Link
          href={`/export?year=${year}&month=${month}`}
          className="bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-lg">send</span>
          שלח לרו&quot;ח
        </Link>
      </div>

      <h2 className="text-2xl font-black text-on-surface">{monthName} {year}</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
          <p className="text-xs text-on-surface-variant mb-1">סה&quot;כ</p>
          <p className="text-lg font-black text-on-surface">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
          <p className="text-xs text-on-surface-variant mb-1">מע&quot;מ</p>
          <p className="text-lg font-black text-on-surface">{formatCurrency(totalVat)}</p>
        </div>
        <div className="bg-surface-container-lowest rounded-2xl p-4 text-center">
          <p className="text-xs text-on-surface-variant mb-1">קבלות</p>
          <p className="text-lg font-black text-on-surface">{receiptCount}</p>
        </div>
      </div>

      {/* Status badge */}
      {report && (
        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-bold ${
            report.status === "sent" ? "bg-secondary-container text-on-secondary-container" :
            report.status === "closed" ? "bg-tertiary-container text-on-tertiary-container" :
            "bg-surface-container-high text-on-surface-variant"
          }`}>
            {report.status === "sent" ? "נשלח לרואה חשבון" : report.status === "closed" ? "סגור" : "פתוח"}
          </span>
          {report.sent_to_accountant_at && (
            <span className="text-xs text-on-surface-variant">
              {new Date(report.sent_to_accountant_at).toLocaleDateString("he-IL")}
            </span>
          )}
        </div>
      )}

      {/* Receipt list */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-on-surface">קבלות</h3>
        {receipts && receipts.length > 0 ? (
          receipts.map((receipt) => (
            <Link
              key={receipt.id}
              href={`/receipts/${receipt.id}`}
              className="bg-surface-container-lowest hover:bg-surface-bright transition-all p-4 rounded-3xl flex items-center justify-between block"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">
                    {(receipt.category as { icon?: string } | null)?.icon || "receipt_long"}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">{receipt.vendor_name || "ספק לא ידוע"}</p>
                  <p className="text-xs text-on-surface-variant">
                    {receipt.receipt_date ? new Date(receipt.receipt_date).toLocaleDateString("he-IL") : ""}
                  </p>
                </div>
              </div>
              <p className="font-black text-on-surface">
                {receipt.total_amount ? formatCurrency(receipt.total_amount) : "\u2014"}
              </p>
            </Link>
          ))
        ) : (
          <p className="text-center text-on-surface-variant py-8">אין קבלות לחודש זה</p>
        )}
      </div>
    </section>
  );
}
