# Bolena Cafe — Mimari

## Genel

Next.js 16 App Router: **public** (SSR/SEO, `/[locale]/(public)`) + **admin** (CSR ağırlıklı, `/[locale]/admin`). Veri: Supabase (Postgres, RLS, Auth, Realtime, Storage). İstemci önbellek: TanStack Query v5; global UI state: Zustand.

```
Browser → proxy.ts (locale + session) → RSC / Client
       → Supabase (server.ts | client.ts); ağır admin işi → admin.ts (service role, yalnız sunucu)
```

## Auth / yetki

`proxy.ts` → admin rotalarında session yoksa login. `(admin)/layout.tsx` → aktif kullanıcı. Client’ta `auth.store` + `usePermission()`; sunucuda `requireModuleAccess()`. RLS son hat.

## Veri erişimi

- RSC / Server Actions: `lib/supabase/server.ts`
- Client + Realtime: `lib/supabase/client.ts`
- Her modül: `lib/queries/*Keys` factory + `useQuery` / `useMutation` — **fetch için `useEffect` kullanma.**

## Realtime

Yalnızca: masa detay, rezervasyonlar, platform siparişleri. Kanal aç → unmount’ta `removeChannel`.

## Sipariş UI

Ortak: `components/modules/orders/` — `AddProductModal`, `PaymentModal` / `PaymentModalSimple` (platform), `OrderItemList`, `OrderSummary`.

## i18n

`next-intl`; metinler `i18n/messages/tr.json` & `en.json`. Admin pratikte TR; public TR+EN.

## Storage

Bucket `bolena-cafe`; ürün path: `products/{id}/{timestamp}.{ext}` (bkz. `docs/DECISIONS.md` K-08).
