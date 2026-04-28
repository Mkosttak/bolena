-- =====================================================
-- 005_improvements.sql
-- Bolena Cafe — Performans + veri bütünlüğü iyileştirmeleri
-- =====================================================

-- =====================================================
-- P-06: Eksik composite indexler
-- Masa sistemi ve platform siparişleri sayfalarında
-- aktif sipariş sorgularını hızlandırır
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_table_status
  ON orders(table_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_orders_type_status
  ON orders(type, status) WHERE status = 'active';

-- =====================================================
-- P-07: Kampanya fiyatı tutarlılık kısıtı
-- campaign_price ve campaign_end_date birlikte
-- dolu ya da birlikte null olmalı
-- =====================================================

ALTER TABLE products
  ADD CONSTRAINT chk_campaign_consistency
  CHECK ((campaign_price IS NULL) = (campaign_end_date IS NULL));

-- =====================================================
-- P-08: working_hours updated_at trigger
-- Çalışma saatleri güncellenince updated_at otomatik
-- değişmesi için eksik trigger eklendi
-- =====================================================

DROP TRIGGER IF EXISTS trg_working_hours_updated_at ON working_hours;
CREATE TRIGGER trg_working_hours_updated_at
  BEFORE UPDATE ON working_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
