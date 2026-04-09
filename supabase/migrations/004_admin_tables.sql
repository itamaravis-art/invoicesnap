-- Admin audit logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_admin_logs_created ON admin_logs(created_at DESC);

-- System settings (key-value store)
CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Seed default system settings
INSERT INTO system_settings (key, value) VALUES
  ('default_vat_rate', '17.0'),
  ('max_file_size_mb', '10'),
  ('ocr_model', '"gemini-2.0-flash"'),
  ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;
