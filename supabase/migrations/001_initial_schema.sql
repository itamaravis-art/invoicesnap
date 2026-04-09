-- InvoiceSnap Database Schema
-- All tables for receipt management app

-- User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  business_name TEXT,
  business_id TEXT,
  vat_rate NUMERIC(5,2) DEFAULT 17.00,
  locale TEXT DEFAULT 'he',
  currency TEXT DEFAULT 'ILS',
  default_category_id UUID,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  monthly_budget NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name_he TEXT NOT NULL,
  name_en TEXT,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'receipt_long',
  is_system BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_categories" ON categories FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_categories_user ON categories(user_id, sort_order);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  default_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  occurrence_count INTEGER DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name_normalized)
);
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_vendors" ON vendors FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_vendors_user_name ON vendors(user_id, name_normalized);

-- Receipts
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_storage_path TEXT NOT NULL,
  image_thumbnail_path TEXT,
  original_filename TEXT,
  vendor_name TEXT,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  receipt_date DATE,
  total_amount NUMERIC(12,2),
  vat_amount NUMERIC(12,2),
  amount_before_vat NUMERIC(12,2),
  receipt_number TEXT,
  payment_method TEXT CHECK (payment_method IN ('cash','credit','transfer','check','bit','paybox','other')),
  currency TEXT DEFAULT 'ILS',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending','processing','completed','failed','manual')),
  ocr_confidence NUMERIC(3,2),
  ocr_raw_response JSONB,
  ocr_language TEXT,
  is_manually_edited BOOLEAN DEFAULT FALSE,
  receipt_type TEXT DEFAULT 'receipt' CHECK (receipt_type IN ('receipt','invoice','tax_invoice','credit_note','other')),
  gdrive_synced BOOLEAN DEFAULT FALSE,
  gdrive_file_id TEXT,
  gdrive_synced_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_receipts" ON receipts FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_user_date ON receipts(user_id, receipt_date DESC);
CREATE INDEX idx_receipts_user_category ON receipts(user_id, category_id);
CREATE INDEX idx_receipts_user_vendor ON receipts(user_id, vendor_id);
CREATE INDEX idx_receipts_ocr_pending ON receipts(ocr_status) WHERE ocr_status = 'pending';
CREATE INDEX idx_receipts_gdrive_unsynced ON receipts(user_id) WHERE gdrive_synced = FALSE;
CREATE INDEX idx_receipts_created ON receipts(created_at DESC);

-- Monthly Reports
CREATE TABLE IF NOT EXISTS monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_amount NUMERIC(12,2) DEFAULT 0,
  total_vat NUMERIC(12,2) DEFAULT 0,
  receipt_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open','closed','sent')),
  sent_to_accountant_at TIMESTAMPTZ,
  sent_method TEXT CHECK (sent_method IN ('email','drive','whatsapp','zip')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_reports" ON monthly_reports FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_reports_user_period ON monthly_reports(user_id, year DESC, month DESC);

-- Accountant Contacts
CREATE TABLE IF NOT EXISTS accountant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE accountant_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_accountants" ON accountant_contacts FOR ALL USING (auth.uid() = user_id);

-- Google Drive Connections
CREATE TABLE IF NOT EXISTS gdrive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  root_folder_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE gdrive_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_gdrive" ON gdrive_connections FOR ALL USING (auth.uid() = user_id);

-- Sync Log
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('receipt','category','vendor','settings')),
  entity_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create','update','delete')),
  payload JSONB,
  client_timestamp TIMESTAMPTZ,
  server_timestamp TIMESTAMPTZ DEFAULT NOW(),
  conflict_resolved BOOLEAN DEFAULT FALSE
);
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_sync_log" ON sync_log FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_sync_log_user ON sync_log(user_id, server_timestamp DESC);

-- FK for user_settings.default_category_id
ALTER TABLE user_settings
  ADD CONSTRAINT fk_default_category
  FOREIGN KEY (default_category_id)
  REFERENCES categories(id) ON DELETE SET NULL;
