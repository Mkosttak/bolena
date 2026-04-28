-- =====================================================
-- 006_product_sort_order.sql
-- Ürünlere sort_order alanı ekle (DnD sıralama desteği)
-- =====================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Mevcut ürünleri kategori içinde alfabetik sırayla numaralandır
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY category_id ORDER BY name_tr) - 1 AS rn
  FROM products
)
UPDATE products SET sort_order = ranked.rn
FROM ranked
WHERE products.id = ranked.id;

-- Kategori + sıra bazlı composite index
CREATE INDEX IF NOT EXISTS idx_products_category_sort
  ON products(category_id, sort_order);
