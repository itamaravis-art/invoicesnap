import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: receipt } = await supabase
    .from("receipts")
    .select("*, category:categories(*), vendor:vendors(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!receipt) notFound();

  const imageUrl = receipt.image_storage_path
    ? supabase.storage.from("receipts").getPublicUrl(receipt.image_storage_path).data.publicUrl
    : null;

  const PAYMENT_LABELS: Record<string, string> = {
    cash: "מזומן", credit: "אשראי", transfer: "העברה",
    check: "צ׳ק", bit: "ביט", paybox: "פייבוקס", other: "אחר",
  };
  const TYPE_LABELS: Record<string, string> = {
    receipt: "קבלה", invoice: "חשבונית", tax_invoice: "חשבונית מס",
    credit_note: "חשבונית זיכוי", other: "אחר",
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/receipts" className="flex items-center gap-1 text-primary font-bold text-sm">
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
          חזרה
        </Link>
        <span className={`text-xs px-3 py-1 rounded-full font-bold ${
          receipt.ocr_status === "completed" ? "bg-secondary-container text-on-secondary-container" :
          receipt.ocr_status === "failed" ? "bg-error-container text-on-error-container" :
          "bg-tertiary-container text-on-tertiary-container"
        }`}>
          {receipt.ocr_status === "completed" ? "אושר" :
           receipt.ocr_status === "failed" ? "נכשל" : "בבדיקה"}
        </span>
      </div>

      {/* Receipt image */}
      {imageUrl && (
        <div className="bg-surface-container rounded-3xl overflow-hidden">
          <img src={imageUrl} alt="Receipt" className="w-full object-contain max-h-80" />
        </div>
      )}

      {/* Receipt data */}
      <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-on-surface">
              {receipt.vendor_name || "ספק לא ידוע"}
            </h2>
            {receipt.receipt_date && (
              <p className="text-sm text-on-surface-variant">{formatDate(receipt.receipt_date)}</p>
            )}
          </div>
          {receipt.total_amount && (
            <span className="text-3xl font-black tracking-tighter text-on-surface">
              {formatCurrency(receipt.total_amount)}
            </span>
          )}
        </div>

        <div className="h-px bg-outline-variant" />

        <div className="grid grid-cols-2 gap-4">
          {receipt.vat_amount != null && (
            <div>
              <p className="text-xs text-on-surface-variant mb-1">מע״מ</p>
              <p className="font-bold">{formatCurrency(receipt.vat_amount)}</p>
            </div>
          )}
          {receipt.amount_before_vat != null && (
            <div>
              <p className="text-xs text-on-surface-variant mb-1">לפני מע״מ</p>
              <p className="font-bold">{formatCurrency(receipt.amount_before_vat)}</p>
            </div>
          )}
          {receipt.payment_method && (
            <div>
              <p className="text-xs text-on-surface-variant mb-1">אמצעי תשלום</p>
              <p className="font-bold">{PAYMENT_LABELS[receipt.payment_method] || receipt.payment_method}</p>
            </div>
          )}
          {receipt.receipt_number && (
            <div>
              <p className="text-xs text-on-surface-variant mb-1">מספר קבלה</p>
              <p className="font-bold" dir="ltr">{receipt.receipt_number}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-on-surface-variant mb-1">סוג</p>
            <p className="font-bold">{TYPE_LABELS[receipt.receipt_type] || receipt.receipt_type}</p>
          </div>
          {(receipt.category as Record<string, string> | null)?.name_he && (
            <div>
              <p className="text-xs text-on-surface-variant mb-1">קטגוריה</p>
              <p className="font-bold">{(receipt.category as Record<string, string>).name_he}</p>
            </div>
          )}
        </div>

        {receipt.notes && (
          <>
            <div className="h-px bg-outline-variant" />
            <div>
              <p className="text-xs text-on-surface-variant mb-1">הערות</p>
              <p className="text-sm">{receipt.notes}</p>
            </div>
          </>
        )}
      </div>

      {/* Drive sync status */}
      <div className="bg-surface-container-lowest rounded-3xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">cloud</span>
          <span className="text-sm font-medium">
            {receipt.gdrive_synced ? "מסונכרן ב-Google Drive" : "לא מסונכרן"}
          </span>
        </div>
        {receipt.gdrive_synced && (
          <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
        )}
      </div>
    </section>
  );
}
