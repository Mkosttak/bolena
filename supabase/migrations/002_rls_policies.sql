-- =====================================================
-- 002_rls_policies.sql
-- Bolena Cafe — Row Level Security politikaları
-- =====================================================

-- =====================================================
-- Yardımcı: Mevcut kullanıcının rolünü döndürür
-- =====================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- =====================================================
-- profiles
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (get_my_role() = 'admin');

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- =====================================================
-- module_permissions
-- =====================================================
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "module_permissions_admin_all" ON module_permissions;
CREATE POLICY "module_permissions_admin_all" ON module_permissions
  FOR ALL USING (get_my_role() = 'admin');

DROP POLICY IF EXISTS "module_permissions_employee_select_own" ON module_permissions;
CREATE POLICY "module_permissions_employee_select_own" ON module_permissions
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- categories
-- =====================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_authenticated_select" ON categories;
CREATE POLICY "categories_authenticated_select" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "categories_admin_write" ON categories;
CREATE POLICY "categories_admin_write" ON categories
  FOR ALL USING (get_my_role() = 'admin');

-- =====================================================
-- products
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_authenticated_select" ON products;
CREATE POLICY "products_authenticated_select" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "products_admin_write" ON products;
CREATE POLICY "products_admin_write" ON products
  FOR ALL USING (get_my_role() = 'admin');

-- =====================================================
-- product_ingredients
-- =====================================================
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_ingredients_authenticated_select" ON product_ingredients;
CREATE POLICY "product_ingredients_authenticated_select" ON product_ingredients
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "product_ingredients_admin_write" ON product_ingredients;
CREATE POLICY "product_ingredients_admin_write" ON product_ingredients
  FOR ALL USING (get_my_role() = 'admin');

-- =====================================================
-- extra_groups
-- =====================================================
ALTER TABLE extra_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extra_groups_authenticated_select" ON extra_groups;
CREATE POLICY "extra_groups_authenticated_select" ON extra_groups
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "extra_groups_admin_write" ON extra_groups;
CREATE POLICY "extra_groups_admin_write" ON extra_groups
  FOR ALL USING (get_my_role() = 'admin');

-- =====================================================
-- extra_options
-- =====================================================
ALTER TABLE extra_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "extra_options_authenticated_select" ON extra_options;
CREATE POLICY "extra_options_authenticated_select" ON extra_options
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "extra_options_admin_write" ON extra_options;
CREATE POLICY "extra_options_admin_write" ON extra_options
  FOR ALL USING (get_my_role() = 'admin');

-- =====================================================
-- product_extra_groups
-- =====================================================
ALTER TABLE product_extra_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_extra_groups_authenticated_select" ON product_extra_groups;
CREATE POLICY "product_extra_groups_authenticated_select" ON product_extra_groups
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "product_extra_groups_admin_write" ON product_extra_groups;
CREATE POLICY "product_extra_groups_admin_write" ON product_extra_groups
  FOR ALL USING (get_my_role() = 'admin');

-- =====================================================
-- table_categories
-- =====================================================
ALTER TABLE table_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "table_categories_authenticated_select" ON table_categories;
CREATE POLICY "table_categories_authenticated_select" ON table_categories
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "table_categories_admin_write" ON table_categories;
CREATE POLICY "table_categories_admin_write" ON table_categories
  FOR ALL USING (get_my_role() = 'admin');

-- =====================================================
-- tables
-- =====================================================
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tables_authenticated_select" ON tables;
CREATE POLICY "tables_authenticated_select" ON tables
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tables_admin_write" ON tables;
CREATE POLICY "tables_admin_write" ON tables
  FOR ALL USING (get_my_role() = 'admin');

-- =====================================================
-- orders
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orders_authenticated_all" ON orders;
CREATE POLICY "orders_authenticated_all" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- order_items
-- =====================================================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order_items_authenticated_all" ON order_items;
CREATE POLICY "order_items_authenticated_all" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- payments
-- =====================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_authenticated_all" ON payments;
CREATE POLICY "payments_authenticated_all" ON payments
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- reservations
-- =====================================================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reservations_authenticated_all" ON reservations;
CREATE POLICY "reservations_authenticated_all" ON reservations
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- working_hours — herkes okur, admin yazar
-- =====================================================
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "working_hours_public_select" ON working_hours;
CREATE POLICY "working_hours_public_select" ON working_hours
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "working_hours_admin_write" ON working_hours;
CREATE POLICY "working_hours_admin_write" ON working_hours
  FOR ALL USING (get_my_role() = 'admin');

-- =====================================================
-- working_hours_exceptions — herkes okur, admin yazar
-- =====================================================
ALTER TABLE working_hours_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "working_hours_exceptions_public_select" ON working_hours_exceptions;
CREATE POLICY "working_hours_exceptions_public_select" ON working_hours_exceptions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "working_hours_exceptions_admin_write" ON working_hours_exceptions;
CREATE POLICY "working_hours_exceptions_admin_write" ON working_hours_exceptions
  FOR ALL USING (get_my_role() = 'admin');
