-- Auto-update monthly_reports trigger
CREATE OR REPLACE FUNCTION update_monthly_report()
RETURNS TRIGGER AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
  v_user_id UUID;
BEGIN
  -- Determine which user/period to update
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_year := EXTRACT(YEAR FROM COALESCE(OLD.receipt_date, OLD.created_at));
    v_month := EXTRACT(MONTH FROM COALESCE(OLD.receipt_date, OLD.created_at));
  ELSE
    v_user_id := NEW.user_id;
    v_year := EXTRACT(YEAR FROM COALESCE(NEW.receipt_date, NEW.created_at));
    v_month := EXTRACT(MONTH FROM COALESCE(NEW.receipt_date, NEW.created_at));
  END IF;

  -- Upsert the monthly report with fresh aggregates
  INSERT INTO monthly_reports (user_id, year, month, total_amount, total_vat, receipt_count)
  SELECT
    v_user_id,
    v_year,
    v_month,
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(vat_amount), 0),
    COUNT(*)
  FROM receipts
  WHERE user_id = v_user_id
    AND EXTRACT(YEAR FROM COALESCE(receipt_date, created_at)) = v_year
    AND EXTRACT(MONTH FROM COALESCE(receipt_date, created_at)) = v_month
    AND is_archived = FALSE
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET
    total_amount = EXCLUDED.total_amount,
    total_vat = EXCLUDED.total_vat,
    receipt_count = EXCLUDED.receipt_count,
    updated_at = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to receipts table
DROP TRIGGER IF EXISTS trg_update_monthly_report ON receipts;
CREATE TRIGGER trg_update_monthly_report
  AFTER INSERT OR UPDATE OR DELETE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_monthly_report();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_monthly_reports_updated_at
  BEFORE UPDATE ON monthly_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
