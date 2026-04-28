-- =====================================================
-- 012_missing_fk_indexes.sql
-- Bolena Cafe - Eksik FK index'leri
-- Supabase performance advisor tarafından tespit edildi
-- =====================================================

-- extra_options.group_id → extra_groups
CREATE INDEX IF NOT EXISTS idx_extra_options_group_id
  ON public.extra_options(group_id);

-- order_items.product_id → products
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON public.order_items(product_id);

-- payments.order_id → orders
CREATE INDEX IF NOT EXISTS idx_payments_order_id
  ON public.payments(order_id);

-- product_ingredients.product_id → products
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product_id
  ON public.product_ingredients(product_id);

-- reservations.order_id → orders
CREATE INDEX IF NOT EXISTS idx_reservations_order_id
  ON public.reservations(order_id);

-- reservations.table_id → tables
CREATE INDEX IF NOT EXISTS idx_reservations_table_id
  ON public.reservations(table_id);

-- tables.category_id → table_categories
CREATE INDEX IF NOT EXISTS idx_tables_category_id
  ON public.tables(category_id);
