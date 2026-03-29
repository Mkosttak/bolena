# Bolena Cafe — Teknik Kararlar

> **YAPAY ZEKA TALİMATI:**
> Bu dosyadaki kararlar **kesinleşmiştir**. Yeniden tartışmayı açma,
> alternatif önermede bulunma. Bir karar yanlış görünüyorsa
> önce kullanıcıya sor, sonra bu dosyayı güncelle.

---

## Mimari Kararlar

### K-01: Tek Monorepo, Tek Next.js Uygulaması
**Karar:** Public site + Admin panel aynı Next.js uygulamasında, route groups ile ayrılır.
**Neden:** Tek deployment, ortak auth altyapısı, ortak bileşenler.
**Alternatif reddedildi:** Ayrı uygulamalar → fazla karmaşıklık, ortak state paylaşımı zorluğu.

---

### K-02: App Router (Next.js)
**Karar:** Pages Router değil, App Router kullanılır.
**Neden:** RSC desteği, daha iyi layout sistemi, Next.js 16 ile tam uyum.

---

### K-03: Tüm Sipariş Tipleri Tek Tabloda
**Karar:** `orders` tablosu `type` alanıyla: `table | reservation | takeaway | platform`
**Neden:** Ortak ödeme, ortak raporlama, ortak sipariş motoru. Ayrı tablolar = kod tekrarı.
**Sonuç:** `order_items`, `payments` tek tabloda, tüm tipler paylaşır.

---

### K-04: Stok Güncellemesi RPC ile
**Karar:** `decrement_stock()` PostgreSQL fonksiyonu, atomic update.
**Neden:** Race condition. Eş zamanlı iki sipariş aynı ürünü stoktan düşürürse negatife düşebilir.
**Kullanım:** `supabase.rpc('decrement_stock', { p_product_id: id, p_quantity: qty })`

---

### K-05: Realtime Sadece Sipariş Ekranlarında
**Karar:** Supabase Realtime yalnızca masa detayı, rezervasyon ve platform sipariş sayfalarında.
**Neden:** Her sayfada realtime → gereksiz WebSocket bağlantısı → performans kaybı.

---

### K-06: Supabase Auth (Harici Auth Yok)
**Karar:** Supabase Auth kullanılır. NextAuth, Clerk vb. kullanılmaz.
**Neden:** Supabase RLS Supabase Auth JWT'sine dayanır. Harici auth → RLS entegrasyonu karmaşıklaşır.

---

### K-07: Admin Panel Türkçe, Public Site Çift Dilli
**Karar:** Admin panel varsayılan TR'dir, dil değiştirici opsiyoneldir.
Public site tam TR + EN destekler.
**Neden:** Kafe çalışanları Türkçe kullanır; yabancı misafirler public siteyi görür.

---

### K-08: Fotoğraf Depolama Supabase Storage
**Karar:** Ürün fotoğrafları Supabase Storage'da `bolena-cafe` bucket'ında saklanır.
**Path:** `products/{product_id}/{timestamp}.{ext}`
**Limit:** 2MB, format: JPEG/WebP/PNG
**Neden:** CDN dahil, Next.js image optimization ile uyumlu, ayrı servis gerektirmez.

---

### K-09: Parçalı Ödeme Sadece Masa/Rezervasyon/Gel-Al
**Karar:** Platform siparişlerinde parçalı ödeme yoktur. Tek seferlik toplam tutar.
**Neden:** Platform siparişleri genellikle tek ödeyici (platform veya kurye). Karmaşıklık gereksiz.

---

### K-10: Çalışma Saati Kontrolü İstisna-Önce
**Karar:** `isOpen(date)` fonksiyonu önce `working_hours_exceptions`, sonra `working_hours` bakar.
**Neden:** Bayram, özel gün gibi istisnalar haftalık düzeni override eder.

---

### K-11: Ürün Silme Yerine Pasif Etme
**Karar:** Ürünler fiziksel olarak silinmez. `is_visible = false` yapılır.
**Neden:** Geçmiş siparişlerde ürün adı snapshot olarak tutulur, FK ihlali olmaz.
**Dikkat:** `order_items.product_id` → `ON DELETE SET NULL`, ama `product_name_tr/en` kalır.

---

### K-12: İzin Sistemi DB + Client
**Karar:** İzinler hem `module_permissions` tablosunda (DB) hem `auth.store.ts`'de (Zustand) tutulur.
**Neden:** Her navigasyonda DB sorgusu atmamak için cache. Login'de izinler store'a yüklenir.
**Güvenlik:** Client store sadece UI göstermek için. Gerçek güvenlik RLS'de.

---

## UI/UX Kararları

### K-13: Tasarım Şimdilik Minimal
**Karar:** shadcn/ui default stilleri. Özel renk/font/animasyon YOK.
**Neden:** Öncelik backend altyapısı. Tasarım ileride üstüne yazılacak.

---

### K-14: Masa Görünümü Card Grid
**Karar:** Masalar card (kutu) grid formatında, liste değil.
**Neden:** Fiziksel kafe düzenini simüle eder, görsel tarama daha hızlı.

---

### K-15: Dil Değiştirici URL Bazlı
**Karar:** `/tr/*` ve `/en/*` URL şeması. Cookie veya query param değil.
**Neden:** SEO uyumlu, server-side render'da locale bilinir, link paylaşımı çalışır.

---

## Veri Kararları

### K-16: Sipariş Kaleminde Anlık Snapshot
**Karar:** `order_items` tablosunda `product_name_tr`, `product_name_en`, `unit_price` saklanır.
**Neden:** Ürün fiyatı değişirse eski siparişler etkilenmez. Raporlama güvenilir kalır.

---

### K-17: Ekstralar JSONB
**Karar:** `order_items.selected_extras` ve `removed_ingredients` JSONB sütunlarında tutulur.
**Neden:** Her siparişin ekstra seçimi farklı, normalize etmek overkill. Raporda JSONB sorgulanabilir.

---

### K-18: Kampanya Fiyatı Client'ta Hesaplanır
**Karar:** Kampanya fiyatı gösterimi: `campaign_end_date >= today ? campaign_price : price`
**Bu hesap client/server component'ta yapılır**, ayrı bir DB kolonu yoktur.
