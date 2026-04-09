import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "ILS"): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export function formatRelativeDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `היום, ${d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `אתמול, ${d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return formatDateShort(d);
}

export function getHebrewMonthName(month: number): string {
  const months = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
  ];
  return months[month - 1] || "";
}

export function getShaamStatus(receipt: { total_amount: number | null; allocation_number: string | null; receipt_type: string }): "valid" | "missing" | "not_required" {
  if (!receipt.total_amount || receipt.total_amount < 5000) return "not_required";
  if (!["tax_invoice", "invoice"].includes(receipt.receipt_type)) return "not_required";
  return receipt.allocation_number ? "valid" : "missing";
}

export function generateReceiptHash(vendorName: string | null, date: string | null, amount: number | null): string | null {
  if (!vendorName && !date && !amount) return null;
  const parts = [
    (vendorName || "").toLowerCase().trim(),
    date || "",
    amount != null ? amount.toFixed(2) : "",
  ];
  // Simple hash - good enough for dedup
  let hash = 0;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return hash.toString(36);
}
