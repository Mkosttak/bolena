# Bolena Cafe — Veritabanı

**Kaynak:** Gerçek şema ve RLS → `supabase/migrations/` (sırayla uygula). TypeScript tipleri → `types/database.types.ts` + `types/index.ts`.

## Varlıklar (özet)

- **Kimlik:** `profiles` (auth.users FK), `module_permissions`
- **Menü:** `categories`, `products` (+ kampanya alanları, `sort_order`, stok), `product_ingredients`, `extra_groups`, `extra_options`, `product_extra_groups`, `menu_campaigns` (+ hedefleme kolonları)
- **Masa:** `table_categories`, `tables` (+ `qr_token`, `qr_enabled` vb. QR migration’larına bak)
- **Sipariş:** `orders` (`type`: table | reservation | takeaway | platform), `order_items` (snapshot isim/fiyat, `selected_extras` JSONB, `kds_status`, vb.), `payments`
- **Rezervasyon:** `reservations` (tip, tarih/saat, `order_id`, `table_id`)
- **Çalışma saati:** `working_hours`, `working_hours_exceptions`
- **Site:** `site_settings` (QR migration)

## Kritik kurallar

- Stok düşüşü: `decrement_stock`; iade/artış: `increment_stock` (migration’larda tanımlı).
- Ürün silinmez — `is_visible = false` (geçmiş sipariş FK).
- RLS: migration dosyaları; uygulama tarafında `requireModuleAccess()` ile modül guard.

## İndeks / performans

FK ve sık filtre kolonları için indeksler `012_missing_fk_indexes.sql` ve ilgili migration’larda. Yeni tabloda sorgu paterni netleşince indeks ekle.
