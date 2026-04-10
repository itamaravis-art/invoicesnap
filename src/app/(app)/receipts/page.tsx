import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getShaamStatus } from "@/lib/utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RetryOcrButton } from "@/components/receipts/RetryOcrButton";

export default async function ReceiptsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*, category:categories(*)")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-on-surface">קבלות</h2>
        <Link
          href="/receipts/new"
          className="bg-primary text-on-primary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          סרוק קבלה
        </Link>
      </div>

      {/* Quick export button */}
      {receipts && receipts.length > 0 && (
        <Link
          href={`/export?year=${new Date().getFullYear()}&month=${new Date().getMonth() + 1}`}
          className="w-full bg-primary text-on-primary py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">email</span>
          שלח את כל הקבלות של החודש למייל
        </Link>
      )}

      {receipts && receipts.length > 0 ? (
        <div className="grid grid-cols-1 gap-3">
          {receipts.map((receipt) => (
            <Link
              key={receipt.id}
              href={`/receipts/${receipt.id}`}
              className="bg-surface-container-lowest hover:bg-surface-bright transition-all p-4 rounded-3xl flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">receipt_long</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface">
                    {receipt.vendor_name || "שם ספק לא זוהה"}
                    {getShaamStatus(receipt) === "missing" && (
                      <span className="material-symbols-outlined text-error text-sm" title="חסר מספר הקצאה שע״מ">warning</span>
                    )}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {receipt.receipt_date
                      ? new Date(receipt.receipt_date).toLocaleDateString("he-IL")
                      : "תאריך לא זוהה"}
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
                <div className="flex items-center gap-1 flex-wrap justify-start">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    receipt.ocr_status === "completed" ? "bg-secondary-container text-on-secondary-container" :
                    receipt.ocr_status === "failed" ? "bg-error-container text-on-error-container" :
                    "bg-tertiary-container text-on-tertiary-container"
                  }`}>
                    {receipt.ocr_status === "completed" ? "אושר" :
                     receipt.ocr_status === "failed" ? "נכשל" : "בעיבוד"}
                  </span>
                  {receipt.ocr_status === "failed" && (
                    <RetryOcrButton receiptId={receipt.id} />
                  )}
                  {receipt.tags?.includes("duplicate") && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                      כפולה?
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-3xl p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-outline mb-3 block">receipt_long</span>
          <h3 className="text-lg font-bold text-on-surface mb-1">עדיין אין קבלות</h3>
          <p className="text-sm text-on-surface-variant mb-6">סרוק קבלה כדי להתחיל לנהל את ההוצאות שלך</p>
          <Link
            href="/receipts/new"
            className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined">photo_camera</span>
            סרוק קבלה
          </Link>
        </div>
      )}
    </section>
  );
}
