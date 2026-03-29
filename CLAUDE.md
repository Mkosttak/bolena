# Bolena Cafe — AI Development Guide

> **ÇOK AJANS UYARISI:** Bu proje birden fazla yapay zeka tarafından sırayla geliştirilmektedir.
> Her yapay zeka, diğerinin ne yaptığını bilmez. Halüsinasyonları ve çakışmaları önlemek için
> **her oturum başında** aşağıdaki protokolü eksiksiz uygula.

---

## 🚨 OTURUM BAŞLANGIÇ PROTOKOLÜ (ZORUNLU)

**Herhangi bir kod yazmadan önce şu adımları sırayla uygula:**

1. `docs/PROGRESS.md` dosyasını oku → neyin bittiğini, neyin devam ettiğini öğren
2. `docs/DECISIONS.md` dosyasını oku → alınan kararları öğren, tekrar tartışma
3. `docs/TESTING.md` dosyasını oku → o modül için hangi testlerin yazılması gerektiğini öğren
4. Görevin varsa ilgili mevcut dosyaları oku → varsayımla kod yazma
5. Görevi tamamlayınca **önce testleri yaz**, sonra `docs/PROGRESS.md` güncelle

**Bu protokolü atlamak = halüsinasyon riski = projeyi bozmak.**

---

## 🧪 TEST ZORUNLULUĞU

**Bir görev, testleri olmadan ✅ tamamlandı sayılmaz.**

Her modül tesliminde şunlar zorunludur:
- Utility fonksiyonları → Vitest unit test
- Zod şemaları → Vitest unit test
- Kritik bileşenler → React Testing Library component test
- Kritik iş mantığı → unit test (fiyat hesabı, stok, yetki, isOpen)
- Kritik akışlar → Playwright E2E (en az 1 happy path)

Test detayları: `docs/TESTING.md`

---

## Proje Özeti

Glutensiz kafe için **çift dilli (TR/EN)** web uygulaması.
İki bölüm: **Tanıtım sitesi** (public, SSR) + **İşletme yönetim paneli** (admin, CSR ağırlıklı).
Tasarım öncelikli değil — shadcn default stilleri kullan. Öncelik: sağlam backend + DB altyapısı.

---

## Teknoloji Yığını (KESİN — Değiştirme)

| Paket | Versiyon | Import |
|---|---|---|
| Next.js | **16.2** (App Router) | — |
| React | **19** | — |
| TypeScript | **5.x** | — |
| Tailwind CSS | **v4** | — |
| shadcn/ui | **cli v4** (Tailwind v4 uyumlu) | `@/components/ui/...` |
| TanStack Query | **v5** (React, NOT v6) | `@tanstack/react-query` |
| next-intl | **v4.8.3** | `next-intl` |
| Zustand | **v5** | `zustand` |
| React Hook Form | **v7** | `react-hook-form` |
| Zod | **v4** | `zod` |
| date-fns | **latest** | `date-fns` |
| Supabase JS | **latest** | `@supabase/supabase-js` |

> **UYARI:** TanStack Query React için v5'tedir. v6 YAZMA — sadece Svelte'de var.
> **UYARI:** Zod v4 API'si v3'ten farklıdır. `z.string().min()` → `z.string().min()` (aynı), ama `z.object` davranışları değişti. Dokümantasyona bak.

---

## Supabase Bağlantısı

```env
NEXT_PUBLIC_SUPABASE_URL=https://guuqyqtcmlijhlvcblyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1dXF5cXRjbWxpamhsdmNibHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTMxODYsImV4cCI6MjA5MDM2OTE4Nn0.LIyZgSEOvajgYJ1q0ZLVCUVCpbEfd1XYZ8MUZX1wZsM
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_V9psgcW8h1NkwylTGFOZFw_PixNVyMB
```

- Project ID: `guuqyqtcmlijhlvcblyh`
- Region: `eu-north-1` | DB: PostgreSQL 17

---

## Proje Klasör Yapısı (KESİN — Değiştirme)

```
bolena2/
├── app/
│   ├── [locale]/
│   │   ├── (public)/              # Tanıtım sayfaları (SSR)
│   │   │   ├── page.tsx
│   │   │   └── menu/page.tsx
│   │   └── (admin)/               # Yönetim paneli
│   │       ├── layout.tsx         # Auth guard + sidebar
│   │       ├── dashboard/page.tsx
│   │       ├── users/page.tsx
│   │       ├── menu/page.tsx
│   │       ├── extras/page.tsx
│   │       ├── tables/
│   │       │   ├── page.tsx       # Masa listesi
│   │       │   └── [id]/page.tsx  # Masa detay/sipariş
│   │       ├── reservations/page.tsx
│   │       ├── platform-orders/page.tsx
│   │       └── working-hours/page.tsx
│   ├── api/                       # Route handlers (gerekirse)
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn/ui (otomatik generate, DOKUNMA)
│   ├── shared/                    # Ortak layout bileşenleri
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── LanguageSwitcher.tsx
│   └── modules/                   # Modül bazlı bileşenler
│       ├── orders/                # ORTAK sipariş bileşenleri
│       │   ├── AddProductModal.tsx
│       │   ├── PaymentModal.tsx
│       │   ├── OrderItemList.tsx
│       │   └── OrderSummary.tsx
│       ├── menu/
│       ├── tables/
│       ├── reservations/
│       └── users/
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server Supabase client (RSC)
│   │   └── admin.ts               # Service role client (SADECE server-side)
│   ├── stores/                    # Zustand store'ları
│   │   ├── auth.store.ts          # Kullanıcı profili + izinler
│   │   ├── order.store.ts         # Aktif sipariş state'i
│   │   └── cart.store.ts          # Ürün ekleme sepeti
│   ├── hooks/                     # Custom React hooks
│   │   └── usePermission.ts       # Modül izin kontrolü
│   ├── queries/                   # TanStack Query (modül bazlı)
│   │   ├── menu.queries.ts
│   │   ├── orders.queries.ts
│   │   └── ...
│   ├── validations/               # Zod şemaları (modül bazlı)
│   │   ├── menu.schema.ts
│   │   ├── order.schema.ts
│   │   └── ...
│   └── utils/
│       ├── order.utils.ts         # Fiyat hesaplama vb.
│       └── date.utils.ts
├── i18n/
│   ├── messages/
│   │   ├── tr.json
│   │   └── en.json
│   └── routing.ts
├── types/
│   ├── database.types.ts          # Supabase generated (npx supabase gen types)
│   └── index.ts                   # App-level type tanımları
├── supabase/
│   └── migrations/                # SQL migration dosyaları
│       └── 001_initial_schema.sql
├── middleware.ts                   # next-intl + auth middleware
├── .env.local                     # Ortam değişkenleri
└── docs/                          # Proje dokümantasyonu
    ├── DATABASE.md
    ├── ARCHITECTURE.md
    ├── MODULES.md
    ├── CONVENTIONS.md
    ├── DECISIONS.md
    └── PROGRESS.md                # ← Her oturumda güncelle
```

---

## Sabit Tip Tanımları (Değiştirme)

```typescript
// types/index.ts içinde tanımlı — buradan import et
type UserRole = 'admin' | 'employee'
type OrderType = 'table' | 'reservation' | 'takeaway' | 'platform'
type PlatformType = 'yemeksepeti' | 'getir' | 'trendyol' | 'courier'
type OrderStatus = 'active' | 'completed' | 'cancelled' | 'no_show'
type PaymentMethod = 'cash' | 'card' | 'platform'
type PaymentStatus = 'pending' | 'partial' | 'paid'
type ReservationType = 'reservation' | 'takeaway'
type ReservationStatus = 'pending' | 'seated' | 'completed' | 'cancelled' | 'no_show'
type DiscountType = 'amount' | 'percent'

// Modül adları — izin sisteminde kullanılır
const MODULES = [
  'users', 'menu', 'extras', 'tables',
  'reservations', 'platform-orders', 'working-hours',
  'reports', 'dashboard'
] as const
type ModuleName = typeof MODULES[number]
```

---

## Supabase Kullanım Kuralları

```typescript
// ✅ DOĞRU: Server Component / Server Action
import { createServerClient } from '@/lib/supabase/server'
const supabase = await createServerClient()

// ✅ DOĞRU: Client Component
import { createBrowserClient } from '@/lib/supabase/client'
const supabase = createBrowserClient()

// ✅ DOĞRU: Admin işlemleri (sadece server action/route handler)
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient() // SERVICE_ROLE_KEY kullanır

// ❌ YANLIŞ: Service role key'i client'a expose etme
// ❌ YANLIŞ: createClient() doğrudan çağırma (wrapper kullan)
// ❌ YANLIŞ: Aynı dosyada hem server hem browser client import etme
```

---

## Kritik Kodlama Kuralları

### YASAK (Asla Yapma)
- `any` tipi kullanma
- Hardcoded Türkçe/İngilizce UI metni (hepsi `i18n/messages/` içinde)
- Service role key'i `NEXT_PUBLIC_` prefix ile tanımlama
- Supabase RLS olmadan tablo oluşturma
- `console.log` production kodunda bırakma
- Aynı işlevi iki farklı dosyada tekrar yazma
- `useEffect` ile data fetch etme (TanStack Query kullan)
- `lib/supabase/client.ts` dosyasına dokunma — sadece import et
- Test yazmadan modülü tamamlandı olarak işaretleme

### ZORUNLU
- Her yeni tablo için RLS politikası yaz
- Her form için Zod şeması `lib/validations/` altında
- Her modül için TanStack Query keys factory `lib/queries/` altında
- `database.types.ts` güncellenince `types/index.ts`'deki türleri de güncelle
- Stok değişimi → her zaman `decrement_stock()` RPC kullan

### Dosya İsimlendirme
```
Bileşenler:  PascalCase    → AddProductModal.tsx
Hooks:       camelCase     → usePermission.ts
Utils/lib:   camelCase     → order.utils.ts
Store:       camelCase     → auth.store.ts
Queries:     camelCase     → menu.queries.ts
Validations: camelCase     → menu.schema.ts
Sayfalar:    kebab-case    → platform-orders/page.tsx
```

---

## Yetki Kontrol Akışı

```
1. middleware.ts      → Supabase session var mı? Yoksa /login
2. (admin)/layout.tsx → profile.role kontrol (auth.store'dan)
3. usePermission()    → modül izni var mı?
4. Supabase RLS       → DB seviyesinde son savunma

Admin: her modüle erişir
Employee: module_permissions tablosunda can_access=true olan modüllere erişir
```

---

## Realtime Kuralı

Supabase Realtime **sadece** bu sayfalarda kullanılır:
- `tables/[id]/page.tsx` → aktif masa siparişleri
- `reservations/page.tsx` → aktif rezervasyonlar listesi
- `platform-orders/page.tsx` → aktif platform siparişleri

Her subscribe → component unmount'ta mutlaka unsubscribe yap.

---

## Ortak Sipariş Bileşenleri (Tekrar Yazma)

`components/modules/orders/` altındaki bileşenler **tüm sipariş tiplerinde** ortaktır:

| Bileşen | Kullanım |
|---|---|
| `AddProductModal` | Masa + Rezervasyon + Gel-Al + Platform |
| `PaymentModal` | Masa + Rezervasyon + Gel-Al (parçalı) |
| `PaymentModalSimple` | Platform siparişleri (tek seferlik) |
| `OrderItemList` | Tüm sipariş tipleri |
| `OrderSummary` | Tüm sipariş tipleri |

Bu bileşenler mevcut değilse oluştur, mevcutsa değiştirmeden kullan.

---

## Öncelik Sırası

Güncel durum için → `docs/PROGRESS.md` dosyasına bak.

1. Proje yapısı ve MD dosyaları
2. Next.js 16 kurulumu + temel konfigürasyon
3. Supabase DB şeması (migration'lar)
4. Auth (login/logout/session)
5. Kullanıcı yönetimi modülü
6. Menü yönetimi (kategori + ürün + ekstralar)
7. Masa sistemi + sipariş motoru
8. Rezervasyon & Gel-al
9. Platform siparişleri
10. Çalışma saatleri
11. Public tanıtım sitesi
12. Dashboard & Raporlama (ileride)

---

## Dokümantasyon Haritası

| Dosya | İçerik |
|---|---|
| `CLAUDE.md` | Bu dosya — genel rehber |
| `docs/PROGRESS.md` | **Güncel durum** — her oturumda güncelle |
| `docs/DECISIONS.md` | Alınan kararlar — tartışmayı yeniden açma |
| `docs/DATABASE.md` | Tam DB şeması |
| `docs/ARCHITECTURE.md` | Mimari kararlar |
| `docs/MODULES.md` | Modül detayları |
| `docs/CONVENTIONS.md` | Kod konvansiyonları |
| `docs/TESTING.md` | Test stratejisi ve modül bazlı zorunlu testler |
| `.env.example` | Gereken tüm env variable'lar |
