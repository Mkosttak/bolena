-- =====================================================
-- 003_functions.sql
-- Bolena Cafe — Stored procedures ve trigger fonksiyonları
-- =====================================================

-- =====================================================
-- update_updated_at_column (idempotent — 001'de de var)
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

-- =====================================================
-- handle_new_user — auth.users'a yeni kullanıcı eklenince
-- profiles tablosuna otomatik kayıt oluşturur
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Trigger: yeni auth kullanıcısı → profiles kaydı
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- decrement_stock — atomik stok düşürme (race condition korumalı)
-- =====================================================
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  -- FOR UPDATE ile satırı kilitle ve bekle (race condition koruması)
  -- SKIP LOCKED kullanma: kilitlenen satır atlanır, stok varken "bulunamadı" hatası verir
  SELECT stock_count INTO v_stock
  FROM products
  WHERE id = p_product_id
    AND track_stock = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found or stock tracking disabled', p_product_id;
  END IF;

  IF v_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for product %. Available: %, Requested: %',
      p_product_id, v_stock, p_quantity;
  END IF;

  UPDATE products
  SET
    stock_count  = stock_count - p_quantity,
    is_available = CASE WHEN stock_count - p_quantity <= 0 THEN false ELSE is_available END,
    updated_at   = now()
  WHERE id = p_product_id
    AND track_stock = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
