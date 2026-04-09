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
  { name_he: "ציוד משרדי", name_en: "Office Supplies", icon: "print", color: "#6366f1" },
  { name_he: "נסיעות ותחבורה", name_en: "Travel", icon: "directions_car", color: "#8b5cf6" },
  { name_he: "מזון ומשקאות", name_en: "Food & Beverages", icon: "restaurant", color: "#ec4899" },
  { name_he: "תוכנה ומנויים", name_en: "Software & Subs", icon: "computer", color: "#3b82f6" },
  { name_he: "שיווק ופרסום", name_en: "Marketing", icon: "campaign", color: "#f59e0b" },
  { name_he: "ביטוח", name_en: "Insurance", icon: "shield", color: "#10b981" },
  { name_he: "תקשורת", name_en: "Telecom", icon: "phone_android", color: "#06b6d4" },
  { name_he: "שכירות", name_en: "Rent", icon: "home", color: "#f97316" },
  { name_he: "שירותים מקצועיים", name_en: "Professional Services", icon: "work", color: "#84cc16" },
  { name_he: "אחר", name_en: "Other", icon: "more_horiz", color: "#737785" },
] as const;

export const OCR_MIN_CONFIDENCE = 0.1;
export const OCR_MODEL = "gemini-2.5-flash";
export const OCR_MAX_TOKENS = 4096;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
