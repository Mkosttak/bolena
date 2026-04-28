# Bolena Cafe — Teknik Kararlar

Kesinleşmiş kararlar; değiştirmeden önce kullanıcıya danış.

## Mimari

| ID | Karar | Neden |
|----|--------|--------|
| K-01 | Tek repo, tek Next app (public + admin) | Ortak auth/bileşen, tek deploy |
| K-02 | App Router | RSC, layout, Next 16 |
| K-03 | Tüm sipariş tipleri tek `orders` + `type` | Ortak ödeme/rapor/motor |
| K-04 | Stok `decrement_stock()` RPC | Yarış önleme |
| K-05 | Realtime yalnız masa / rezervasyon / platform sayfaları | Gereksiz WS yok |
| K-06 | Supabase Auth (NextAuth yok) | RLS JWT ile hizalı |
| K-07 | Admin pratikte TR; public TR+EN | Operasyon / misafir |

## Depolama ve veri

| ID | Karar | Neden |
|----|--------|--------|
| K-08 | Storage `bolena-cafe`, path `products/{id}/{ts}.{ext}`, max ~2MB | CDN, tek servis |
| K-09 | Platform’da parçalı ödeme yok → `PaymentModalSimple` | Tek ödeyici |
| K-10 | `isOpen()`: önce `working_hours_exceptions` | İstisna haftalığı ezer |
| K-11 | Ürün fiziksel silinmez → `is_visible=false` | Geçmiş FK |
| K-12 | İzinler `module_permissions` + `auth.store` cache | Nav’da DB spam yok; asıl güvenlik RLS + guard |
| K-16 | `order_items` ürün adı + `unit_price` snapshot | Fiyat değişimi geçmişi bozmaz |
| K-17 | Ekstralar JSONB | Normalize aşırı |
| K-18 | Kampanya fiyatı hesaplanan alan (DB’de ayrı kolon yok) | Basit model |
| K-22 | Kampanya tutarlılığı Zod + DB constraint | Çift koruma |

## Next.js ve routing

| ID | Karar | Neden |
|----|--------|--------|
| K-13 | shadcn default stil önceliği | Hızlı tutarlı UI |
| K-14 | Masalar card grid | Mekânsal model |
| K-15 | Locale URL `/tr/*`, `/en/*` | SEO, paylaşım |
| K-19 | `proxy.ts` (Next 16), eski `middleware` adı yok | Guard birleşimi |
| K-20 | Login `app/[locale]/login/` — `(admin)` dışında | Redirect döngüsü önleme |
| K-21 | Sipariş tablolarında geniş authenticated RLS | Granüler RLS maliyeti; guard `requireModuleAccess` |
