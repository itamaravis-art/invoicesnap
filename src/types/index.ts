export type ReceiptType = "receipt" | "invoice" | "tax_invoice" | "credit_note" | "other";
export type PaymentMethod = "cash" | "credit" | "transfer" | "check" | "bit" | "paybox" | "other";
export type OcrStatus = "pending" | "processing" | "completed" | "failed" | "manual";
export type ReportStatus = "open" | "closed" | "sent";
export type ExportMethod = "email" | "drive" | "whatsapp" | "zip";

export interface UserSettings {
  user_id: string;
  display_name: string | null;
  business_name: string | null;
  business_id: string | null;
  vat_rate: number;
  locale: string;
  currency: string;
  default_category_id: string | null;
  onboarding_completed: boolean;
  monthly_budget: number | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name_he: string;
  name_en: string | null;
  color: string;
  icon: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

export interface Vendor {
  id: string;
  user_id: string;
  name: string;
  name_normalized: string;
  default_category_id: string | null;
  occurrence_count: number;
  last_seen_at: string;
  created_at: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  image_storage_path: string;
  image_thumbnail_path: string | null;
  original_filename: string | null;
  vendor_name: string | null;
  vendor_id: string | null;
  receipt_date: string | null;
  total_amount: number | null;
  vat_amount: number | null;
  amount_before_vat: number | null;
  receipt_number: string | null;
  payment_method: PaymentMethod | null;
  currency: string;
  category_id: string | null;
  tags: string[];
  notes: string | null;
  ocr_status: OcrStatus;
  ocr_confidence: number | null;
  ocr_raw_response: Record<string, unknown> | null;
  ocr_language: string | null;
  is_manually_edited: boolean;
  receipt_type: ReceiptType;
  gdrive_synced: boolean;
  gdrive_file_id: string | null;
  gdrive_synced_at: string | null;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
  vendor?: Vendor;
}

export interface MonthlyReport {
  id: string;
  user_id: string;
  year: number;
  month: number;
  total_amount: number;
  total_vat: number;
  receipt_count: number;
  status: ReportStatus;
  sent_to_accountant_at: string | null;
  sent_method: ExportMethod | null;
  created_at: string;
  updated_at: string;
}

export interface AccountantContact {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface GdriveConnection {
  id: string;
  user_id: string;
  google_email: string;
  root_folder_id: string | null;
  is_active: boolean;
  last_sync_at: string | null;
  last_sync_error: string | null;
  created_at: string;
}

export interface OcrResult {
  vendor_name: string | null;
  receipt_date: string | null;
  total_amount: number | null;
  vat_amount: number | null;
  amount_before_vat: number | null;
  receipt_number: string | null;
  payment_method: PaymentMethod | null;
  receipt_type: ReceiptType;
  currency: string;
  language: string;
  confidence: number;
  line_items: Array<{ description: string; amount: number }>;
  raw_text: string;
}

export interface DashboardData {
  totalSpend: number;
  totalVat: number;
  receiptCount: number;
  topCategories: Array<{
    id: string;
    name_he: string;
    color: string;
    icon: string;
    amount: number;
    count: number;
  }>;
  trend: Array<{
    month: string;
    amount: number;
  }>;
  budgetUsed: number | null;
  monthlyBudget: number | null;
}
