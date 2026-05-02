# Profesyonel Altyapı Geçişi — Uygulayanın Yapması Gerekenler

Bu doküman, kullanıcının kendi PC'sinde (`.env.local` ile) yapması gereken adımları özetler.

## 1. Bağımlılıkları kur (zorunlu)

```bash
npm install
```

Bu PC'de zaten yüklendi ama `package-lock.json` commit'lendiğinde başka bir makinede `npm ci` ile aynı versiyon zinciri sağlanır.

## 2. Husky hook'larını aktive et

```bash
npm run prepare
# veya
npx husky
```

Bu, `.husky/pre-commit` ve `.husky/pre-push` hook'larını git'e bağlar. Bundan sonra:
- Her commit öncesi `lint-staged` (eslint --fix) çalışır.
- Her push öncesi `npm run typecheck` çalışır.

## 3. CSP'yi production'da Report-Only → Enforce'a geçir

`next.config.ts`'te şu an:
- **Development**: `Content-Security-Policy` (zorunlu) — dev'te uyumsuzluk fark edilir.
- **Production**: `Content-Security-Policy-Report-Only` (sadece raporla, bloklama).

1 hafta production trafiğinde browser console'unu izleyin (CSP report aldığınız bir endpoint koymadıysanız bu manuel). Hiç engelleme yoksa:

```ts
// next.config.ts içindeki securityHeaders'ta:
key: isProd ? 'Content-Security-Policy' : 'Content-Security-Policy',
// veya isProd kontrolünü tamamen kaldır
```

## 4. Migration 008 duplicate'ı temizle (opsiyonel ama önerilir)

Prod'a uygulanmış olduğu için kod değil, manuel:

1. `supabase/repair/README.md`'i oku.
2. **Önce branch DB'de** test et: `repair-001-rename-008-menu-campaigns.sql` çalıştır.
3. Sonra dosyayı rename et: `git mv supabase/migrations/008_menu_campaigns.sql supabase/migrations/009_menu_campaigns.sql`.
4. Eğer `009_campaign_targeting.sql` ile çakışırsa README'deki Çözüm A veya B'yi uygula.
5. Branch DB'de `supabase migration list` ile teyit et.
6. Prod'a uygula.

## 5. Performance indekslerini prod'a uygula

Yeni migration `supabase/migrations/018_performance_indexes.sql` Supabase CLI ile push edildiğinde otomatik çalışır:

```bash
supabase db push
```

Tüm `CREATE INDEX IF NOT EXISTS` — re-run güvenli.

## 6. Image optimizasyonu çalıştır

```bash
npm i -D sharp
npm run optimize:images
```

`public/images/` altındaki >50KB görseller WebP + AVIF olarak yan yana üretilir (orijinal `.png`/`.jpg` korunur). `bolena_logo.png` (392KB), menu placeholder'lar (~750KB×3) önemli ölçüde küçülür.

Bileşenlerde `<picture>` ile WebP/AVIF servis etmek için ayrı bir refactor turu gerekir; Next `<Image>` zaten `formats: ['avif', 'webp']` config'i ile otomatik bunları tercih eder.

## 7. `.env.local` kontrolü

`@t3-oss/env-nextjs` artık build sırasında env'leri valide ediyor. Eksik/yanlış olursa build patlar. Gerekli env'ler:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=https://...    # opsiyonel
```

CI ve test ortamı için `SKIP_ENV_VALIDATION=true` set etmek yeterli — workflow'ta zaten ayarlandı.

## 8. Bundle analizi

```bash
npm run analyze
```

Build tamamlandığında otomatik `analyze.html` açılır. Public sayfalarda First Load JS hedefi: **<150KB**. Admin sayfalarda: **<300KB**. Aşan sayfalar için ek dynamic import gerekebilir.

## 9. CI'de branch protection ayarla (GitHub Settings)

GitHub repo Settings → Branches → `main`:
- "Require pull request reviews" ✓ (1 approval)
- "Require status checks to pass":
  - `quality` (lint + typecheck + tests)
  - `audit` (npm audit)
  - `e2e-smoke` (PR'da)
- "Require branches to be up to date" ✓
- "Do not allow bypassing the above settings" ✓

## 10. Atlanan / sonraya bırakılan işler

| İş | Neden | Sonraki adım |
|-----|-------|--------------|
| Faz 6 büyük dosya refactor | Test coverage tam değilken risk yüksek | Önce 13 server action testini tamamla, sonra dosya başına RTL testi yaz, sonra refactor |
| Test'lerde TS strict | 80+ hata, çok zaman alır | `tsconfig.test.json`'da flag'leri tek tek aç, hataları düzelt |
| `qr-session.store` 11 test fail | Önceki commit'lerden, bizim değişikliğimiz değil | Store API'si ile test fixture'ı arasındaki uyumsuzluk düzeltilmeli |
| Server action testlerinin kalan 10'u | Süre | `__tests__/actions/README.md` template'i kullanılarak teker teker eklenir |
| Sentry/Datadog logger entegrasyonu | Hesap gerekir | `lib/utils/logger.ts`'te `reportError` TODO yorumu var |
| Upstash Redis rate limit | Hesap istenmedi | Şu an in-memory; Vercel multi-region'da yetmez. Hesap açılınca `lib/rate-limit.ts`'i `@upstash/ratelimit` ile değiştir (API yüzeyi aynı) |

## 11. PR açma checklist'i (CLAUDE.md ekle)

Her PR'da kontrol:

- [ ] `npm run lint` 0 error
- [ ] `npm run typecheck` 0 error
- [ ] `npm run test` tüm yeşil + coverage threshold sağlandı
- [ ] Yeni server action varsa: `__tests__/actions/<modul>.test.ts` eklendi mi?
- [ ] Yeni Zod schema varsa: `lib/validations/<modul>.schema.ts`'de mi?
- [ ] Yeni route varsa: `loading.tsx` + `error.tsx` boundary?
- [ ] DB schema değişti mi: yeni migration eklendi mi?
- [ ] Bundle bütçesi aşıldı mı: `npm run analyze` ile kontrol
