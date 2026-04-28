# Bolena Cafe — Claude Rehberi

Çok ajans; her oturumda: **1)** `docs/PROGRESS.md` **2)** `docs/DECISIONS.md` **3)** görevle ilgili dosyalar **4)** bitince test + PROGRESS güncelle.

**Token:** Klasörü Glob ile keşfet; tipler `types/index.ts`. Tüm `docs/` okuma — yalnız ilgili dosya.

## Proje

Glutensiz kafe; TR/EN. Public (SSR) + Admin (CSR).

## Stack (sürüm değiştirme)

Next 16.2 App Router, React 19, TanStack Query **v5**, next-intl 4.8.3, Zustand 5, RHF 7, Zod 4, Tailwind 4, shadcn cli v4, Supabase JS latest.

## Supabase

Project `guuqyqtcmlijhlvcblyh` (eu-north-1). Client: `lib/supabase/server.ts` | `client.ts` | `admin.ts` (yalnız sunucu). Env: `.env.local`.

## Yasak / zorunlu

**Yasak:** `any`, hardcoded UI metni (→ `i18n/messages/`), `NEXT_PUBLIC_*` service role, RLS’siz tablo, prod `console.log`, data fetch için `useEffect` (→ Query), testsiz “bitti” demek.

**Zorunlu:** Form → Zod `lib/validations/`; modül → query keys `lib/queries/`; yeni tablo → RLS; stok → `decrement_stock` (+ iade akışında ilgili RPC).

## İsimlendirme

PascalCase bileşen; camelCase hook/utils/store/queries/validations; kebab-case sayfa klasörü.

## Yetki

`proxy.ts` → session → `(admin)/layout` → rol → `usePermission()` → RLS.

## Realtime (yalnız)

`tables/[id]/page.tsx`, `reservations/page.tsx`, `platform-orders/page.tsx` — unmount’ta unsubscribe.

## Ortak sipariş UI

`components/modules/orders/`: `AddProductModal`, `PaymentModal` (masa / rezervasyon / gel-al), `PaymentModalSimple` (platform), `OrderItemList`, `OrderSummary`. Yoksa ekle; varsa gereksiz değiştirme.

## Test

Özet: `docs/TESTING.md` — utils/Zod Vitest; kritik bileşen RTL; en az bir E2E happy path.

## Docs indeksi

| Dosya | İçerik |
|--------|--------|
| PROGRESS | Durum, açık konular |
| DECISIONS | Kilit kararlar |
| TESTING | Test politikası |
| DATABASE | Şema özeti → migration kaynak |
