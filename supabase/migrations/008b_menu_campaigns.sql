-- =====================================================
-- 008_menu_campaigns.sql
-- Bolena Cafe — Menü Kampanya Takvimi
-- Tüm menüye gün/saat bazlı indirim tanımlar
-- =====================================================

CREATE TABLE IF NOT EXISTS menu_campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tr             TEXT NOT NULL,
  name_en             TEXT NOT NULL,
  description_tr      TEXT,
  description_en      TEXT,
  -- 'base': orijinal fiyat üzerinden, 'effective': mevcut kampanya fiyatı üzerinden
  price_basis         TEXT NOT NULL DEFAULT 'effective'
                        CHECK (price_basis IN ('base', 'effective')),
  discount_percent    NUMERIC(5,2) NOT NULL
                        CHECK (discount_percent > 0 AND discount_percent <= 100),
  max_discount_amount NUMERIC(10,2),           -- ₺ tavan, NULL = tavan yok
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  -- 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi (working_hours konvansiyonu)
  active_days         SMALLINT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
  start_time          TIME,                    -- NULL = günün başından
  end_time            TIME,                    -- NULL = günün sonuna kadar
  is_active           BOOLEAN NOT NULL DEFAULT true,
  priority            INTEGER NOT NULL DEFAULT 0,  -- yüksek = önce uygulanır
  notes               TEXT,                    -- dahili admin notu
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_campaign_dates CHECK (end_date >= start_date),
  CONSTRAINT chk_campaign_times CHECK (
    start_time IS NULL OR end_time IS NULL OR end_time > start_time
  )
);

-- updated_at otomatik güncelleme (003_functions.sql'deki update_updated_at_column() kullanılır)
DROP TRIGGER IF EXISTS trg_menu_campaigns_updated_at ON menu_campaigns;
CREATE TRIGGER trg_menu_campaigns_updated_at
  BEFORE UPDATE ON menu_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Aktif kampanyaları tarih bazlı hızlı sorgu için indeks
CREATE INDEX IF NOT EXISTS idx_menu_campaigns_active
  ON menu_campaigns (is_active, start_date, end_date)
  WHERE is_active = true;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE menu_campaigns ENABLE ROW LEVEL SECURITY;

-- Tüm authenticated kullanıcılar okuyabilir (sipariş ekleme sırasında fiyat hesabı için)
DROP POLICY IF EXISTS "menu_campaigns_authenticated_select" ON menu_campaigns;
CREATE POLICY "menu_campaigns_authenticated_select" ON menu_campaigns
  FOR SELECT USING (auth.role() = 'authenticated');

-- Sadece adminler yazabilir
DROP POLICY IF EXISTS "menu_campaigns_admin_write" ON menu_campaigns;
CREATE POLICY "menu_campaigns_admin_write" ON menu_campaigns
  FOR ALL USING (get_my_role() = 'admin');
