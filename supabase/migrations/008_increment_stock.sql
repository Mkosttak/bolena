-- =====================================================
-- 008_increment_stock.sql
-- Bolena Cafe — Stok iadesi için ayrı RPC
-- =====================================================

-- increment_stock — stok iadesi (sipariş iptali / sepetten çıkarma)
-- decrement_stock'un negatif miktarla çağrılması güvensizdir:
-- negatif miktar, "v_stock < p_quantity" kontrolünü atlar.
-- Bu fonksiyon stok artırır ve is_available'ı restore eder.
CREATE OR REPLACE FUNCTION increment_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'increment_stock: p_quantity must be positive, got %', p_quantity;
  END IF;

  UPDATE products
  SET
    stock_count  = stock_count + p_quantity,
    is_available = CASE WHEN NOT is_available AND (stock_count + p_quantity) > 0 THEN true ELSE is_available END,
    updated_at   = now()
  WHERE id = p_product_id
    AND track_stock = true;
  -- track_stock=false ise satır bulunamaz → sessizce geçer (güvenli)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
