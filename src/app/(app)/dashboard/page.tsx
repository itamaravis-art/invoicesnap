import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getHebrewMonthName } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthName = getHebrewMonthName(month);

  // Fetch monthly report
  const { data: report } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("user_id", user.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  // Fetch recent receipts
  const { data: recentReceipts } = await supabase
    .from("receipts")
    .select("*, category:categories(*)")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch user settings for budget
  const { data: settings } = await supabase
    .from("user_settings")
    .select("monthly_budget")
    .eq("user_id", user.id)
    .single();

  const totalSpend = report?.total_amount || 0;
  const totalVat = report?.total_vat || 0;
  const receiptCount = report?.receipt_count || 0;
  const budget = settings?.monthly_budget;
  const budgetUsedPercent = budget ? Math.min(100, Math.round((totalSpend / budget) * 100)) : null;
  const budgetRemaining = budget ? budget - totalSpend : null;

  // Category icon mapping
  const categoryIcons: Record<string, string> = {
    "ציוד משרדי": "print",
    "נסיעות ותחבורה": "directions_car",
    "מזון ומשקאות": "restaurant",
    "תוכנה ומנויים": "computer",
    "שיווק ופרסום": "campaign",
    "ביטוח": "shield",
    "תקשורת": "phone_android",
    "שכירות": "home",
    "שירותים מקצועיים": "work",
    "אחר": "more_horiz",
  };

  const getReceiptIcon = (receipt: Record<string, unknown>) => {
    const catName = (receipt.category as Record<string, string> | null)?.name_he;
    return catName ? (categoryIcons[catName] || "receipt_long") : "receipt_long";
  };

  return (
    <>
      {/* Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Total Card */}
        <div className="md:col-span-2 bg-surface-container-lowest rounded-3xl p-8 transition-transform hover:scale-[1.01] card-hover flex flex-col justify-between">
          <div>
            <h2 className="text-on-surface-variant text-sm mb-2 font-black tracking-tight">סיכום חודשי</h2>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-5xl font-black tracking-tighter text-on-surface text-gradient">
                {formatCurrency(totalSpend)}
              </span>
              {receiptCount > 0 && (
                <span className="text-secondary font-bold text-sm bg-secondary-container px-3 py-1 rounded-full">
                  {receiptCount} קבלות
                </span>
              )}
            </div>
          </div>
          {totalVat > 0 && (
            <div className="mt-8 flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              <div className="flex flex-col gap-1 min-w-[100px]">
                <span className="text-xs text-on-surface-variant">מע״מ לניכוי</span>
                <span className="text-lg font-bold">{formatCurrency(totalVat)}</span>
              </div>
              <div className="flex flex-col gap-1 min-w-[100px]">
                <span className="text-xs text-on-surface-variant">לפני מע״מ</span>
                <span className="text-lg font-bold">{formatCurrency(totalSpend - totalVat)}</span>
              </div>
            </div>
          )}
          {receiptCount === 0 && (
            <p className="mt-4 text-sm text-on-surface-variant">
              עדיין אין קבלות החודש. סרוק קבלה כדי להתחיל!
            </p>
          )}
        </div>

        {/* Budget Card */}
        <div className="bg-primary-container text-on-primary-container rounded-3xl p-8 card-hover flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="material-symbols-outlined text-4xl">account_balance_wallet</span>
            <span className="text-xs font-bold uppercase tracking-widest opacity-80">סטטוס תקציב</span>
          </div>
          <div className="mt-6">
            {budget ? (
              <>
                <div className="h-2 w-full bg-primary/30 rounded-full mb-3">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${budgetUsedPercent}%` }}
                  />
                </div>
                <p className="text-sm">
                  נותרו {formatCurrency(budgetRemaining || 0)} מתקציב היעד של {monthName}
                </p>
              </>
            ) : (
              <p className="text-sm">
                הגדר תקציב חודשי בהגדרות כדי לעקוב אחרי ההוצאות
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Chart Section */}
      <section className="bg-surface-container-lowest rounded-3xl p-8 card-hover">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-lg font-bold text-on-surface">מגמת הוצאות</h3>
          <div className="flex gap-2">
            <button className="bg-surface-container-high px-4 py-2 rounded-full text-xs font-bold text-on-surface-variant">
              שנתי
            </button>
            <button className="bg-primary text-on-primary px-4 py-2 rounded-full text-xs font-bold">
              חודשי
            </button>
          </div>
        </div>
        <div className="w-full h-48 relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0040a1" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#0040a1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,150 Q100,140 200,80 T400,100 T600,40 T800,120 T1000,60"
              fill="none" stroke="#0040a1" strokeWidth="4" strokeLinecap="round"
            />
            <path
              d="M0,150 Q100,140 200,80 T400,100 T600,40 T800,120 T1000,60 V200 H0 Z"
              fill="url(#chartGradient)"
            />
          </svg>
          {receiptCount === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-on-surface-variant bg-surface/80 px-4 py-2 rounded-xl">
                הגרף יתמלא כשיהיו נתונים
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Expenses */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-bold text-on-surface">הוצאות אחרונות</h3>
          <a href="/receipts" className="text-primary text-sm font-bold">כל הקבלות</a>
        </div>

        {recentReceipts && recentReceipts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {recentReceipts.map((receipt) => (
              <a
                key={receipt.id}
                href={`/receipts/${receipt.id}`}
                className="bg-surface-container-lowest hover:bg-surface-bright transition-all p-4 rounded-3xl flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{getReceiptIcon(receipt as Record<string, unknown>)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{receipt.vendor_name || "שם ספק לא זוהה"}</p>
                    <p className="text-xs text-on-surface-variant">
                      {receipt.receipt_date
                        ? new Date(receipt.receipt_date).toLocaleDateString("he-IL", { day: "numeric", month: "short" })
                        : "ללא תאריך"
                      }
                      {(receipt.category as Record<string, string> | null)?.name_he && (
                        <> &bull; {(receipt.category as Record<string, string>).name_he}</>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-start">
                  <p className="font-black text-on-surface">
                    {receipt.total_amount ? formatCurrency(receipt.total_amount) : "—"}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    receipt.ocr_status === "completed"
                      ? "bg-secondary-container text-on-secondary-container"
                      : receipt.ocr_status === "failed"
                      ? "bg-error-container text-on-error-container"
                      : "bg-tertiary-container text-on-tertiary-container"
                  }`}>
                    {receipt.ocr_status === "completed" ? "אושר" :
                     receipt.ocr_status === "failed" ? "נכשל" :
                     receipt.ocr_status === "manual" ? "ידני" : "בעיבוד"}
                  </span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-3xl p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2 block">receipt_long</span>
            <p className="text-on-surface-variant">אין הוצאות עדיין</p>
            <p className="text-sm text-outline mt-1">לחץ על כפתור המצלמה כדי לסרוק קבלה</p>
          </div>
        )}
      </section>
    </>
  );
}
