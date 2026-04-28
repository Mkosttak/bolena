# Bolena Cafe — Güvenlik

## Katmanlar

1. `proxy.ts` — oturum + locale  
2. Admin layout — aktif kullanıcı  
3. `requireModuleAccess()` — server action / server modül girişi  
4. RLS — Postgres

`orders` / `order_items` / `payments` / `reservations` için RLS geniş “authenticated” olabilir; modül sınırı uygulamada (bkz. DECISIONS K-21).

## Service role

Yalnız `lib/supabase/admin.ts` (veya eşdeğeri) ve `process.env.SUPABASE_SERVICE_ROLE_KEY`. Kaynak kodda anahtar gömme; grep ile `eyJ` arama yapılmamalı (repo temiz).

## Input

Zod (client + server) → CHECK / FK DB’de. Supabase client parametreli; ham string SQL birleştirme yok.

## XSS

`dangerouslySetInnerHTML` kullanma; `next/image` domain allowlist.

## Auth

`@supabase/ssr` cookie oturumu; token’ı localStorage’a taşıma.

## DB fonksiyonları

`SET search_path` sabitlemesi migration’larda (Advisor uyarıları).

## Rate limit

Uygulama katmanında özel limit yok; Auth tarafı Supabase default + Dashboard ayarları.

**Kontrol:** Advisors (Security) + RLS disabled tablo olmaması.
