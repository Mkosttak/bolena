# Bolena Cafe — Veritabanı Şeması

PostgreSQL 17 (Supabase) — Tüm tablolar `public` schema'sında.

---

## 1. Kullanıcı Yönetimi

```sql
-- Supabase auth.users tablosunu genişletir
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Modül bazlı izinler (sadece employee için anlamlı, admin her şeye erişebilir)
CREATE TABLE module_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_access  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_name)
);
```

---

## 2. Menü Sistemi

```sql
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tr    TEXT NOT NULL,
  name_en    TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
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

-- Ürün içerikleri (çıkartılabilir olanlar sipariş sırasında kaldırılabilir)
CREATE TABLE product_ingredients (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name_tr      TEXT NOT NULL,
  name_en      TEXT NOT NULL,
  is_removable BOOLEAN NOT NULL DEFAULT false,
  sort_order   INTEGER NOT NULL DEFAULT 0
);
```

---

## 3. Ekstralar Sistemi

```sql
-- Ekstra grupları (örn: "Köfte Seçimi", "Şeker Tercihi")
CREATE TABLE extra_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tr     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grup içindeki seçenekler
CREATE TABLE extra_options (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES extra_groups(id) ON DELETE CASCADE,
  name_tr        TEXT NOT NULL,
  name_en        TEXT NOT NULL,
  price          NUMERIC(10,2) NOT NULL DEFAULT 0, -- 0 = ücretsiz
  max_selections INTEGER NOT NULL DEFAULT 1,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

-- Ürün ↔ Ekstra Grup ilişkisi
CREATE TABLE product_extra_groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  extra_group_id UUID NOT NULL REFERENCES extra_groups(id) ON DELETE CASCADE,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, extra_group_id)
);
```

---

## 4. Masa Sistemi

```sql
CREATE TABLE table_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE tables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  category_id UUID REFERENCES table_categories(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 5. Sipariş Motoru

```sql
CREATE TABLE orders (
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

CREATE TABLE order_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id           UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_tr      TEXT NOT NULL, -- snapshot (ürün silinse bile kalır)
  product_name_en      TEXT NOT NULL,
  unit_price           NUMERIC(10,2) NOT NULL,
  quantity             INTEGER NOT NULL DEFAULT 1,
  notes                TEXT,
  removed_ingredients  JSONB DEFAULT '[]', -- [{id, name_tr, name_en}]
  selected_extras      JSONB DEFAULT '[]', -- [{group_id, option_id, name_tr, price}]
  total_price          NUMERIC(10,2) NOT NULL,
  is_complimentary     BOOLEAN NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ödeme kayıtları (parçalı ödemeyi destekler)
CREATE TABLE payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount     NUMERIC(10,2) NOT NULL,
  method     TEXT NOT NULL CHECK (method IN ('cash','card','platform')),
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 6. Rezervasyon & Gel-Al

```sql
CREATE TABLE reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             TEXT NOT NULL CHECK (type IN ('reservation','takeaway')),
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  reservation_date DATE,         -- sadece 'reservation' için
  reservation_time TIME,         -- sadece 'reservation' için
  party_size       INTEGER,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','seated','completed','cancelled','no_show')),
  order_id         UUID REFERENCES orders(id) ON DELETE SET NULL,
  table_id         UUID REFERENCES tables(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 7. Çalışma Saatleri

```sql
-- Haftalık düzen (0=Pazar, 1=Pazartesi, ..., 6=Cumartesi)
CREATE TABLE working_hours (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6) UNIQUE,
  is_open      BOOLEAN NOT NULL DEFAULT true,
  open_time    TIME,
  close_time   TIME,
  note_tr      TEXT,
  note_en      TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Özel tarih istisnaları
CREATE TABLE working_hours_exceptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date            DATE NOT NULL UNIQUE,
  is_open         BOOLEAN NOT NULL,
  open_time       TIME,
  close_time      TIME,
  description_tr  TEXT,
  description_en  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## Önemli İndeksler

```sql
-- Performans için kritik indeksler
CREATE INDEX idx_products_category ON products(category_id) WHERE is_visible = true;
CREATE INDEX idx_products_available ON products(is_available) WHERE track_stock = true;
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX idx_orders_table ON orders(table_id) WHERE status = 'active';
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date, status);
CREATE INDEX idx_working_hours_exceptions_date ON working_hours_exceptions(date);
```

---

## Stok Takibi — Race Condition Koruması

Sipariş onaylandığında stok düşürme işlemi **Supabase RPC (stored procedure)** ile atomik yapılır:

```sql
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock_count = stock_count - p_quantity,
      is_available = CASE WHEN stock_count - p_quantity <= 0 THEN false ELSE is_available END
  WHERE id = p_product_id
    AND track_stock = true
    AND stock_count >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for product %', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## RLS Politikaları (Özet)

- `profiles`: Kullanıcı kendi profilini okuyabilir; admin hepsini okur/yazar
- `module_permissions`: Admin yönetir; employee kendi iznini okur
- `orders`, `order_items`, `payments`: Authenticated kullanıcılar okur/yazar; RLS ile role göre
- `products`, `categories`, `extra_groups`, `extra_options`: Authenticated okur; admin yazar
- `working_hours`, `working_hours_exceptions`: Herkes (public) okur; admin yazar

Detaylı RLS politikaları migration dosyalarında tanımlanır.
