-- =====================================================
-- 014_qr_rls_policies.sql
-- Bolena Cafe — Anonim QR sipariş için RLS politikaları
-- ve SECURITY DEFINER RPC'ler
-- =====================================================

-- ── Helper: verilen qr_token geçerli ve aktif mi?
CREATE OR REPLACE FUNCTION is_valid_qr_token(p_token UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tables
    WHERE qr_token = p_token
      AND is_active = true
      AND qr_enabled = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- ── site_settings RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings_public_select" ON site_settings;
CREATE POLICY "site_settings_public_select" ON site_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "site_settings_admin_write" ON site_settings;
CREATE POLICY "site_settings_admin_write" ON site_settings
  FOR ALL USING (get_my_role() = 'admin');

-- ── tables: anon SELECT (sadece aktif + qr_enabled olanlar)
DROP POLICY IF EXISTS "tables_anon_select_by_qr" ON tables;
CREATE POLICY "tables_anon_select_by_qr" ON tables
  FOR SELECT USING (
    auth.role() = 'anon'
    AND is_active = true
    AND qr_enabled = true
  );

-- ── categories: anon SELECT
DROP POLICY IF EXISTS "categories_anon_select" ON categories;
CREATE POLICY "categories_anon_select" ON categories
  FOR SELECT USING (
    auth.role() = 'anon'
    AND is_active = true
  );

-- ── products: anon SELECT
DROP POLICY IF EXISTS "products_anon_select" ON products;
CREATE POLICY "products_anon_select" ON products
  FOR SELECT USING (
    auth.role() = 'anon'
    AND is_visible = true
  );

-- ── product_ingredients: anon SELECT
DROP POLICY IF EXISTS "product_ingredients_anon_select" ON product_ingredients;
CREATE POLICY "product_ingredients_anon_select" ON product_ingredients
  FOR SELECT USING (auth.role() = 'anon');

-- ── extra_groups: anon SELECT
DROP POLICY IF EXISTS "extra_groups_anon_select" ON extra_groups;
CREATE POLICY "extra_groups_anon_select" ON extra_groups
  FOR SELECT USING (auth.role() = 'anon');

-- ── extra_options: anon SELECT
DROP POLICY IF EXISTS "extra_options_anon_select" ON extra_options;
CREATE POLICY "extra_options_anon_select" ON extra_options
  FOR SELECT USING (auth.role() = 'anon');

-- ── product_extra_groups: anon SELECT
DROP POLICY IF EXISTS "product_extra_groups_anon_select" ON product_extra_groups;
CREATE POLICY "product_extra_groups_anon_select" ON product_extra_groups
  FOR SELECT USING (auth.role() = 'anon');

-- ── orders: anon SELECT (qr_enabled masaların aktif siparişleri)
DROP POLICY IF EXISTS "orders_anon_select_via_qr" ON orders;
CREATE POLICY "orders_anon_select_via_qr" ON orders
  FOR SELECT USING (
    auth.role() = 'anon'
    AND type = 'table'
    AND status = 'active'
    AND table_id IN (
      SELECT id FROM tables WHERE is_active = true AND qr_enabled = true
    )
  );

-- ── order_items: anon SELECT
DROP POLICY IF EXISTS "order_items_anon_select_via_qr" ON order_items;
CREATE POLICY "order_items_anon_select_via_qr" ON order_items
  FOR SELECT USING (
    auth.role() = 'anon'
    AND order_id IN (
      SELECT o.id FROM orders o
      JOIN tables t ON t.id = o.table_id
      WHERE o.status = 'active'
        AND t.is_active = true
        AND t.qr_enabled = true
    )
  );

-- ── payments: anon SELECT (hesap görüntüleme)
DROP POLICY IF EXISTS "payments_anon_select_via_qr" ON payments;
CREATE POLICY "payments_anon_select_via_qr" ON payments
  FOR SELECT USING (
    auth.role() = 'anon'
    AND order_id IN (
      SELECT o.id FROM orders o
      JOIN tables t ON t.id = o.table_id
      WHERE o.status = 'active'
        AND t.is_active = true
        AND t.qr_enabled = true
    )
  );

-- ── menu_campaigns: anon SELECT (kampanya fiyatları için)
DROP POLICY IF EXISTS "menu_campaigns_anon_select" ON menu_campaigns;
CREATE POLICY "menu_campaigns_anon_select" ON menu_campaigns
  FOR SELECT USING (
    auth.role() = 'anon'
    AND is_active = true
  );

-- ======================================================
-- SECURITY DEFINER RPC'ler — anon kullanıcılar bu
-- fonksiyonları çağırır; fonksiyonlar içinde doğrulama
-- yapılır ve yetkili işlemler gerçekleştirilir.
-- ======================================================

-- Masa bilgisini qr_token'dan döndür
CREATE OR REPLACE FUNCTION get_table_by_qr_token(p_qr_token UUID)
RETURNS TABLE(id UUID, name TEXT, qr_enabled BOOLEAN) AS $$
  SELECT t.id, t.name, t.qr_enabled
  FROM tables t
  WHERE t.qr_token = p_qr_token
    AND t.is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- QR token ile sipariş oluştur/bul
CREATE OR REPLACE FUNCTION get_or_create_table_order_by_qr(p_qr_token UUID)
RETURNS UUID AS $$
DECLARE
  v_table_id UUID;
BEGIN
  SELECT id INTO v_table_id
  FROM tables
  WHERE qr_token = p_qr_token
    AND is_active = true
    AND qr_enabled = true;

  IF v_table_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or disabled QR token';
  END IF;

  RETURN get_or_create_table_order_atomic(v_table_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- QR üzerinden sipariş kalemi ekleme
CREATE OR REPLACE FUNCTION add_order_item_via_qr(
  p_qr_token            UUID,
  p_order_id            UUID,
  p_product_id          UUID,
  p_product_name_tr     TEXT,
  p_product_name_en     TEXT,
  p_unit_price          NUMERIC(10,2),
  p_quantity            INTEGER,
  p_notes               TEXT,
  p_removed_ingredients JSONB,
  p_selected_extras     JSONB,
  p_total_price         NUMERIC(10,2),
  p_track_stock         BOOLEAN
)
RETURNS void AS $$
BEGIN
  -- QR token geçerli mi?
  IF NOT is_valid_qr_token(p_qr_token) THEN
    RAISE EXCEPTION 'Invalid or disabled QR token';
  END IF;

  -- Order bu token'a ait masaya mı ait?
  IF NOT EXISTS (
    SELECT 1 FROM orders o
    JOIN tables t ON t.id = o.table_id
    WHERE o.id = p_order_id
      AND t.qr_token = p_qr_token
      AND o.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Order does not belong to this QR table';
  END IF;

  PERFORM add_order_item_atomic(
    p_order_id, p_product_id, p_product_name_tr, p_product_name_en,
    p_unit_price, p_quantity, p_notes, p_removed_ingredients,
    p_selected_extras, p_total_price, p_track_stock
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- QR token'ı yenile (admin server action tarafından çağrılır)
CREATE OR REPLACE FUNCTION regenerate_qr_token(p_table_id UUID)
RETURNS UUID AS $$
DECLARE
  v_new_token UUID := gen_random_uuid();
BEGIN
  UPDATE tables SET qr_token = v_new_token WHERE id = p_table_id;
  RETURN v_new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
