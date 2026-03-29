# Bolena Cafe — Mimari Kararlar

## Genel Mimari

```
┌─────────────────────────────────────────────────┐
│                  Next.js 16.2                    │
│                                                  │
│  ┌──────────────┐    ┌─────────────────────────┐ │
│  │ Public Pages │    │    Admin Panel (CSR)    │ │
│  │ (SSR / SEO)  │    │  Role & Module Guards   │ │
│  └──────────────┘    └─────────────────────────┘ │
│          │                      │                │
│          └──────────┬───────────┘                │
│                     ▼                            │
│           ┌──────────────────┐                   │
│           │  Supabase Client │                   │
│           │  (browser/server)│                   │
│           └──────────────────┘                   │
└─────────────────────┬───────────────────────────┘
                      │
          ┌───────────▼──────────┐
          │      Supabase        │
          │  ┌────────────────┐  │
          │  │  PostgreSQL 17 │  │
          │  │      RLS       │  │
          │  ├────────────────┤  │
          │  │    Realtime    │  │
          │  ├────────────────┤  │
          │  │    Storage     │  │
          │  ├────────────────┤  │
          │  │      Auth      │  │
          │  └────────────────┘  │
          └──────────────────────┘
```

---

## Auth Akışı

```
Browser Request
     │
     ▼
middleware.ts (next-intl locale + Supabase session check)
     │
     ├── /[locale]/(public)/* → session gerekmez
     │
     └── /[locale]/(admin)/* → session yoksa /login'e yönlendir
              │
              ▼
         layout.tsx (admin)
              │
              ├── role = admin → tüm modüller açık
              │
              └── role = employee → module_permissions kontrol
                        │
                        ├── can_access = true → sayfa render
                        └── can_access = false → 403 sayfası
```

---

## Veri Katmanı Mimarisi

### Server Components (RSC)
- İlk sayfa yüklemesi ve SEO gerektiren içerikler
- `lib/supabase/server.ts` kullanır
- Cookie tabanlı session

### Client Components
- Realtime, etkileşimli sipariş ekranları
- `lib/supabase/client.ts` kullanır
- TanStack Query ile cache + invalidate

### TanStack Query Yapısı
```typescript
// lib/queries/menu.queries.ts
export const menuKeys = {
  all: ['menu'] as const,
  categories: () => [...menuKeys.all, 'categories'] as const,
  products: (categoryId?: string) => [...menuKeys.all, 'products', categoryId] as const,
}

// Her modülün kendi query key factory'si var
```

### Zustand Store'ları
```typescript
// lib/stores/order.store.ts  → aktif masa siparişleri
// lib/stores/cart.store.ts   → ürün ekleme sepeti (sipariş öncesi)
// lib/stores/auth.store.ts   → kullanıcı profili + izinler
```

---

## Realtime Stratejisi

Supabase Realtime **sadece** aktif sipariş ekranlarında kullanılır:

```typescript
// Masa açıkken subscribe, kapanınca unsubscribe
useEffect(() => {
  const channel = supabase
    .channel(`order:${tableId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'order_items',
      filter: `order_id=eq.${orderId}`
    }, handleChange)
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}, [tableId, orderId])
```

---

## i18n Stratejisi

- URL bazlı locale: `/tr/*` ve `/en/*`
- `next-intl` v4 ile middleware routing
- Admin paneli TR'de sabit kalabilir (kullanıcı tercihi ile değiştirilebilir)
- Public site tam çift dilli

```
i18n/messages/
├── tr.json    → { "menu": { "title": "Menümüz" }, ... }
└── en.json    → { "menu": { "title": "Our Menu" }, ... }
```

---

## Sipariş Mimarisi

Tüm sipariş tipleri tek `orders` tablosunda birleşir.
`type` alanı ile ayrılır: `table | reservation | takeaway | platform`

**Ortak sipariş UI bileşeni** tüm tiplerde kullanılır:
```
components/modules/orders/
├── OrderItemList.tsx      → sipariş kalemlerini göster
├── AddProductModal.tsx    → ürün ekleme (içerik çıkarma + ekstra)
├── PaymentModal.tsx       → ödeme al (masa/gel-al: parçalı; platform: tek seferlik)
└── OrderSummary.tsx       → toplam + indirim
```

---

## Görsel Ürün Depolama

```
Supabase Storage
└── bolena-cafe (bucket)
    └── products/
        └── {product_id}/{timestamp}.{ext}
```

- Public bucket — CDN üzerinden serve
- `next/image` ile optimize render
- Upload sırasında dosya boyutu limiti: 2MB
- Format: JPEG/WebP/PNG

---

## Performans Hedefleri

| Metrik | Hedef |
|--------|-------|
| Admin panel ilk yüklenme | < 2s |
| Masa sipariş ekranı update | < 500ms (realtime) |
| Menü listeleme | < 1s |
| Stok güncellemesi | Atomik (RPC) |

---

## Güvenlik Katmanları

1. **Middleware** → oturum kontrolü (her istek)
2. **Layout Guards** → rol/modül kontrolü (React)
3. **Supabase RLS** → veritabanı seviyesi (her sorgu)
4. **Zod Validation** → input sanitization (her form)
5. **Service Role** → sadece server-side, asla client'a expose edilmez
