-- =====================================================
-- 013_qr_ordering.sql
-- Bolena Cafe — QR masa siparişi + site_settings tablosu
-- =====================================================

-- 1. tables tablosuna QR sütunları
ALTER TABLE tables
  ADD COLUMN IF NOT EXISTS qr_token  UUID    NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS qr_enabled BOOLEAN NOT NULL DEFAULT true;

-- Her masanın qr_token'ı unique olmalı
CREATE UNIQUE INDEX IF NOT EXISTS uq_tables_qr_token ON tables(qr_token);

-- 2. site_settings (anahtar–değer çifti tablosu)
CREATE TABLE IF NOT EXISTS site_settings (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  key        TEXT    NOT NULL UNIQUE,
  value      JSONB   NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_site_settings_updated_at ON site_settings;
CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Başlangıç verisi
INSERT INTO site_settings (key, value)
VALUES ('qr_ordering', '{"global_enabled": true}')
ON CONFLICT (key) DO NOTHING;

-- 3. tables'ı realtime yayınına ekle (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tables;
  END IF;
END $$;
