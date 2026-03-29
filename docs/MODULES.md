# Bolena Cafe — Modül Detayları

## Modül Durumu

| # | Modül | Durum | Öncelik |
|---|-------|-------|---------|
| 1 | Auth (Login/Logout) | ⬜ Bekliyor | Kritik |
| 2 | Kullanıcı Yönetimi | ⬜ Bekliyor | Kritik |
| 3 | Menü Yönetimi | ⬜ Bekliyor | Yüksek |
| 4 | Ekstralar Sistemi | ⬜ Bekliyor | Yüksek |
| 5 | Masa Sistemi | ⬜ Bekliyor | Yüksek |
| 6 | Rezervasyon & Gel-Al | ⬜ Bekliyor | Orta |
| 7 | Platform Siparişleri | ⬜ Bekliyor | Orta |
| 8 | Çalışma Saatleri | ⬜ Bekliyor | Orta |
| 9 | Public Tanıtım Sitesi | ⬜ Bekliyor | Düşük |
| 10 | Dashboard & Raporlama | ⬜ Bekliyor | İleride |

---

## 1. Auth Modülü

**Sayfalar:** `/[locale]/(admin)/login`

**Özellikler:**
- Email + şifre ile giriş (Supabase Auth)
- Oturum kalıcılığı (cookie-based)
- Şifre sıfırlama (email ile)
- Çıkış yapma

**Teknik:**
- `supabase.auth.signInWithPassword()`
- `middleware.ts` ile session koruması
- `auth.store.ts` — profil + izinleri Zustand'da tut

---

## 2. Kullanıcı Yönetimi

**Sayfalar:** `/[locale]/(admin)/users`

**Özellikler:**
- Kullanıcı listesi (tablo görünümü)
- Yeni kullanıcı ekle (admin Supabase Admin API ile oluşturur)
- Rol atama (admin / employee)
- Modül bazlı izin yönetimi (checkbox matrisi)
- Kullanıcıyı pasif et / aktif et
- Şifre sıfırlama emaili gönder

**İzin:**
- Sadece **admin** erişebilir

**Teknik:**
- `supabase.auth.admin.createUser()` — service role ile (server action)
- `module_permissions` tablosunda izinler saklanır
- İzin güncelleme: upsert işlemi

---

## 3. Menü Yönetimi

**Sayfalar:** `/[locale]/(admin)/menu`

**Özellikler:**

### Kategori Yönetimi (Modal/Drawer)
- Mevcut kategorileri listele + sıralama (drag veya order input)
- Kategori ekle/düzenle (TR + EN isim, sıralama)
- Kategori sil (ürün varsa uyar)

### Ürün Listesi
- Kategoriye göre filtrelenmiş tablo
- Kolonlar: görsel, isim, fiyat, kampanya, stok durumu, görünürlük, işlemler
- Inline toggle: is_available, is_visible, is_featured

### Ürün Ekleme/Düzenleme (Tam Sayfa Form)
- Kategori seçimi
- Ad (TR + EN), Açıklama (TR + EN)
- Fotoğraf yükleme (Supabase Storage)
- Satış fiyatı, kampanya fiyatı, kampanya bitiş tarihi
- Alerjen bilgisi (TR + EN)
- İçindekiler listesi (ekle/sil, her öğe: isim TR/EN, çıkartılabilir mi toggle)
- Ayarlar: satışta mı, öne çıkar, menüde gözüksün, stok takibi + miktar
- Ekstra gruplarını ürüne bağla

**Teknik:**
- React Hook Form + Zod validation
- Fotoğraf: `supabase.storage.from('bolena-cafe').upload()`
- İçindekiler: form array (useFieldArray)

---

## 4. Ekstralar Sistemi

**Sayfalar:** `/[locale]/(admin)/extras`

**Özellikler:**

### Ekstra Grupları
- Grup listesi
- Grup ekle/düzenle: isim (TR + EN), zorunlu mu

### Grup Seçenekleri
- Seçenek listesi (gruba göre)
- Seçenek ekle/düzenle: isim (TR + EN), fiyat (0 = ücretsiz), max seçim sayısı
- Seçenek aktif/pasif

**Teknik:**
- `extra_groups` + `extra_options` tabloları
- Ürün-grup bağlantısı: `product_extra_groups`

---

## 5. Masa Sistemi

**Sayfalar:** `/[locale]/(admin)/tables`

**Özellikler:**

### Masa Listesi Ekranı
- Masalar kutu (card) görünümünde
- Masa durumu renk kodu: boş (yeşil), dolu (kırmızı), rezervasyonlu (sarı)
- Sağ üst: "Masaları Düzenle" butonu

### Masa Düzenleme (Modal)
- Masa ekle/düzenle: isim, kategori
- Masa sil (aktif sipariş yoksa)

### Masa Detay / Sipariş Ekranı
- Mevcut siparişler listesi
- Menü ürünleri kutular halinde (kategori sekmesi ile)
- "Hızlı Ekle" butonu → AddProductModal
- Toplam tutar
- "Ödeme Al" butonu → PaymentModal

### AddProductModal (Ortak Bileşen)
- Çıkartılabilir içerikler (checkbox)
- Ekstra grupları ve seçenekleri
- Adet
- Not alanı

### PaymentModal — Masa (Parçalı Ödeme)
- Ödenmemiş tutar göster
- Nakit / Kart seçimi
- Kısmi tutar girişi
- Kalan tutar göster
- İndirim uygula (tutar veya yüzde)
- Ürün ikram olarak işaretle
- "Ödemeyi Tamamla" → siparişi kapat

**Realtime:** Masa açıkken sipariş güncellemeleri anlık yansır.

---

## 6. Rezervasyon & Gel-Al

**Sayfalar:** `/[locale]/(admin)/reservations`

**Özellikler:**

### Yeni Rezervasyon Formu
- Tip: Rezervasyon / Gel-Al
- Müşteri adı, telefon
- Tarih, saat (sadece rezervasyon için)
- Kişi sayısı, notlar
- Menüden ürün ekleme (AddProductModal ile)

### Mevcut Rezervasyonlar Listesi
- Tablo görünümü: ad, telefon, tarih/saat, tip, durum, tutar
- Eylemler:
  - **Masaya Ata** → boş masa seçimi → sipariş masa sistemine geçer
  - **Gelmedi** → status = no_show
  - **İptal** → status = cancelled
  - **Ödeme Al** → PaymentModal (gel-al için parçalı ödeme)

**Teknik:**
- Rezervasyon oluşturulunca `orders` + `reservations` tablosuna kayıt
- Masaya atama: `orders.table_id` güncellenir, `reservations.status = seated`

---

## 7. Platform Siparişleri

**Sayfalar:** `/[locale]/(admin)/platform-orders`

**Özellikler:**

### Yeni Sipariş Formu
- Platform: Yemeksepeti / Getir / Trendyol / Kurye
- Müşteri adı, telefon, adres, not
- Menüden ürün ekleme (AddProductModal ile)

### Aktif Siparişler Listesi
- Platform logosu/adı, müşteri, tutar, saat
- **Teslim Edildi** → status = completed → geçmiş siparişlere
- **Ödeme Al** (sadece Kurye) → nakit/kart, tek seferlik, parçalı ödeme yok
- Yemeksepeti/Getir/Trendyol: ödeme otomatik `platform` olarak kaydedilir

### Geçmiş Siparişler
- Tamamlanan platform siparişleri

---

## 8. Çalışma Saatleri

**Sayfalar:** `/[locale]/(admin)/working-hours`

**Özellikler:**

### Haftalık Çizelge
- 7 gün tablo görünümünde
- Her gün: açık/kapalı toggle, saat aralığı, TR + EN not
- Kaydet butonu

### İstisnalar
- İstisna listesi (tarih bazlı)
- İstisna ekle/düzenle: tarih, açık/kapalı, saat aralığı, TR + EN açıklama
- İstisna sil

**Mantık:**
```
isOpen(date):
  1. working_hours_exceptions'da tarih var mı? → varsa onu kullan
  2. Yoksa working_hours'daki gün bilgisini kullan
```

---

## 9. Public Tanıtım Sitesi

**Sayfalar:** `/[locale]/` (public group)

**Özellikler:**
- Ana sayfa (kafe tanıtımı)
- Menü sayfası (kategoriler + ürünler, filtreleme, alerjen bilgisi)
- Çalışma saatleri gösterimi
- Dil değiştirici (TR / EN)

**Teknik:**
- SSR (SEO için)
- Public ürünler: `is_visible = true AND is_available = true`
- Kampanya fiyatı: `campaign_end_date >= today` ise göster

---

## 10. Dashboard & Raporlama (İleride)

**Planlanan özellikler:**
- Günlük/haftalık/aylık gelir
- En çok satan ürünler
- Platform bazlı sipariş dağılımı
- Ortalama masa süresi
- Stok uyarıları

**Teknik altyapı hazır:**
- `orders` + `order_items` + `payments` tabloları raporlama için optimize edildi
- İndeksler `created_at` üzerinde mevcut

---

## Ortak Bileşenler

```
components/modules/orders/
├── AddProductModal.tsx    # Ürün ekleme (içerik çıkarma + ekstra seçimi)
├── PaymentModal.tsx       # Ödeme alma (parçalı ve tek seferlik mod)
├── OrderItemList.tsx      # Sipariş kalemi listesi
└── OrderSummary.tsx       # Toplam + indirim özeti
```

Bu bileşenler **masa, rezervasyon, gel-al ve platform siparişlerinde** aynı şekilde kullanılır.
