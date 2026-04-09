import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getHebrewMonthName } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: reports } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(24);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-black text-on-surface">דוחות חודשיים</h2>

      {reports && reports.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/reports/${r.year}/${r.month}`}
              className="bg-surface-container-lowest hover:bg-surface-bright transition-all p-5 rounded-3xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-container rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container">calendar_month</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">
                    {getHebrewMonthName(r.month)} {r.year}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {r.receipt_count} קבלות
                  </p>
                </div>
              </div>
              <div className="text-start">
                <p className="font-black text-on-surface">{formatCurrency(r.total_amount)}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  r.status === "sent" ? "bg-secondary-container text-on-secondary-container" :
                  r.status === "closed" ? "bg-tertiary-container text-on-tertiary-container" :
                  "bg-surface-container-high text-on-surface-variant"
                }`}>
                  {r.status === "sent" ? "נשלח" : r.status === "closed" ? "סגור" : "פתוח"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3 block">assessment</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">עדיין אין דוחות</h3>
          <p className="text-sm text-on-surface-variant">כשתוסיף קבלות, ניצור לך דוחות חודשיים אוטומטית</p>
        </div>
      )}
    </section>
  );
}
