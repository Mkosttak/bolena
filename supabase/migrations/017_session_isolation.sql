-- =====================================================
-- 017_session_isolation.sql
-- Bolena Cafe — QR oturum izolasyonu
-- Her masa ziyareti için benzersiz session_token
-- =====================================================

-- ── 1. orders tablosuna session_token kolonu ekle
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS session_token UUID DEFAULT NULL;

-- Unique partial index — sadece NULL olmayan tokenler için
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_session_token
  ON orders(session_token)
  WHERE session_token IS NOT NULL;

-- ── 2. get_or_create_session_for_table
-- QR giriş sayfası bu RPC'yi çağırır.
-- Mevcut aktif siparişi varsa session_token döndürür;
-- yoksa yeni sipariş + yeni session_token oluşturur.
-- Admin'in NULL session_token'lı siparişi varsa bunu devralır.
CREATE OR REPLACE FUNCTION get_or_create_session_for_table(p_qr_token UUID)
RETURNS TABLE(order_id UUID, session_token UUID) AS $$
DECLARE
  v_table_id        UUID;
  v_order_id        UUID;
  v_session_token   UUID;
BEGIN
  -- QR token → table_id (aktif + qr_enabled olmalı)
  SELECT id INTO v_table_id
  FROM tables
  WHERE qr_token = p_qr_token
    AND is_active = true
    AND qr_enabled = true;

  IF v_table_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or disabled QR token';
  END IF;

  -- Mevcut aktif siparişi kilitle (race condition koruması)
  SELECT o.id, o.session_token
    INTO v_order_id, v_session_token
  FROM orders o
  WHERE o.table_id = v_table_id
    AND o.status = 'active'
  LIMIT 1
  FOR UPDATE;

  IF v_order_id IS NOT NULL THEN
    -- Admin'in session_token=NULL siparişini devral
    IF v_session_token IS NULL THEN
      v_session_token := gen_random_uuid();
      UPDATE orders
        SET session_token = v_session_token
      WHERE id = v_order_id;
    END IF;

    RETURN QUERY SELECT v_order_id, v_session_token;
    RETURN;
  END IF;

  -- Aktif sipariş yok → yeni oluştur
  v_session_token := gen_random_uuid();

  INSERT INTO orders (
    table_id,
    type,
    status,
    payment_status,
    session_token
  )
  VALUES (
    v_table_id,
    'table',
    'active',
    'pending',
    v_session_token
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_order_id;

  -- Eş zamanlı iki tarama: INSERT başarısız olduysa mevcut kaydı getir
  IF v_order_id IS NULL THEN
    SELECT o.id, o.session_token
      INTO v_order_id, v_session_token
    FROM orders o
    WHERE o.table_id = v_table_id
      AND o.status = 'active'
    LIMIT 1;

    -- Devralınacak siparişte session_token hâlâ NULL olabilir
    IF v_session_token IS NULL THEN
      v_session_token := gen_random_uuid();
      UPDATE orders
        SET session_token = v_session_token
      WHERE id = v_order_id;
    END IF;
  END IF;

  RETURN QUERY SELECT v_order_id, v_session_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ── 3. get_order_by_session_token
-- Oturum sayfası başlangıcında ve server action'da kullanılır.
-- Hem active hem tamamlanmış siparişler için satır döndürür;
-- çağıran taraf durumu yorumlar (expired ekranı vs. normal ekran).
CREATE OR REPLACE FUNCTION get_order_by_session_token(p_session_token UUID)
RETURNS TABLE(
  order_id     UUID,
  table_id     UUID,
  table_name   TEXT,
  qr_token     UUID,
  order_status TEXT,
  qr_enabled   BOOLEAN
) AS $$
  SELECT
    o.id          AS order_id,
    t.id          AS table_id,
    t.name        AS table_name,
    t.qr_token    AS qr_token,
    o.status      AS order_status,
    t.qr_enabled  AS qr_enabled
  FROM orders o
  JOIN tables t ON t.id = o.table_id
  WHERE o.session_token = p_session_token
    AND t.is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- ── 4. add_order_item_via_qr — session_token doğrulaması eklendi
-- 014'teki 12-parametreli eski imzayı düşür; yeni imza session_token içerir.
DROP FUNCTION IF EXISTS add_order_item_via_qr(
  UUID, UUID,
  UUID, TEXT, TEXT,
  NUMERIC, INTEGER, TEXT, JSONB, JSONB, NUMERIC, BOOLEAN
);
CREATE OR REPLACE FUNCTION add_order_item_via_qr(
  p_qr_token            UUID,
  p_order_id            UUID,
  p_session_token       UUID,
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

  -- Order bu token'a ait masaya ve bu oturuma mı ait?
  IF NOT EXISTS (
    SELECT 1 FROM orders o
    JOIN tables t ON t.id = o.table_id
    WHERE o.id = p_order_id
      AND t.qr_token = p_qr_token
      AND o.status = 'active'
      AND o.session_token = p_session_token
  ) THEN
    RAISE EXCEPTION 'Order does not belong to this QR session';
  END IF;

  PERFORM add_order_item_atomic(
    p_order_id, p_product_id, p_product_name_tr, p_product_name_en,
    p_unit_price, p_quantity, p_notes, p_removed_ingredients,
    p_selected_extras, p_total_price, p_track_stock
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
