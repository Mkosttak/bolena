# Bolena Cafe — Proje Durumu

**Son güncelleme:** 2026-05-01 (v5 — son sanity check: idempotency UI, i18n eksikleri, audit RLS, prod build verified)

## Güncel özet (2026-05-01) — Tur 5: Son Sanity Check + Production Build

Production'a almadan ÖNCE bağımsız uzman audit (4. denetim). 8 bulgu — 3 kritik düzeltildi.

### Düzeltilenler

**🔴 KRİTİK: Payment idempotency UI'dan çalışmıyordu**
- Backend `addPayment(idempotencyKey)` parametresi alıyor + `payments.idempotency_key` UNIQUE migration'ı uygulandı, AMA UI hiç key göndermiyordu → DB-level koruma asla devreye girmiyordu, sadece 10sn app-level dedupe ile yetiniyordu.
- **Fix:** [PaymentModal.tsx:181](components/modules/orders/PaymentModal.tsx) ve [PaymentModalSimple.tsx:48](components/modules/orders/PaymentModalSimple.tsx) `crypto.randomUUID()` ile her ödeme niyetinde yeni key üretiyor. Network retry / double-click → DB UNIQUE 2. insert'i kesin reddeder.

**🔴 i18n eksikleri (7 yerde hardcoded TR string)**
- `PaymentModal.tsx` — "İptal", "İkram Yap/İptal Et"
- `AddProductModal.tsx` — "Tükendi", "Ekle", "Seçim", "Siparişe Ekle", "Toplam"
- `PaymentModalSimple.tsx` — "Ödeme Yöntemi"
- **Fix:** `i18n/messages/tr.json` ve `en.json`'a yeni key'ler. EN locale'de artık raw TR string görünmüyor.

**🟡 audit_log RLS belirsiz politika**
- `auth.uid() IS NOT NULL` ile herkes herkes adına insert yazabilirdi.
- **Fix:** `user_id` NOT NULL + `auth.uid() = user_id` enforce — kullanıcı sadece kendi adına log yazabilir. CHECK length constraints. UPDATE/DELETE policy yok → immutable log.

### Production Build Doğrulaması

`SKIP_ENV_VALIDATION=true npm run build` ile placeholder env kullanılarak prod build koşuldu:

```
✓ Compiled successfully in 18.2s
✓ Generating static pages (6/6) in 7.6s
30 route hazır + Middleware (Proxy) aktif
- Static: /_not-found, /manifest.webmanifest, /robots.txt, /sitemap.xml
- Dynamic: tüm sayfalar SSR
```

### Bilinçli kabul edilen risk

**Test'lerde auth global mock** — `__tests__/setup.ts`'de `requireAdmin/requireModuleAccess` her zaman admin döner. Role-based denial test'leri Faz 6'da yazılmalı.

### Yeşil baseline (sabit)

| Komut | Sonuç |
|------|-------|
| `npm run typecheck` | **0 hata** ✅ |
| `npm run lint` | **0 error**, 56 warning ✅ |
| `npm test` | **34 dosya, 402 passed, 1 skipped, 0 fail** ✅ |
| `npm run build` (prod) | **30 route compile başarılı** ✅ |

---

## Güncel özet (2026-05-01) — Tur 4: Production Polish + DX

## Güncel özet (2026-05-01) — Tur 4: Production Polish + DX

Production öncesi son rötuşlar.

### Eklenenler

**DX:**
- `.env.example` — yorumlu, kategori başlıklarıyla; yeni geliştirici için ilk kuruluş kolay.

**SEO + sosyal medya görünümü:**
- `app/layout.tsx` — root metadata genişletildi: `metadataBase`, title `template`, applicationName, keywords, **Open Graph** (1200×630 hero görseli), **Twitter Card** (summary_large_image), robots config, format detection, `viewport` themeColor.
- `app/[locale]/layout.tsx` — locale-aware `generateMetadata`: TR ve EN için ayrı title/description, `alternates.languages` + `x-default`, locale-specific OG.
- `app/[locale]/(public)/menu/page.tsx` — sayfa-spesifik metadata.
- `app/[locale]/(public)/contact/layout.tsx` — yeni layout (sayfa client component olduğu için), metadata burada.
- (Blog detay zaten `BlogJsonLd` + `generateMetadata` ile dolu.)

**Observability:**
- `components/shared/WebVitalsReporter.tsx` — Real User Monitoring:
  - Dev'de tüm metrikler renkli console'a (LCP/INP/CLS/FCP/TTFB)
  - Prod'da sadece "poor" metrikleri logger.warn'a
  - `NEXT_PUBLIC_VITALS_ENDPOINT` env varsa `navigator.sendBeacon` ile JSON POST (Datadog/Logtail/custom için)
- `[locale]/layout.tsx`'e enjekte edildi.

**Deployment config:**
- `vercel.json` — region `fra1` (Frankfurt, AB en yakın), `/api/health` no-cache, `/sitemap.xml` 1h CDN cache, `/robots.txt` 1d cache.

**a11y helper:**
- `components/ui/clickable-surface.tsx` — `<ClickableSurface onClick={...} ariaLabel="...">...</ClickableSurface>`. role/tabIndex/keyboard handler'ı bir noktada toplar. Faz 6 refactor sırasında modal'lardaki `<div onClick>` pattern'leri bununla değiştirilecek.

### Doğrulama (bu PC'de)

| Komut | Sonuç |
|------|-------|
| `npm run typecheck` | **0 hata** ✅ |
| `npm run lint` | **0 error, 56 warning** ✅ (a11y ve RHF Compiler — bilinçli) |
| `npm test` | **34 dosya, 402 passed, 1 skipped, 0 fail** ✅ |

### Kasıtlı bırakılan teknik borç (Faz 6 kapsamı)

- **28 a11y warning** modal'larda (`AddProductModal`, `EditOrderItemModal`, `PaymentModal`, `KdsCard`, `BlogForm`, `DashboardClient` vb.) — `<div onClick>` pattern'leri. `ClickableSurface` hazır; refactor sırasında migrate edilecek.
- **`tsconfig.test.json`** strict flag'leri kapalı — production kod %100, test kod orta strictness (~80 fix gerekir, değer/risk düşük).

### Bilgi: kullanıcıya kalan iş

Tüm `BENIM_YAPACAKLARIM.md`'deki adımlar geçerli. Bu turda kod tarafında ek dokunulacak yer kalmadı.



## Güncel özet (2026-05-01) — Tur 3: Yüksek Değer/Düşük Risk Optimizasyonlar

Önceki turlardan sonra elde edilen baseline'a uzman bakış açısıyla seçilen iyileştirmeler eklendi.

### Eklenenler

**Test omurgası — son iyileştirmeler:**
- `__tests__/helpers/supabase-mock.ts` — `queueResults({ single, maybeSingle, then })` API'si: terminal method başına ayrı queue. `addPayment` gibi multi-call action'larda doğru sıralama sağlar.
- 2 önceden skip'li test artık çalışıyor: `addPayment` (3 senaryo: partial/paid/error) + `blog.actions` sanitize verifikasyonu.
- `__tests__/components/orders/AddProductModal.test.tsx` — yeni RTL smoke (3 test, 1 bilinçli skip Faz 6 için).

**Bundle optimizasyonu (Faz 3 — devam):**
- [components/modules/reports/ReportsClient.tsx](components/modules/reports/ReportsClient.tsx): 10 chart bileşeni (`RevenueChart`, `OrderTypeChart`, `PaymentMethodChart`, `TopProductsTable`, `CategoryRevenueChart`, `HourlyHeatmap`, `PlatformCompareTable`, `EndOfDayReport`, `ReservationStats`, `CampaignStatsTable`) `next/dynamic` ile lazy load. Recharts ~150KB artık reports sayfası açılmadan bundle'a girmiyor.

**Asset optimizasyonu (Faz 3 — uygulandı):**
- `npm i -D sharp` + `npm run optimize:images` çalıştırıldı.
- **Sonuçlar:** Toplam 2.6MB → 251KB AVIF (%90.5 tasarruf)
  - `bolena_logo.png` 392KB → AVIF 38KB (-90%) + WebP 114KB (-70%)
  - `menu/hero.png` 720KB → AVIF 66KB (-91%)
  - `menu/placeholder-1.png` 764KB → AVIF 86KB (-89%)
  - `menu/placeholder-2.png` 740KB → AVIF 59KB (-92%)
- Orijinal `.png` dosyaları korundu. Next `<Image>` `formats: ['avif', 'webp']` config'i ile otomatik AVIF tercih eder.

**Production observability (Faz 5 — eklendi):**
- [lib/utils/logger.ts](lib/utils/logger.ts) yeniden yazıldı:
  - Production'da error → structured JSON line (Vercel/Cloud Logs ingest eder)
  - `SENTRY_DSN` env var → opsiyonel `@sentry/nextjs` dynamic import (paket yoksa silently skip)
  - `LOG_HTTP_ENDPOINT` env var → fire-and-forget JSON POST (Datadog/Logtail/custom)
  - Hiçbir env yoksa eski davranış (yalnızca console.error)

### Doğrulama (bu PC'de)

| Komut | Sonuç |
|------|-------|
| `npm run typecheck` | **0 hata** ✅ |
| `npm run lint` | **0 error, 56 warning** ✅ |
| `npm test` | **34 dosya, 400 passed, 1 skipped, 0 fail** ✅ |

### Karşılaştırma

| Metrik | Tur 1 sonu | Tur 2 sonu | Tur 3 sonu |
|--------|-----------|-----------|-----------|
| Test passed | 340 | 393 | **400** |
| Test failed | 11 | 0 | 0 |
| Lint warnings | 67 | 56 | 56 |
| Skipped tests | 2 | 2 | **1** |
| Action test dosyaları | 3 | 8 | 8 |
| RTL component test | 4 | 6 | **7** |
| Public asset toplam | 2.6MB | 2.6MB | **251KB** (AVIF) |
| Production logger | console only | console only | **structured + Sentry/HTTP hook** |

### Bilinçli atlandı

- **Faz 6 büyük dosya refactor** — Test coverage daha da artırıldıkça yapılmalı; AddProductModal smoke test eklendi (refactor'a giriş güvencesi).
- **a11y kalan 28 warning** — Faz 6 ile birlikte yapılması mantıklı (modal'lar yeniden yapılandırılırken).
- **Migration 008 rename** — kullanıcının prod DB'sinde elle: `supabase/repair/`.
- **Action input → Zod schema entegrasyonu** — schema'lar var ama bağlanmadı; mevcut akışı bozma riski / kazanç oranı düşük.



## Güncel özet (2026-05-01) — Devam: Test Omurgası Genişlemesi + a11y Temizliği

İlk turda eksik kalan test'ler ve a11y warning'leri kapatıldı. Önceki turdaki test fail'i (qr-session.store) düzeltildi.

### Eklenenler

**Test omurgası — büyük genişleme (Faz 2):**
- **6 yeni server action test dosyası**: `tables`, `reservations`, `users`, `kds`, `menu` + önceki orders/qr-session/blog → toplam **8 dosya, 50 test** (mock-based, env gerektirmez).
  - tables: createCategory, deleteCategory cascade, deleteTable cascade, getOrCreateTableOrder, transferTableOrder, regenerateQR
  - reservations: createReservation (rezervasyon + takeaway varyant), Zod fail, RPC fail, assignToTable (aktif sipariş kontrolü)
  - users: requireAdmin yetki kontrolü (login fail / employee fail / admin pass), createUser (Zod fail varyantları)
  - kds: markGroupReady, undoGroupReady (boş array shortcut + RPC error)
  - menu: createCategory, deleteCategory cascade, updateCategory
- **2 yeni component (RTL) test**: `OrderItemList` (5 test — empty, render, ikram, modifier, edit prop), `PaymentModalSimple` (4 test — open/close, methodlar, total)
- `__tests__/helpers/supabase-mock.ts` — `reset()` method eklendi (mock state test'ler arası temiz tutulur)
- `__tests__/setup.ts` — localStorage in-memory mock + SKIP_ENV_VALIDATION otomatik set

**qr-session.store fix:**
- [lib/stores/qr-session.store.ts](lib/stores/qr-session.store.ts): `createJSONStorage` ile storage tanımı eklendi (Zustand v5 + jsdom uyumu). Önceki commit'lerde Zustand persist storage'ı doğru initialize etmiyordu — 11 test fail ediyordu, şimdi tümü geçti.

**Husky aktivasyonu:**
- `git init` + `npx husky` → `.husky/_/` hook'ları aktif. Bundan sonra her commit öncesi `lint-staged`, her push öncesi `typecheck`.

**a11y warning'leri (-11):**
- [components/ui/label.tsx](components/ui/label.tsx): `label-has-associated-control` için bilinçli disable comment (htmlFor caller'dan gelir).
- [components/modules/menu/CampaignForm.tsx](components/modules/menu/CampaignForm.tsx:152): `autoFocus` için bilinçli disable (dropdown UX gereksinim).
- [app/[locale]/(public)/contact/page.tsx](app/[locale]/(public)/contact/page.tsx): 3 panel kart `<div role="button" tabIndex={0} aria-label aria-pressed onKeyDown>` ile keyboard erişilebilir hale getirildi + iframe'e `title` eklendi → 7 warning kapandı.

### Doğrulama

| Komut | Sonuç |
|------|-------|
| `npm run typecheck` | **0 hata** ✅ |
| `npm run lint` | **0 error, 56 warning** (önceden 67) ✅ |
| `npm test` | **33 dosya, 393 passed, 0 fail**, 2 skipped ✅ |

### Hâlâ kalan (kullanıcıya bırakıldı)

- **Faz 6 büyük dosya refactor** — coverage daha da artırıldıktan sonra güvenli (HomeLanding 1049, AddProductModal 956, vb.)
- **a11y kalan 28 warning** — çoğu AddProductModal/EditOrderItemModal modal'larında clickable div'ler. Refactor gerektiriyor (button'a çevirme veya helper component).
- **qr.schema.ts strict UUID** — Zod 4 UUID format'ı prod'daki gerçek QR token formatıyla uyumlu mu? Kontrol edilmeli.
- **`addPayment` ve blog-sanitize-test** — mock chain inceliği nedeniyle skip; ya helper'a "queue" pattern ekle ya da gerçek DB integration ile test et.
- **Order/Dashboard/KDS/Site-settings Zod schema'ları action'lara entegrasyon** — schema'lar var ama action input validation'a bağlanmadı (mevcut akışı bozmamak için).
- Detaylı kullanıcı talimatı: [docs/UPGRADE_NOTES.md](docs/UPGRADE_NOTES.md).



## Güncel özet (2026-05-01) — Profesyonel Altyapı Geçişi

Detaylı plan: `~/.claude/plans/bu-dosyaya-github-daki-concurrent-rabbit.md`. Geçiş özelliği koruyucu — kullanıcı görünür hiçbir davranış değişmedi.

### Eklenenler (kod değişikliği)

**Güvenlik (Faz 1):**
- `next.config.ts` security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS (prod), CSP (Report-Only modunda — soak için).
- `lib/utils/sanitize-html.ts` + `BlogDetailContent.tsx` ve `app/[locale]/admin/blog/actions.ts`: TipTap içeriği isomorphic-dompurify ile hem yazılırken hem render'da sanitize. `<script>`, inline event, `<iframe>` gibi tag'ler bloklanır; `<a target="_blank">` için `rel="noopener noreferrer"` zorunlu.
- `lib/rate-limit.ts` (in-memory) + `app/qr/[token]/[session]/actions.ts`'te `submitQrOrder` için 10 req/dak/IP limiti.
- `supabase/repair/` klasörü: migration 008 duplicate için repair script (prod'a uygulanmış olduğu için elle koşulması gerek; README.md adımları detaylı).

**Performans (Faz 3):**
- `next/dynamic` lazy load: `AddProductModal`, `PaymentModal`, `PaymentModalSimple` (3 parent'ta), `TiptapEditor` (BlogForm'da).
- `@next/bundle-analyzer` entegrasyonu + `npm run analyze` script'i.
- `next.config.ts` `compress`, `poweredByHeader: false`, image `formats: ['avif', 'webp']`.
- Eksik route boundary'leri: `app/[locale]/(public)/{blog,menu,contact}/{loading,error}.tsx`.
- `supabase/migrations/018_performance_indexes.sql`: composite ve partial indeksler (orders, reservations, kds, blog, payments).
- `scripts/optimize-images.mjs`: public/images sharp WebP+AVIF dönüşüm (manuel `npm run optimize:images`; sharp kullanıcı PC'sinde install gerek).

**TypeScript (Faz 4):**
- `tsconfig.json` strict flag'ler: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch` (production kodda aktif). Test dosyaları için `tsconfig.test.json` ayrıldı (gevşek).
- 4 yeni Zod şeması: `lib/validations/{order,dashboard,kds,site-settings}.schema.ts`.
- `lib/env.ts` (@t3-oss/env-nextjs): build-time env validation. Supabase client'ları (`server.ts`, `client.ts`, `admin.ts`) `process.env.X!` yerine `env.X` kullanıyor; `admin.ts`'e `'server-only'` import eklendi (yanlışlıkla client'a alınırsa build patlar).

**Tooling (Faz 5):**
- Husky + lint-staged: `.husky/pre-commit` (lint-staged) + `pre-push` (typecheck).
- `eslint-plugin-jsx-a11y` + `no-console` + `@next/next/no-img-element` kuralları (a11y warn, console error).
- Logger sertleştirme: prod'da yalnızca `error` çağrıları konsola düşer; `info`/`warn` sessiz.
- `.gitignore`: `lint_output*.txt`, `*.log`, IDE klasörleri eklendi; mevcut `lint_output*.txt` dosyaları silindi.
- `.github/workflows/ci.yml`: typecheck:test step + coverage artifact + Playwright report/trace artifact'leri + npm audit job.
- `.github/dependabot.yml`: haftalık dep güncelleme PR'ları, major bump'lar manuel.

**Test omurgası (Faz 2 — kısmi):**
- `__tests__/helpers/supabase-mock.ts`: ortak Supabase client mock factory.
- `__tests__/actions/`: orders, qr-session, blog için mock-based action testleri (3 dosya, 17 test geçti, 2 skipped TODO ile).
- `__tests__/unit/rate-limit.test.ts`, `sanitize-html.test.ts`, `validations/order.schema.test.ts`: 28 yeni unit test.
- `e2e/{reservations,kds,admin-menu,platform-orders}.spec.ts`: smoke test'ler hazır + happy path TODO skeleton'ları.
- `vitest.config.ts` coverage threshold: lines 75%, branches 70%, functions 75% (genel) + orders/qr-session actions için 85-90%.
- `__tests__/actions/README.md`: kalan 10 server action için test ekleme rehberi.

### Yapılmadı / kalan iş

- **Faz 6 (büyük dosya refactor)**: Test coverage tam değilken refactor riski yüksek olduğu için atlandı. HomeLanding (1049), AddProductModal (956), ProductForm (861), PaymentModal (749), ReservationsClient (716) hâlâ tek dosya. Test omurgası genişledikçe sırayla bölünmeli.
- **Server action testleri**: 13 modülün 3'ü (orders, blog, qr-session) tam, 10'u skeleton/README. Kalanlar için pattern hazır.
- **Component (RTL) testleri**: Mevcut 4 (BlogCard, KdsCard, KdsItemRow, ProductDetailSheet) korundu. Yeni eklenmedi (orders, reservations modüllerinde).
- **Migration 008 rename**: Prod'a uygulanmış olduğu için **elle yapılmalı** — `supabase/repair/README.md` adımları takip edin.
- **Image optimization**: `npm i -D sharp && npm run optimize:images` kullanıcı PC'sinde çalıştırılmalı.
- **`__tests__/unit/stores/qr-session.store.test.ts`** mevcut testlerinde 11 fail var — bizim değişikliklerimizden değil, store kodu ile test arasında uyumsuzluk (önceki commit'lerden gelen). Ayrı turda düzeltilmeli.
- **TypeScript strict flag'leri test dosyalarında kapalı** — test dosyalarındaki ~80 hata `tsconfig.test.json` ile ayrı tutuldu; ileride ayrı turda düzeltilebilir.
- **`lib/validations/qr.schema.ts`** Zod 4 strict UUID kullanıyor, mevcut prod akışı etkilemiyor olabilir ama kontrol edilmeli.

### Doğrulama (bu PC'de)

- `npm run typecheck` → ✅ 0 hata.
- `npm run lint` → ✅ 0 error, 67 warning (mevcut a11y + RHF Compiler — yeni eklenen kurallarla yakalandı).
- `npm test` → 340 passed, 11 failed (önceden var olan qr-session.store), 2 skipped (TODO).
- `npm run dev` / `npm run build` / `npm run test:e2e` → bu PC'de `.env.local` olmadığı için **çalıştırılamadı**; kullanıcı kendi PC'sinde doğrulamalı.



## Güncel özet (2026-04-12) — Ana Sayfa v3: Online Sipariş + Google Yorumlar + Gelişmiş İçerik

- **Açık/kapalı durumu kaldırıldı:** Hero bölümündeki status pill tamamen kaldırıldı.
- **Online sipariş bölümü eklendi:** Yemeksepeti, Getir, Trendyol Yemek ve Telefonla Sipariş kartları `#F5EFE0` zemin üzerinde platform renklerine uygun kartlarla tasarlandı; `orderEyebrow/Title/Subtitle/CallLabel/CallCta/CallNumber/platform*` i18n anahtarları eklendi.
- **Google Yorumlar bölümü eklendi:** Koyu yeşil (`#1A3524`) zemin üzerinde Google G logo, 4.8★ genel puan göstergesi, 3 yorum kartı (yıldız, italik metin, avatar, Google G) ve "Tüm Yorumları Gör" CTA'sı; `reviewsCta/reviewsRating/reviewsCount/reviewsSource` anahtarları eklendi.
- **Tüm metinler yeniden yazıldı:** Hero başlığı ve alt metni, özellik kartları, menü bölümü ve kapanış CTA'sı daha güçlü ve açık kopya ile yenilendi; TR + EN mesaj dosyaları güncellendi.
- **Hero görsel düzeni:** Status pill kaldırıldı; gradient katmanı iyileştirildi.
- **Menü kartları:** `placeholder-2.png` + `placeholder-1.png` kullanıldı (hero.png'dan farklı görsel çeşitliliği için).
- **Testler:** `npm run lint -- "components/modules/home/HomeLanding.tsx"` ✅

## Güncel özet (2026-04-12) — Ana Sayfa Komple Yeniden Tasarım v2

- **Tamamen farklı estetik:** `components/modules/home/HomeLanding.tsx` sıfırdan yeniden yazıldı; önceki iki sütunlu koyu hero + kart grubu yapısından tam ekran parallax hero + akıp giden ticker şeridine geçildi.
- **Full-viewport hero:** 100svh yüksekliğinde, parallax scroll efektli arka plan görseli; büyük bold serif başlık ekranın alt-sol alanında konumlandırıldı; açık/kapalı durum pill'i ve iki CTA aynı bölgede.
- **Scrolling ticker:** Marka değerlerini kaydıran yatay şerit (`hl-ticker-track` animasyonu) eklendi; `home.tickerItem1–5` i18n anahtarları tr.json ve en.json'a eklendi.
- **Yatay özellik şeridi:** Önceki üç kart kutusunun yerine yatay çizgilerle bölünmüş, ikonlu minimal özellik listesi oluşturuldu.
- **Tam boyutlu menü kartları:** Menü bölümünde overlay metin içeren tam-kaplama görsel kartlar kullanıldı; metin artık kartın altında değil üstünde yer alıyor.
- **Arkaplan:** `#FDFCF8` (sıcak beyaz) ana arka plan; warm stone `#EDE5D0` menü bölümü arka planı; koyu hero `#1A3524`.
- **Testler:** `npm run lint -- "components/modules/home/HomeLanding.tsx" "app/[locale]/(public)/page.tsx"` ✅

## Güncel özet (2026-04-12) — Ana Sayfa Sadeleştirme Turu

- **Yoğunluk azaltma:** `components/modules/home/HomeLanding.tsx` içindeki kalabalık hissi veren ara bloklar kaldırıldı; homepage akışı hero, tek güven bölümü, daha sade menü vitrini ve kompakt kapanış CTA'sına indirildi.
- **Section temizliği:** Yorumlar bölümü, ek story/signature panelleri, fazla status yüzeyleri ve üçüncü menü kartı kaldırılarak daha nefes alan bir düzen kuruldu.
- **Hero sadeleşmesi:** Hero içindeki bilgi kartları kompakt bir inline meta satırına dönüştürüldü; görsel alt panel de tek cümlelik daha sakin bir katmana çekildi.
- **Testler:** `npm run lint -- "app/[locale]/(public)/page.tsx" "components/modules/home/HomeLanding.tsx"` ✅

## Güncel özet (2026-04-12) — Ana Sayfa Modern Redesign

- **Tam yeniden kurgu:** `app/[locale]/(public)/page.tsx` artık eski çok parçalı home section zinciri yerine yeni `components/modules/home/HomeLanding.tsx` bileşenini kullanıyor; ana sayfa akışı modern cafe estetiğiyle baştan tasarlandı.
- **Yeni bilgi mimarisi:** Hero, güven kartları, signature standard bloğu, öne çıkan lezzetler, atmosfer + yorumlar ve kapanış CTA'sı olacak şekilde daha net ve daha az tekrarlı bir akış kuruldu.
- **Animasyon dili:** Framer Motion ile giriş geçişleri, scroll bağlı hero görsel hareketi, hover scale ve `Reveal` tabanlı section ritmi tek bir dilde toplandı.
- **i18n güncellemesi:** `i18n/messages/tr.json` ve `i18n/messages/en.json` altındaki `home` namespace'i yeni section içeriklerine göre yeniden yazıldı; görsel alt metinleri ve değerlendirme etiketleri de taşındı.
- **Navbar düzeltmesi:** Ana sayfada `PublicNavbar` artık `blogLabel` prop'unu da çeviriden alıyor.
- **Testler:** `npm run lint -- "app/[locale]/(public)/page.tsx" "components/modules/home/HomeLanding.tsx"` ✅

## Güncel özet (2026-04-12) — WhatsApp Widget Açılış Akışı

- **İlk açılış:** Public sayfa ilk yüklendiğinde balon doğrudan ürün mesajıyla başlamıyor; önce kısa bir `Hoş geldiniz.` mesajı gösteriliyor.
- **Geçiş ritmi:** Karşılama balonu kapandıktan sonra kısa bir bekleme eklenip ardından sayfaya özel ürün mesajları başlıyor; böylece yazılar peş peşe akmıyor.
- **Animasyon yavaşlatma:** Balon içi metin animasyonu ve bubble giriş/çıkış süreleri yavaşlatıldı; kelimeler daha sakin bir ritimle beliriyor.
- **Zamanlama:** Sayfa mesajlarının görünür kalma süresi uzun tutuldu ve mesajlar arasında daha geniş boşluk bırakıldı.
- **Testler:** `npm run lint -- "components/shared/WhatsAppFloatingButton.tsx"` ✅

## Güncel özet (2026-04-12) — Public 404 Sayfası

- **Yeni 404 deneyimi:** `components/shared/NotFoundPage.tsx` eklendi; Bolena renk paletine uyan, komik "glutene bulaşmış sayfa" temalı özel bir 404 ekranı tasarlandı.
- **Route entegrasyonu:** `app/[locale]/not-found.tsx` ve `app/not-found.tsx` eklendi; locale içi kayıp rotalarda özel sayfa gösteriliyor, kök fallback de Türkçe güvenli yönlendirme sunuyor.
- **Sadeleştirme / referans uyarlaması:** İlk tasarım geri çekildi; son turda yapı kullanıcı referansına yaklaştırıldı. Geometrik mint arka plan, merkezde rozet içi logo + yasak işareti, büyük yeşil başlık, kısa açıklama, vurgu satırı ve iki CTA ile daha afiş hissi veren bir 404 elde edildi.
- **i18n:** `i18n/messages/tr.json` ve `i18n/messages/en.json` içine `notFound` namespace'i eklendi; tüm yeni metinler mesaj dosyalarına taşındı.
- **Testler:** `npm run lint -- "app/not-found.tsx" "app/[locale]/not-found.tsx" "components/shared/NotFoundPage.tsx"` ✅

## Güncel özet (2026-04-12) — WhatsApp Widget İnce Ayar

- **Blog muafiyeti:** `components/shared/WhatsAppFloatingButton.tsx` içinde blog rotaları tamamen hariç tutuldu; blog liste ve yazı detay sayfalarında artık widget görünmüyor.
- **Yeni mikro metinler:** Ana sayfa, menü ve iletişim rotalarındaki balon içerikleri daha rafine ve yönlendirici cümlelerle yeniden yazıldı.
- **Zamanlama:** Balonun ekranda kalma süresi artık mesaj uzunluğuna göre dinamik hesaplanıyor; daha uzun cümleler daha uzun süre görünür kalıyor.
- **Animasyon:** Balon açıldığında metin kelime kelime, hafif blur/y ekseni geçişiyle görünür hale geliyor.
- **Testler:** `npm run lint -- "components/shared/WhatsAppFloatingButton.tsx"` ✅

## Güncel özet (2026-04-12) — Contact Sayfası Tekrar Temizliği

- **Tekrar temizliği:** `app/[locale]/(public)/contact/page.tsx` içindeki yinelenen hızlı iletişim paneli ve ikinci CTA kartı kaldırıldı; telefon, Instagram, adres, durum ve saat bilgileri tekil akışta bırakıldı.
- **Daha sade hiyerarşi:** Hero tek kolon akışa indirildi; durum ve bugünkü saat özeti hero içinde kompakt bilgi kartlarına dönüştürüldü.
- **Ek sadeleştirme:** Hero içindeki durum ve bugünkü saat özet kartları da kaldırılarak üst bölüm yalnız başlık, metin ve ana CTA'lara indirildi.
- **Hero temizlik:** Hero içindeki çağrı butonları ve öznitelik pill'leri de kaldırılarak üst alan yalnız başlık, kısa açıklama ve konum etiketiyle bırakıldı.
- **İçerik sadeleşmesi:** Sayfada aynı bilgiyi birden fazla kez gösteren bloklar kaldırılarak iletişim kartları + harita + çalışma saatleri yapısı korundu.
- **Testler:** `npm run lint -- "app/[locale]/(public)/contact/page.tsx"` ✅

## Güncel özet (2026-04-12) — Public WhatsApp CTA

- **Global public CTA:** `app/[locale]/(public)/layout.tsx` eklendi; public sayfaların sağ altına ortak WhatsApp kısayolu yerleştirildi. Admin ve QR alanları etkilenmedi.
- **Yeni bileşen:** `components/shared/WhatsAppFloatingButton.tsx` ile Bolena konseptine uygun yüzen WhatsApp butonu, per-route konuşma balonları ve sayfaya göre değişen hazır WhatsApp mesajları eklendi.
- **Sabitler / i18n:** `lib/constants/social.ts` içine WhatsApp sabitleri eklendi; `i18n/messages/tr.json` ve `i18n/messages/en.json` altında `whatsappWidget` namespace'i oluşturuldu.
- **UX:** Ana sayfa, menü, iletişim ve blog rotalarında farklı bağlamsal balon metinleri gösteriliyor; balonlar aralıklı şekilde belirip kayboluyor.
- **Testler:** `npm run lint -- "components/shared/WhatsAppFloatingButton.tsx" "app/[locale]/(public)/layout.tsx" "lib/constants/social.ts"` ✅ | `npm run typecheck` mevcut ilgisiz admin action tip hatalarına takıldı (`app/[locale]/admin/orders/actions.ts`, `app/[locale]/admin/reservations/actions.ts`)

## Güncel özet (2026-04-12) — Contact Sayfası Modern Redesign

- **Tam yeniden tasarım:** `app/[locale]/(public)/contact/page.tsx` editorial/luxury yönde yeniden kurgulandı; mobil öncelikli hero, yüzen iletişim kartları, premium hızlı erişim paneli ve daha güçlü CTA hiyerarşisi eklendi.
- **Bilgi mimarisi:** Harita, çalışma saatleri ve hızlı iletişim alanları daha net ayrıştırıldı; mobilde tek kolon akış korunurken geniş ekranlarda iki seviyeli asimetrik layout'a geçildi.
- **UX detayları:** Açık/kapalı durumu ve bugünkü servis saati hero içinde daha görünür hale getirildi; telefon, Instagram ve konum aksiyonları hem üst panelde hem kart şeridinde erişilebilir hale getirildi.
- **Testler:** `npm run lint -- "app/[locale]/(public)/contact/page.tsx"` ✅

## Güncel özet (2026-04-12) — Public Menü Hero / Nav Yenileme

- **Hero tasarımı:** `components/modules/menu/MenuHero.tsx` üst alanı editorial/luxury bir dil ile yenilendi; katmanlı gradient, grid texture, glow orb, yeni tipografi ritmi ve badge paneli eklendi.
- **Kategori navigasyonu:** `components/modules/menu/MenuDisplay.tsx` içindeki kategori şeridi yüzen pill-container tasarımına çevrildi; hero ile görsel olarak birleşen, ortalanmış ve sticky çalışan daha güçlü bir üst navigasyon elde edildi.
- **Görsel hiyerarşi:** Menü içerik kökü hero alt geçişine hafif overlap ile bağlandı; ardından ikinci turda category başlık numaraları kaldırıldı ve hero → kategori barı geçişi daha yumuşak gradient/blur köprüsüyle rafine edildi.
- **Testler:** `npx tsc --noEmit` ✅ | dosya lint kontrolleri ✅

## Güncel özet (2026-04-11) — Contact Sayfası UI Yenileme

- **UI yenileme:** `app/[locale]/(public)/contact/page.tsx` baştan tasarlandı; mobil öncelikli hero, hızlı iletişim kartları, iyileştirilmiş harita bloğu ve daha okunaklı çalışma saatleri bölümü eklendi.
- **Temizlik:** Sayfadaki locale'e bağlı hardcoded CTA metinleri kaldırıldı; tüm yeni etiketler `contact` i18n namespace'ine taşındı.
- **i18n:** `i18n/messages/tr.json` ve `i18n/messages/en.json` altında `locationTag`, `statusLabel`, `quickContactTitle`, `hoursHint`, `mapHeading`, `venueName`, `today` anahtarları eklendi.
- **Erişilebilirlik/UX:** Mobilde tek kolon, tablette/kapsamlı ekranlarda kademeli grid; harita başlığı + aksiyon butonu üst barla netleştirildi.
- **Testler:** `npm run lint -- "app/[locale]/(public)/contact/page.tsx"` ✅

## Güncel özet (2026-04-11) — Blog Modülü

- **Veritabanı:** `supabase/migrations/015_blog.sql` — `blog_posts` tablosu + RLS (anon: yayınlanmış okuma, authenticated: tam erişim).
- **Tipler:** `types/database.types.ts` blog_posts eklendi; `types/index.ts` — `BlogPost` interface + MODULES'a `'blog'`.
- **Lib:** `lib/validations/blog.schema.ts`, `lib/queries/blog.queries.ts`.
- **Admin:** `app/[locale]/admin/blog/` (page, loading, new, [id]/edit, actions.ts).
- **Admin bileşenler:** `components/modules/blog/` — `TiptapEditor` (WYSIWYG + Supabase inline image upload), `BlogForm` (TR/EN tab + kapak resmi + SEO), `BlogClient` (TanStack Query tablo).
- **Public:** `app/[locale]/(public)/blog/page.tsx` + `[slug]/page.tsx` — SSR + `generateMetadata` + OG + Twitter Card + JSON-LD Article.
- **Public bileşenler:** `BlogListSection`, `BlogCard`, `BlogDetailContent`, `BlogJsonLd`.
- **Navigasyon:** `PublicNavbar` Blog linki; `SidebarContent` admin Blog linki (BookOpen ikonu).
- **i18n:** `blog.*` + `nav.blog` namespace'leri tr.json + en.json'a eklendi.
- **Testler:** `__tests__/unit/validations/blog.schema.test.ts` 15/15 ✅ | `__tests__/components/blog/BlogCard.test.tsx` 14/14 ✅ — toplam 29 test.
- **Paketler:** `@tiptap/react` + 8 extension (`starter-kit`, `extension-image`, `extension-link`, `extension-placeholder`, `extension-text-align`, `extension-underline`, `extension-color`, `extension-text-style`) kuruldu.

## Önceki özet

- **KDS detay sheet iyileştirmesi (2026-04-11):** `components/modules/kds/KdsDetailSheet.tsx` içinde ürün tıklayınca açılan panel genişletildi; varsayılan üst köşe kapatma butonu kaldırılıp ayrı üst bara taşınarak header aksiyonlarıyla çakışma giderildi. Gömülü sipariş ekranlarında aksiyon yerleşimi sheet genişliğine uyarlandı; `KdsItemRow` ve `OrderItemList` not alanları etiketli ve daha okunur kartlara dönüştürüldü.
- **QR Menu UI yenileme (2026-04-11):** `components/modules/qr/` altında `QrOrderScreen`, `QrMenuTab`, `QrProductCard`, `QrCategoryPills`, `QrBottomNav`, `QrCartTab`, `QrLocaleToggle` yeniden tasarlandı.
- **Kullanisabilirlik:** Arama, daha belirgin sticky hero, ozet kartlari, liste tabanli daha okunakli urun kartlari ve yenilenmis cart ozeti eklendi.
- **i18n:** `i18n/messages/tr.json`, `i18n/messages/en.json` QR arama ve yeni UI etiketleriyle guncellendi.
- **QR ince ayar (2026-04-11):** Sticky banner arka plan davranisi sadeletildi; kategori pill'lerine yatay kaydirma oklari eklendi; `Tumu` gorunumunde urunler kategori bloklariyla siralandi.
- **Sheet + cart iyilestirmeleri:** Urun sheet'inde ana fiyat/kampanyali fiyat ayrimi, `Alerjenler:` etiketi, `Sepete ekle` ve `Hizli al (Mutfaga ilet)` CTA'lari; direct order cift toast sorunu giderildi. Cart tarafinda loading gostergesi, sadece iletilmeyen sepet odagi ve toplam sepet tutari ozetine gecildi.
- **QR ikinci ince ayar (2026-04-11):** Kategori ok ikonalari kaldirildi; `Tumu` secenegi yerine kategori pill'leri scroll-sync anchor yapisina cevrildi. Product sheet fiyat alani sadeletildi, `Hizli al` kisa CTA'ya indirildi ve close animasyonu korundu. Cart loading durumu skeleton kartlarla iyilestirildi.
- **Testler:** `npm run lint -- components/modules/qr/...` ✅ | `npm run typecheck` repo icindeki mevcut ilgisiz action type hatalarina takildi (`app/[locale]/admin/orders/actions.ts`, `app/[locale]/admin/reservations/actions.ts`).

- **QR masa siparişi:** `app/qr/[token]/`, `components/modules/qr/`, anon RLS + SECURITY DEFINER RPC'ler (`013`, `014` migration).
- **Site ayarları / QR yönetimi:** `app/[locale]/admin/site-settings/`, `components/modules/site-settings/`.
- **Lib:** `lib/stores/qr-session.store.ts`, `lib/queries/qr.queries.ts`, `lib/queries/site-settings.queries.ts`, `lib/validations/qr.schema.ts`.
- **Diğer:** `proxy.ts` — `/qr/` bypass; `types/index.ts` — `TableWithQr`, `SiteSetting`, `QrCartItem`, `module_permissions` içinde `site-settings`.
- **Testler:** `qr-session.store.test.ts`; E2E `e2e/qr-ordering.spec.ts`.

> Eski oturum günlükleri bilerek burada tutulmuyor; ayrıntı için `git log` / PR geçmişi.

## Açık sorunlar

- **Atomik olmayan işlemler (bilinen risk):** Bazı action'larda `addOrderItem` + `decrement_stock` sırası tam atomik değil. Kalıcı çözüm: migration `010` RPC'lerinin DB'de aktif olması ve action katmanının bu RPC'lere geçmesi.

## Modül durumu (özet)

| Modül | Durum | Not |
|------|--------|-----|
| Auth, kullanıcılar, menü, ekstralar | Tamam | Unit testler mevcut |
| Masalar, sipariş, rezervasyon, platform | Tamam | Ortak `orders` + order UI |
| Çalışma saatleri, public site | Tamam | |
| Dashboard, raporlar, KDS | Tamam | |
| QR + site ayarları | Tamam | Anon akış + admin yönetimi |
| Blog | Tamam | Tiptap WYSIWYG, SEO, çift dilli |

**Komutlar:** `npm run test`, `npm run typecheck`, `npm run ci:verify`

## Güncelleme şablonu

```markdown
## YYYY-MM-DD — Kısa başlık
- Ne değişti (dosya / migration)
**Testler:** …
**Not:** …
```

Modülü tamamlanmış saymak için test ve (gerekiyorsa) ilgili E2E şart.
