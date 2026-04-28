-- =====================================================
-- 009_campaign_targeting.sql
-- Kampanya hedefleme: kategori ve ürün bazlı kapsam
-- NULL = tüm menü, dolu = belirtilen kategoriler/ürünler
-- =====================================================

ALTER TABLE menu_campaigns
  ADD COLUMN IF NOT EXISTS applies_to_category_ids UUID[],
  ADD COLUMN IF NOT EXISTS applies_to_product_ids UUID[];

-- Hedefleme için partial index
CREATE INDEX IF NOT EXISTS idx_menu_campaigns_category_scope
  ON menu_campaigns USING GIN (applies_to_category_ids)
  WHERE applies_to_category_ids IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_menu_campaigns_product_scope
  ON menu_campaigns USING GIN (applies_to_product_ids)
  WHERE applies_to_product_ids IS NOT NULL;
