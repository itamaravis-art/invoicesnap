import type { OcrResult, PaymentMethod, ReceiptType } from "@/types";
import { DEFAULT_VAT_RATE } from "@/lib/constants";

const VALID_PAYMENT_METHODS: PaymentMethod[] = ["cash", "credit", "transfer", "check", "bit", "paybox", "other"];
const VALID_RECEIPT_TYPES: ReceiptType[] = ["receipt", "invoice", "tax_invoice", "credit_note", "other"];

export function validateOcrResult(raw: Record<string, unknown>): OcrResult {
  // Parse amounts
  let totalAmount = parseAmount(raw.total_amount);
  let vatAmount = parseAmount(raw.vat_amount);
  let amountBeforeVat = parseAmount(raw.amount_before_vat);

  // Cross-calculate VAT fields
  if (totalAmount != null && vatAmount == null && amountBeforeVat == null) {
    vatAmount = round(totalAmount / (1 + DEFAULT_VAT_RATE / 100) * (DEFAULT_VAT_RATE / 100));
    amountBeforeVat = round(totalAmount - vatAmount);
  } else if (totalAmount != null && vatAmount != null && amountBeforeVat == null) {
    amountBeforeVat = round(totalAmount - vatAmount);
  } else if (amountBeforeVat != null && vatAmount != null && totalAmount == null) {
    totalAmount = round(amountBeforeVat + vatAmount);
  }

  // Validate date
  let receiptDate: string | null = null;
  if (typeof raw.receipt_date === "string") {
    const d = new Date(raw.receipt_date);
    if (!isNaN(d.getTime())) {
      receiptDate = d.toISOString().split("T")[0];
    }
  }

  // Validate payment method
  const paymentMethod = VALID_PAYMENT_METHODS.includes(raw.payment_method as PaymentMethod)
    ? (raw.payment_method as PaymentMethod)
    : null;

  // Validate receipt type
  const receiptType = VALID_RECEIPT_TYPES.includes(raw.receipt_type as ReceiptType)
    ? (raw.receipt_type as ReceiptType)
    : "receipt";

  // Validate confidence
  let confidence = typeof raw.confidence === "number" ? raw.confidence : 0;
  confidence = Math.max(0, Math.min(1, confidence));

  // Validate currency
  const validCurrencies = ["ILS", "USD", "EUR"];
  const currency = validCurrencies.includes(raw.currency as string) ? (raw.currency as string) : "ILS";

  // Parse line items
  const lineItems: Array<{ description: string; amount: number }> = [];
  if (Array.isArray(raw.line_items)) {
    for (const item of raw.line_items) {
      if (item && typeof item === "object" && "description" in item && "amount" in item) {
        const desc = String((item as Record<string, unknown>).description);
        const amt = parseAmount((item as Record<string, unknown>).amount);
        if (desc && amt != null) {
          lineItems.push({ description: desc, amount: amt });
        }
      }
    }
  }

  return {
    vendor_name: typeof raw.vendor_name === "string" ? raw.vendor_name.trim() : null,
    receipt_date: receiptDate,
    total_amount: totalAmount,
    vat_amount: vatAmount,
    amount_before_vat: amountBeforeVat,
    receipt_number: typeof raw.receipt_number === "string" ? raw.receipt_number.trim() : null,
    payment_method: paymentMethod,
    receipt_type: receiptType,
    currency,
    language: typeof raw.language === "string" ? raw.language : "he",
    confidence,
    line_items: lineItems,
    raw_text: typeof raw.raw_text === "string" ? raw.raw_text : "",
    business_number: typeof raw.business_number === "string" ? raw.business_number.replace(/\D/g, "").slice(0, 9) || null : null,
    allocation_number: typeof raw.allocation_number === "string" ? raw.allocation_number.trim() || null : null,
  };
}

function parseAmount(val: unknown): number | null {
  if (val == null) return null;
  const num = typeof val === "number" ? val : parseFloat(String(val));
  if (isNaN(num)) return null;
  return round(num);
}

function round(val: number): number {
  return Math.round(val * 100) / 100;
}
