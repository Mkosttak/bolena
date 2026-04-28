-- =====================================================
-- 001_initial_schema.sql
-- Bolena Cafe — Temel veritabanı şeması
-- =====================================================

-- updated_at otomatik güncelleme trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. Kullanıcı Yönetimi
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS module_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_access  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_name)
);

-- =====================================================
-- 2. Menü Sistemi
-- =====================================================

CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tr    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name_tr             TEXT NOT NULL,
  name_en             TEXT NOT NULL,
  description_tr      TEXT,
  description_en      TEXT,
  image_url           TEXT,
  price               NUMERIC(10,2) NOT NULL,
  campaign_price      NUMERIC(10,2),
  campaign_end_date   DATE,
  allergens_tr        TEXT,
  allergens_en        TEXT,
  is_available        BOOLEAN NOT NULL DEFAULT true,
  is_featured         BOOLEAN NOT NULL DEFAULT false,
  is_visible          BOOLEAN NOT NULL DEFAULT true,
  track_stock         BOOLEAN NOT NULL DEFAULT false,
  stock_count         INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS product_ingredients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_tr      TEXT NOT NULL,
  name_en      TEXT NOT NULL,
  is_removable BOOLEAN NOT NULL DEFAULT false,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- =====================================================
-- 3. Ekstralar Sistemi
-- =====================================================

CREATE TABLE IF NOT EXISTS extra_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tr     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_extra_groups_updated_at ON extra_groups;
CREATE TRIGGER trg_extra_groups_updated_at
  BEFORE UPDATE ON extra_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS extra_options (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES extra_groups(id) ON DELETE CASCADE,
  name_tr        TEXT NOT NULL,
  name_en        TEXT NOT NULL,
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_selections INTEGER NOT NULL DEFAULT 1,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_extra_groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  extra_group_id UUID NOT NULL REFERENCES extra_groups(id) ON DELETE CASCADE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, extra_group_id)
);

-- =====================================================
-- 4. Masa Sistemi
-- =====================================================

CREATE TABLE IF NOT EXISTS table_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category_id UUID REFERENCES table_categories(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_tables_updated_at ON tables;
CREATE TRIGGER trg_tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Sipariş Motoru
-- =====================================================

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT NOT NULL CHECK (type IN ('table','reservation','takeaway','platform')),
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled','no_show')),
  table_id         UUID REFERENCES tables(id) ON DELETE SET NULL,
  customer_name    TEXT,
  customer_phone   TEXT,
  customer_address TEXT,
  platform         TEXT CHECK (platform IN ('yemeksepeti','getir','trendyol','courier')),
  notes            TEXT,
  subtotal         NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_type    TEXT CHECK (discount_type IN ('amount','percent')),
  total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status   TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','partial','paid')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS order_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id           UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_tr      TEXT NOT NULL,
  product_name_en      TEXT NOT NULL,
  unit_price           NUMERIC(10,2) NOT NULL,
  quantity             INTEGER NOT NULL DEFAULT 1,
  notes                TEXT,
  removed_ingredients  JSONB DEFAULT '[]',
  selected_extras      JSONB DEFAULT '[]',
  total_price          NUMERIC(10,2) NOT NULL,
  is_complimentary     BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount     NUMERIC(10,2) NOT NULL,
  method     TEXT NOT NULL CHECK (method IN ('cash','card','platform')),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- 6. Rezervasyon & Gel-Al
-- =====================================================

CREATE TABLE IF NOT EXISTS reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT NOT NULL CHECK (type IN ('reservation','takeaway')),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  reservation_date DATE,
  reservation_time TIME,
  party_size       INTEGER,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','seated','completed','cancelled','no_show')),
  order_id         UUID REFERENCES orders(id) ON DELETE SET NULL,
  table_id         UUID REFERENCES tables(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_reservations_updated_at ON reservations;
CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. Çalışma Saatleri
-- =====================================================

CREATE TABLE IF NOT EXISTS working_hours (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6) UNIQUE,
  is_open      BOOLEAN NOT NULL DEFAULT true,
  open_time    TIME,
  close_time   TIME,
  note_tr      TEXT,
  note_en      TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS working_hours_exceptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL UNIQUE,
  is_open         BOOLEAN NOT NULL,
  open_time       TIME,
  close_time      TIME,
  description_tr  TEXT,
  description_en  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- İndeksler
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available) WHERE track_stock = true;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date, status);
CREATE INDEX IF NOT EXISTS idx_working_hours_exceptions_date ON working_hours_exceptions(date);

-- =====================================================
-- Başlangıç Verisi: Çalışma Saatleri (7 gün)
-- =====================================================

INSERT INTO working_hours (day_of_week, is_open, open_time, close_time)
VALUES
  (0, true, '09:00', '22:00'),  -- Pazar
  (1, true, '09:00', '22:00'),  -- Pazartesi
  (2, true, '09:00', '22:00'),  -- Salı
  (3, true, '09:00', '22:00'),  -- Çarşamba
  (4, true, '09:00', '22:00'),  -- Perşembe
  (5, true, '09:00', '22:00'),  -- Cuma
  (6, true, '09:00', '22:00')   -- Cumartesi
ON CONFLICT (day_of_week) DO NOTHING;
