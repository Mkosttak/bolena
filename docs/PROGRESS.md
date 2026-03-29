# Bolena Cafe — Proje İlerleme Takibi

> **YAPAY ZEKA TALİMATI:**
> - Bu dosyayı her oturumun **başında** oku
> - Görevini tamamlayınca bu dosyayı **güncelle**
> - Yarım bıraktığın bir şey varsa "🔄 Devam Ediyor" olarak işaretle ve ne kaldığını yaz
> - Bir sonraki yapay zeka buradan devam edecek

---

## Son Güncelleme
**Tarih:** 2026-03-29
**Oturum:** Proje kurulumu ve dokümantasyon
**Yapılan:** MD dosyaları oluşturuldu

---

## Tamamlanan Görevler

### ✅ 1. Proje Dokümantasyonu (2026-03-29)
**Oluşturulan dosyalar:**
- `CLAUDE.md` — Ana AI rehberi
- `docs/DATABASE.md` — Tam DB şeması (tüm tablolar, indeksler, RPC'ler)
- `docs/ARCHITECTURE.md` — Mimari kararlar
- `docs/MODULES.md` — Modül detayları
- `docs/CONVENTIONS.md` — Kod konvansiyonları
- `docs/DECISIONS.md` — Alınan kararlar
- `docs/PROGRESS.md` — Bu dosya

**Supabase projesi bağlandı:**
- Proje: `bolena-cafe` (ID: `guuqyqtcmlijhlvcblyh`)
- Region: `eu-north-1`

---

## Devam Eden Görevler

Şu an devam eden görev yok.

---

## Bekleyen Görevler (Sırayla)

### ⬜ 2. Next.js 16 Kurulumu
**Ne yapılacak:**
- `npx create-next-app@latest` ile Next.js 16.2 projesi oluştur
- TypeScript, Tailwind v4, App Router seçenekleri
- `next-intl` v4 kurulumu ve konfigürasyonu
- `middleware.ts` oluştur (locale routing + auth)
- shadcn/ui cli v4 kurulumu
- Temel layout bileşenleri (Sidebar, Header)
- `.env.local` oluştur (Supabase env değişkenleri)

**Tamamlanınca oluşacak dosyalar:**
- `package.json`, `next.config.ts`, `tailwind.config.ts`
- `middleware.ts`
- `i18n/routing.ts`, `i18n/messages/tr.json`, `i18n/messages/en.json`
- `app/[locale]/layout.tsx`
- `components/shared/Sidebar.tsx`, `Header.tsx`

---

### ⬜ 3. Supabase DB Şeması (Migration)
**Ne yapılacak:**
- `docs/DATABASE.md`'deki tüm tabloları migration SQL olarak yaz
- Supabase'e migration uygula
- RLS politikalarını yaz ve uygula
- `decrement_stock()` RPC'yi oluştur
- `npx supabase gen types typescript` ile `types/database.types.ts` üret
- `types/index.ts` içinde app-level tipleri tanımla

**Tamamlanınca oluşacak dosyalar:**
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/migrations/003_functions.sql`
- `types/database.types.ts`
- `types/index.ts`

---

### ⬜ 4. Supabase Client Wrappers
**Ne yapılacak:**
- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server client (Next.js cookies)
- `lib/supabase/admin.ts` — service role client

---

### ⬜ 5. Auth Sistemi
**Ne yapılacak:**
- Login sayfası: `app/[locale]/(admin)/login/page.tsx`
- `auth.store.ts` — Zustand store (profil + izinler)
- `usePermission.ts` hook
- `(admin)/layout.tsx` — auth guard + modül izin kontrolü
- Şifre sıfırlama sayfası

---

### ⬜ 6. Kullanıcı Yönetimi Modülü
**Ne yapılacak:**
- `app/[locale]/(admin)/users/page.tsx`
- Kullanıcı listesi tablosu
- Kullanıcı ekleme formu (server action ile)
- Modül izin matrisi (checkbox grid)
- Pasif etme / aktif etme
- Şifre sıfırlama email gönderimi

---

### ⬜ 7. Menü Yönetimi Modülü
**Ne yapılacak:**
- `app/[locale]/(admin)/menu/page.tsx`
- Kategori yönetimi (modal/drawer)
- Ürün listesi (tablo, filtreleme)
- Ürün ekleme/düzenleme formu (tam sayfa)
- Fotoğraf yükleme (Supabase Storage)
- İçerik yönetimi (useFieldArray)

---

### ⬜ 8. Ekstralar Sistemi
**Ne yapılacak:**
- `app/[locale]/(admin)/extras/page.tsx`
- Ekstra grup CRUD
- Ekstra seçenek CRUD
- Ürüne ekstra grubu bağlama

---

### ⬜ 9. Masa Sistemi + Sipariş Motoru
**Ne yapılacak:**
- `app/[locale]/(admin)/tables/page.tsx` — masa listesi (card grid)
- `app/[locale]/(admin)/tables/[id]/page.tsx` — masa detay + sipariş
- `AddProductModal.tsx` — ortak bileşen
- `PaymentModal.tsx` — parçalı ödeme
- `OrderItemList.tsx`, `OrderSummary.tsx`
- Supabase Realtime entegrasyonu

---

### ⬜ 10. Rezervasyon & Gel-Al Modülü
**Ne yapılacak:**
- `app/[locale]/(admin)/reservations/page.tsx`
- Rezervasyon formu, gel-al formu
- Rezervasyon listesi (aktif + geçmiş)
- Masaya atama akışı

---

### ⬜ 11. Platform Siparişleri Modülü
**Ne yapılacak:**
- `app/[locale]/(admin)/platform-orders/page.tsx`
- Platform sipariş formu
- Aktif/geçmiş siparişler
- `PaymentModalSimple.tsx` — tek seferlik ödeme

---

### ⬜ 12. Çalışma Saatleri Modülü
**Ne yapılacak:**
- `app/[locale]/(admin)/working-hours/page.tsx`
- Haftalık çizelge
- İstisnalar yönetimi
- `isOpen(date)` utility fonksiyonu

---

### ⬜ 13. Public Tanıtım Sitesi
**Ne yapılacak:**
- `app/[locale]/(public)/page.tsx` — ana sayfa
- `app/[locale]/(public)/menu/page.tsx` — public menü (SSR)
- Dil değiştirici

---

### ⬜ 14. Dashboard & Raporlama (İleride)
Tarih belirsiz.

---

## Bilinen Sorunlar / Dikkat Edilecekler

_(Sorun çıkarsa buraya ekle)_

- Şu an bilinen bir sorun yok.

---

## Güncelleme Talimatı

Bir görev tamamlandığında şu formatı kullan:

```markdown
### ✅ X. Görev Adı (YYYY-MM-DD)
**Oluşturulan/değiştirilen dosyalar:**
- `dosya/yolu.ts` — ne yaptığı

**Yazılan testler:**
- `__tests__/unit/...` — ne test edildi
- `__tests__/components/...` — ne test edildi
- `e2e/...` — hangi akış test edildi

**Test sonucu:** ✅ X test geçti, 0 başarısız

**Notlar:**
- Önemli bir karar aldıysan buraya yaz
- Bir sonraki yapay zekanın bilmesi gereken bir şey varsa yaz
```

> ⚠️ "Yazılan testler" bölümü boş bırakılamaz. Test yoksa görev tamamlanmış sayılmaz.
