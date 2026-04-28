-- =====================================================
-- 010_atomic_operations_and_constraints.sql
-- Bolena Cafe - Atomic operasyonlar + tek aktif masa siparisi + extra_groups uyumu
-- =====================================================

-- Tek masada tek aktif siparis garantisi
DROP INDEX IF EXISTS idx_orders_table_status;
CREATE UNIQUE INDEX IF NOT EXISTS uq_orders_active_table
  ON orders(table_id)
  WHERE status = 'active' AND table_id IS NOT NULL;

-- extra_groups.product_id drift duzeltmesi (backward-compatible)
ALTER TABLE extra_groups
  ADD COLUMN IF NOT EXISTS product_id UUID;

UPDATE extra_groups eg
SET product_id = peg.product_id
FROM (
  SELECT DISTINCT ON (extra_group_id) extra_group_id, product_id
  FROM product_extra_groups
  ORDER BY extra_group_id, sort_order
) AS peg
WHERE eg.id = peg.extra_group_id
  AND eg.product_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM extra_groups WHERE product_id IS NULL) THEN
    RAISE EXCEPTION 'extra_groups.product_id could not be backfilled for all rows';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'extra_groups_product_id_fkey'
  ) THEN
    ALTER TABLE extra_groups
      ADD CONSTRAINT extra_groups_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE extra_groups
  ALTER COLUMN product_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_extra_groups_product
  ON extra_groups(product_id);

-- Order toplamlari (subtotal/discount/total) tek yerden hesaplama
CREATE OR REPLACE FUNCTION recalculate_order_totals(p_order_id UUID)
RETURNS void AS $$
DECLARE
  v_subtotal NUMERIC(10,2) := 0;
  v_discount_amount NUMERIC(10,2) := 0;
  v_discount_type TEXT := NULL;
  v_total NUMERIC(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(total_price), 0)
    INTO v_subtotal
  FROM order_items
  WHERE order_id = p_order_id
    AND is_complimentary = false;

  SELECT COALESCE(discount_amount, 0), discount_type
    INTO v_discount_amount, v_discount_type
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_discount_type IS NULL OR v_discount_amount <= 0 THEN
    v_total := v_subtotal;
  ELSIF v_discount_type = 'amount' THEN
    v_total := GREATEST(0, v_subtotal - v_discount_amount);
  ELSE
    v_total := v_subtotal * (1 - LEAST(100, v_discount_amount) / 100);
  END IF;

  UPDATE orders
  SET subtotal = v_subtotal,
      total_amount = v_total
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Siparise urun ekleme (stok + item + toplam) atomik
CREATE OR REPLACE FUNCTION add_order_item_atomic(
  p_order_id UUID,
  p_product_id UUID,
  p_product_name_tr TEXT,
  p_product_name_en TEXT,
  p_unit_price NUMERIC(10,2),
  p_quantity INTEGER,
  p_notes TEXT,
  p_removed_ingredients JSONB,
  p_selected_extras JSONB,
  p_total_price NUMERIC(10,2),
  p_track_stock BOOLEAN
)
RETURNS void AS $$
BEGIN
  IF p_track_stock AND p_product_id IS NOT NULL THEN
    PERFORM decrement_stock(p_product_id, p_quantity);
  END IF;

  INSERT INTO order_items (
    order_id, product_id, product_name_tr, product_name_en,
    unit_price, quantity, notes, removed_ingredients, selected_extras,
    total_price, is_complimentary
  ) VALUES (
    p_order_id, p_product_id, p_product_name_tr, p_product_name_en,
    p_unit_price, p_quantity, p_notes, COALESCE(p_removed_ingredients, '[]'::jsonb),
    COALESCE(p_selected_extras, '[]'::jsonb), p_total_price, false
  );

  PERFORM recalculate_order_totals(p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Siparis kalemi silme (quantity=0, stok iade, toplam) atomik
CREATE OR REPLACE FUNCTION remove_order_item_atomic(
  p_item_id UUID,
  p_order_id UUID
)
RETURNS void AS $$
DECLARE
  v_quantity INTEGER;
  v_product_id UUID;
BEGIN
  SELECT quantity, product_id
    INTO v_quantity, v_product_id
  FROM order_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item % not found', p_item_id;
  END IF;

  IF v_quantity > 0 THEN
    UPDATE order_items
    SET quantity = 0, total_price = 0
    WHERE id = p_item_id;

    IF v_product_id IS NOT NULL THEN
      PERFORM increment_stock(v_product_id, v_quantity);
    END IF;
  END IF;

  PERFORM recalculate_order_totals(p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Siparis kalemi detayli guncelleme atomik
CREATE OR REPLACE FUNCTION update_order_item_atomic(
  p_item_id UUID,
  p_order_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_notes TEXT,
  p_removed_ingredients JSONB,
  p_selected_extras JSONB,
  p_total_price NUMERIC(10,2),
  p_track_stock BOOLEAN
)
RETURNS void AS $$
DECLARE
  v_old_quantity INTEGER;
  v_qty_diff INTEGER;
BEGIN
  SELECT quantity
    INTO v_old_quantity
  FROM order_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item % not found', p_item_id;
  END IF;

  UPDATE order_items
  SET quantity = p_quantity,
      notes = p_notes,
      removed_ingredients = COALESCE(p_removed_ingredients, '[]'::jsonb),
      selected_extras = COALESCE(p_selected_extras, '[]'::jsonb),
      total_price = p_total_price
  WHERE id = p_item_id;

  IF p_track_stock AND p_product_id IS NOT NULL THEN
    v_qty_diff := p_quantity - v_old_quantity;
    IF v_qty_diff > 0 THEN
      PERFORM decrement_stock(p_product_id, v_qty_diff);
    ELSIF v_qty_diff < 0 THEN
      PERFORM increment_stock(p_product_id, -v_qty_diff);
    END IF;
  END IF;

  PERFORM recalculate_order_totals(p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Siparis kalemi adet guncelleme atomik
CREATE OR REPLACE FUNCTION update_order_item_quantity_atomic(
  p_item_id UUID,
  p_order_id UUID,
  p_product_id UUID,
  p_new_quantity INTEGER,
  p_track_stock BOOLEAN
)
RETURNS void AS $$
DECLARE
  v_unit_price NUMERIC(10,2);
  v_selected_extras JSONB;
  v_old_quantity INTEGER;
  v_extras_total NUMERIC(10,2) := 0;
  v_qty_diff INTEGER := 0;
BEGIN
  IF p_new_quantity <= 0 THEN
    PERFORM remove_order_item_atomic(p_item_id, p_order_id);
    RETURN;
  END IF;

  SELECT unit_price, selected_extras, quantity
    INTO v_unit_price, v_selected_extras, v_old_quantity
  FROM order_items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order item % not found', p_item_id;
  END IF;

  SELECT COALESCE(SUM((elem->>'price')::NUMERIC), 0)
    INTO v_extras_total
  FROM jsonb_array_elements(COALESCE(v_selected_extras, '[]'::jsonb)) AS elem;

  UPDATE order_items
  SET quantity = p_new_quantity,
      total_price = (v_unit_price + v_extras_total) * p_new_quantity
  WHERE id = p_item_id;

  IF p_track_stock AND p_product_id IS NOT NULL THEN
    v_qty_diff := p_new_quantity - v_old_quantity;
    IF v_qty_diff > 0 THEN
      PERFORM decrement_stock(p_product_id, v_qty_diff);
    ELSIF v_qty_diff < 0 THEN
      PERFORM increment_stock(p_product_id, -v_qty_diff);
    END IF;
  END IF;

  PERFORM recalculate_order_totals(p_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Rezervasyon + siparis olusturma atomik
CREATE OR REPLACE FUNCTION create_reservation_with_order_atomic(
  p_type TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_notes TEXT,
  p_reservation_date DATE,
  p_reservation_time TIME,
  p_party_size INTEGER
)
RETURNS TABLE(order_id UUID, reservation_id UUID) AS $$
DECLARE
  v_order_id UUID;
  v_reservation_id UUID;
BEGIN
  INSERT INTO orders (
    type, customer_name, customer_phone, notes, status,
    subtotal, discount_amount, total_amount, payment_status
  )
  VALUES (
    p_type, p_customer_name, p_customer_phone, p_notes, 'active',
    0, 0, 0, 'pending'
  )
  RETURNING id INTO v_order_id;

  INSERT INTO reservations (
    type, customer_name, customer_phone, reservation_date, reservation_time,
    party_size, notes, status, order_id
  )
  VALUES (
    p_type, p_customer_name, p_customer_phone, p_reservation_date, p_reservation_time,
    p_party_size, p_notes, 'pending', v_order_id
  )
  RETURNING id INTO v_reservation_id;

  RETURN QUERY SELECT v_order_id, v_reservation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Masa siparisi olustur/bul atomik
CREATE OR REPLACE FUNCTION get_or_create_table_order_atomic(
  p_table_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
BEGIN
  SELECT id
    INTO v_order_id
  FROM orders
  WHERE table_id = p_table_id
    AND status = 'active'
  LIMIT 1;

  IF v_order_id IS NOT NULL THEN
    RETURN v_order_id;
  END IF;

  INSERT INTO orders (
    type, table_id, status, subtotal, discount_amount, total_amount, payment_status
  )
  VALUES (
    'table', p_table_id, 'active', 0, 0, 0, 'pending'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_order_id;

  IF v_order_id IS NULL THEN
    SELECT id
      INTO v_order_id
    FROM orders
    WHERE table_id = p_table_id
      AND status = 'active'
    LIMIT 1;
  END IF;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Masa transfer / birlestirme atomik
CREATE OR REPLACE FUNCTION transfer_table_order_atomic(
  p_source_table_id UUID,
  p_target_table_id UUID
)
RETURNS void AS $$
DECLARE
  v_source_order_id UUID;
  v_target_order_id UUID;
  v_total_paid NUMERIC(10,2) := 0;
  v_total_amount NUMERIC(10,2) := 0;
BEGIN
  SELECT id
    INTO v_source_order_id
  FROM orders
  WHERE table_id = p_source_table_id
    AND status = 'active'
  FOR UPDATE;

  IF v_source_order_id IS NULL THEN
    RAISE EXCEPTION 'No active order found on source table';
  END IF;

  SELECT id
    INTO v_target_order_id
  FROM orders
  WHERE table_id = p_target_table_id
    AND status = 'active'
  FOR UPDATE;

  IF v_target_order_id IS NULL THEN
    UPDATE orders
    SET table_id = p_target_table_id
    WHERE id = v_source_order_id;
    RETURN;
  END IF;

  UPDATE order_items
  SET order_id = v_target_order_id
  WHERE order_id = v_source_order_id;

  UPDATE payments
  SET order_id = v_target_order_id
  WHERE order_id = v_source_order_id;

  DELETE FROM orders
  WHERE id = v_source_order_id;

  PERFORM recalculate_order_totals(v_target_order_id);

  SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
  FROM payments
  WHERE order_id = v_target_order_id;

  SELECT total_amount
    INTO v_total_amount
  FROM orders
  WHERE id = v_target_order_id;

  UPDATE orders
  SET payment_status = CASE
    WHEN v_total_paid >= v_total_amount - 0.01 THEN 'paid'
    WHEN v_total_paid > 0 THEN 'partial'
    ELSE 'pending'
  END
  WHERE id = v_target_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

