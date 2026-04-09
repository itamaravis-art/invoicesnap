import { getHebrewMonthName } from "@/lib/utils";

interface ReceiptRow {
  receipt_date: string | null;
  vendor_name: string | null;
  total_amount: number | null;
  vat_amount: number | null;
  amount_before_vat: number | null;
  receipt_number: string | null;
  payment_method: string | null;
  receipt_type: string;
  category_name?: string | null;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "\u05DE\u05D6\u05D5\u05DE\u05DF", credit: "\u05D0\u05E9\u05E8\u05D0\u05D9", transfer: "\u05D4\u05E2\u05D1\u05E8\u05D4",
  check: "\u05E6\u05F3\u05E7", bit: "\u05D1\u05D9\u05D8", paybox: "\u05E4\u05D9\u05D9\u05D1\u05D5\u05E7\u05E1", other: "\u05D0\u05D7\u05E8",
};

const TYPE_LABELS: Record<string, string> = {
  receipt: "\u05E7\u05D1\u05DC\u05D4", invoice: "\u05D7\u05E9\u05D1\u05D5\u05E0\u05D9\u05EA", tax_invoice: "\u05D7\u05E9\u05D1\u05D5\u05E0\u05D9\u05EA \u05DE\u05E1",
  credit_note: "\u05D7\u05E9\u05D1\u05D5\u05E0\u05D9\u05EA \u05D6\u05D9\u05DB\u05D5\u05D9", other: "\u05D0\u05D7\u05E8",
};

export function generateCSV(receipts: ReceiptRow[], year: number, month: number): string {
  const BOM = "\uFEFF"; // UTF-8 BOM for Hebrew in Excel
  const monthName = getHebrewMonthName(month);

  const headers = [
    "\u05EA\u05D0\u05E8\u05D9\u05DA", "\u05E1\u05E4\u05E7", "\u05E1\u05DB\u05D5\u05DD \u05DB\u05D5\u05DC\u05DC", "\u05DE\u05E2\"\u05DE", "\u05DC\u05E4\u05E0\u05D9 \u05DE\u05E2\"\u05DE",
    "\u05DE\u05E1\u05E4\u05E8 \u05E7\u05D1\u05DC\u05D4", "\u05D0\u05DE\u05E6\u05E2\u05D9 \u05EA\u05E9\u05DC\u05D5\u05DD", "\u05E1\u05D5\u05D2 \u05DE\u05E1\u05DE\u05DA", "\u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D4"
  ];

  const rows = receipts.map((r) => [
    r.receipt_date || "",
    `"${(r.vendor_name || "").replace(/"/g, '""')}"`,
    r.total_amount?.toFixed(2) || "",
    r.vat_amount?.toFixed(2) || "",
    r.amount_before_vat?.toFixed(2) || "",
    r.receipt_number || "",
    PAYMENT_LABELS[r.payment_method || ""] || r.payment_method || "",
    TYPE_LABELS[r.receipt_type] || r.receipt_type,
    `"${(r.category_name || "").replace(/"/g, '""')}"`,
  ]);

  // Summary row
  const totalAmount = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const totalVat = receipts.reduce((sum, r) => sum + (r.vat_amount || 0), 0);
  const totalBeforeVat = receipts.reduce((sum, r) => sum + (r.amount_before_vat || 0), 0);

  rows.push([]); // Empty row
  rows.push([
    `\u05E1\u05D9\u05DB\u05D5\u05DD ${monthName} ${year}`, "",
    totalAmount.toFixed(2), totalVat.toFixed(2), totalBeforeVat.toFixed(2),
    "", "", "", ""
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\r\n");

  return BOM + csvContent;
}
