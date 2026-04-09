export const DEFAULT_VAT_RATE = 17.0;
export const DEFAULT_CURRENCY = "ILS";
export const DEFAULT_LOCALE = "he";

export const RECEIPT_TYPES = {
  receipt: "קבלה",
  invoice: "חשבונית",
  tax_invoice: "חשבונית מס",
  credit_note: "חשבונית זיכוי",
  other: "אחר",
} as const;

export const PAYMENT_METHODS = {
  cash: "מזומן",
  credit: "אשראי",
  transfer: "העברה",
  check: "צ׳ק",
  bit: "ביט",
  paybox: "פייבוקס",
  other: "אחר",
} as const;

export const OCR_STATUS = {
  pending: "ממתין",
  processing: "מעבד",
  completed: "הושלם",
  failed: "נכשל",
  manual: "ידני",
} as const;

export const DEFAULT_CATEGORIES = [
  { name_he: "ציוד משרדי וחומרים", name_en: "Office Supplies", icon: "print", color: "#6366f1", tax_code: "17" },
  { name_he: "נסיעות ורכב", name_en: "Travel & Vehicle", icon: "directions_car", color: "#06b6d4", tax_code: "21" },
  { name_he: "אחזקת רכב ודלק", name_en: "Vehicle Maintenance & Fuel", icon: "local_gas_station", color: "#0891b2", tax_code: "22" },
  { name_he: "מזון וכיבודים", name_en: "Food & Entertainment", icon: "restaurant", color: "#f59e0b", tax_code: "41" },
  { name_he: "תוכנה ומנויים", name_en: "Software & Subscriptions", icon: "computer", color: "#8b5cf6", tax_code: "31" },
  { name_he: "שיווק ופרסום", name_en: "Marketing & Advertising", icon: "campaign", color: "#ec4899", tax_code: "32" },
  { name_he: "ביטוח", name_en: "Insurance", icon: "shield", color: "#14b8a6", tax_code: "51" },
  { name_he: "תקשורת וטלפון", name_en: "Telecom", icon: "phone", color: "#f97316", tax_code: "33" },
  { name_he: "שכירות ואחזקה", name_en: "Rent & Maintenance", icon: "home", color: "#ef4444", tax_code: "23" },
  { name_he: "שירותים מקצועיים", name_en: "Professional Services", icon: "gavel", color: "#84cc16", tax_code: "34" },
  { name_he: "ציוד ומכונות", name_en: "Equipment & Machinery", icon: "construction", color: "#a855f7", tax_code: "18" },
  { name_he: "חשמל ומים", name_en: "Utilities", icon: "bolt", color: "#eab308", tax_code: "24" },
  { name_he: "הוצאות בנק ומימון", name_en: "Bank & Finance", icon: "account_balance", color: "#64748b", tax_code: "61" },
  { name_he: "הוצאות משפטיות", name_en: "Legal Expenses", icon: "balance", color: "#dc2626", tax_code: "35" },
  { name_he: "הכשרה והשתלמות", name_en: "Training & Education", icon: "school", color: "#2563eb", tax_code: "36" },
  { name_he: "אחר", name_en: "Other", icon: "more_horiz", color: "#9ca3af", tax_code: "99" },
] as const;

export const SHAAM_THRESHOLD = 5000;
export const VAT_PERIODS: Record<number, string> = {
  1: "\u05D9\u05E0\u05D5\u05D0\u05E8-\u05E4\u05D1\u05E8\u05D5\u05D0\u05E8", 2: "\u05DE\u05E8\u05E5-\u05D0\u05E4\u05E8\u05D9\u05DC", 3: "\u05DE\u05D0\u05D9-\u05D9\u05D5\u05E0\u05D9",
  4: "\u05D9\u05D5\u05DC\u05D9-\u05D0\u05D5\u05D2\u05D5\u05E1\u05D8", 5: "\u05E1\u05E4\u05D8\u05DE\u05D1\u05E8-\u05D0\u05D5\u05E7\u05D8\u05D5\u05D1\u05E8", 6: "\u05E0\u05D5\u05D1\u05DE\u05D1\u05E8-\u05D3\u05E6\u05DE\u05D1\u05E8",
};
export function getVatPeriod(month: number): number {
  return Math.ceil(month / 2);
}
export function getVatPeriodMonths(period: number): [number, number] {
  return [period * 2 - 1, period * 2];
}

export const OCR_MIN_CONFIDENCE = 0.1;
export const OCR_MODEL = "gemini-2.5-flash";
export const OCR_MAX_TOKENS = 4096;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
