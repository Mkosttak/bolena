# Benim Yapacaklarım — Adım Adım Kılavuz

> Bu doküman, Claude'un kod tarafında tamamladığı geçişten sonra **senin elle yapman gereken** işleri sırasıyla, neden gerekli olduğunu ve nasıl yapılacağını açıklar.
>
> Her bölüm şu yapıdadır:
> - **🎯 Hedef** — bu adım ne yapacak
> - **❓ Neden** — niye gerekli, atlarsam ne olur
> - **🛠️ Nasıl** — komut komutuna adımlar
> - **✅ Doğrulama** — başarı nasıl anlaşılır
> - **🚨 Sorun olursa** — olası hata + çözüm

**Kullanım:** Sırayla yap. Bir adımı atlamadan ilerle. Her adımdan sonra "Doğrulama" kısmındaki komutu koş — yeşilse bir sonrakine geç.

**Tahmini toplam süre:** 2-4 saat (bekleme + işlem). Tek oturuma sığar.

---

## Sıralama özeti

| # | İş | Süre | Kritik mi? |
|---|----|------|-----------|
| 1 | `.env.local` kur | 5 dk | ✅ Zorunlu |
| 2 | `npm install` + smoke test | 15 dk | ✅ Zorunlu |
| 3 | Husky hook'larını aktif et | 2 dk | Önerilir |
| 4 | Migration 008 duplicate'i temizle | 30 dk | Önerilir (fragility) |
| 5 | Performance + idempotency migration'larını prod'a uygula (018 + 019) | 5 dk | ✅ **Zorunlu** |
| 6 | Supabase tip dosyasını yeniden generate et | 5 dk | ✅ **Zorunlu** (019 sonrası) |
| 7 | İlk commit + GitHub'a push | 10 dk | ✅ Zorunlu |
| 8 | GitHub branch protection ayarla | 10 dk | ✅ Önemli |
| 9 | KVKK cookie consent banner ekle | 1-2 saat | ✅ **Yasal** |
| 10 | Privacy Policy + Terms of Service sayfaları | 2-4 saat | ✅ **Yasal** |
| 11 | Production build doğrulama (`npm run build`) | 10 dk | ✅ Zorunlu |
| 12 | Vercel/host deployment + ortam değişkenleri | 30 dk | ✅ Zorunlu |
| 13 | Health endpoint'i monitör'e bağla | 10 dk | Önerilir |
| 14 | CSP Report-Only → Enforce geçişi | 1 hafta soak | Önerilir |
| 15 | Sentry hesabı | 30 dk | Önerilir |
| 16 | Müşteri PII şifreleme (encryption at rest) | Sprint | Önerilir (KVKK) |
| 17 | Faz 6 refactor | Sprint | İleride |

---

# 1. `.env.local` dosyasını kur

## 🎯 Hedef
Bu PC'de Supabase'e bağlanıp `npm run dev`, `npm test`, `npm run build` komutlarını çalıştırabilir hale gelmek.

## ❓ Neden
- Supabase URL ve anahtarlar olmadan uygulama hiçbir veri çekemez. Login, menü, sipariş — hepsi bağlantı gerektirir.
- `@t3-oss/env-nextjs` artık build sırasında env'leri kontrol ediyor. Eksik env varsa **build patlar** (eskiden runtime'da patlardı; şimdi erkenden yakalanır).
- Test'lerde `SKIP_ENV_VALIDATION=true` ile atlanabilir, ama **gerçek kullanım için zorunlu**.

## 🛠️ Nasıl

### Adım 1.1: Diğer PC'nden veya Supabase dashboard'dan değerleri al

Diğer PC'nde proje varsa, oradaki `.env.local` dosyasını **şifreli kanaldan** (KeePass, 1Password, Signal — **email/whatsapp DEĞİL**) bu PC'ye kopyala.

Yoksa Supabase Dashboard'dan al:
1. https://supabase.com/dashboard adresine git
2. `bolena2` projesini seç (project ID: `guuqyqtcmlijhlvcblyh`)
3. Sol menüden **Settings** → **API**
4. Şu üç değeri kopyala:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ **bu ÇOK gizli**, repo'ya commit ETME, .env'de tut)

### Adım 1.2: Dosyayı oluştur

**En kolay:** `.env.example` dosyasını şablon olarak kopyala:

```bash
cp .env.example .env.local
```

Sonra dosyayı aç, `your-project-id` ve `eyJ...` placeholder'larını gerçek değerlerle değiştir.

Manuel olarak yazmak istiyorsan, proje kök dizininde (`C:\Users\Murat KOSTAK\Desktop\murat\`) `.env.local` adında bir dosya oluştur. İçeriği:

```env
# Public — tarayıcıya da iner, sızıntı sorun değil
NEXT_PUBLIC_SUPABASE_URL=https://guuqyqtcmlijhlvcblyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Server-only — KESİNLİKLE tarayıcıya inmemelidir
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp...
```

`...` yerine adım 1.1'den aldığın gerçek değerleri yapıştır.

### Adım 1.3: `.gitignore`'da olduğunu doğrula

`.gitignore` zaten `.env*` satırını içeriyor — yanlışlıkla commit'lenmesi engellendi. Yine de:

```bash
git check-ignore -v .env.local
```

Çıktı şöyle olmalı (anlamı: dosya ignore listesinde):

```
.gitignore:36:.env*    .env.local
```

## ✅ Doğrulama

```bash
ls -la .env.local
```

Dosyanın varlığı görünmeli, boyutu birkaç yüz byte olmalı.

## 🚨 Sorun olursa
- **"command not found: ls"** → Bash kullanıyorsun ama Windows. `dir .env.local` çalışır (PowerShell) veya Git Bash aç.
- **`.env.local` zaten var** → İçindekileri override etme; karşılaştır, eksik anahtarları ekle.
- **Anahtarın yanlış olduğunu nasıl anlarım?** → Sonraki adımda `npm run dev` patlarsa, hata mesajı eksik/yanlış env'i söyler.

---

# 2. `npm install` + smoke test

## 🎯 Hedef
- Tüm node modüllerinin doğru kurulu olduğunu doğrula
- Geliştirme sunucusunu ayağa kaldır
- Ana akışların hâlâ çalıştığını gözle gör

## ❓ Neden
- Yeni paketler (husky, dompurify, t3-env, sharp, vs.) eklendi. `npm install` olmadan eski lock dosyası çalışır.
- Geçişin **özellik koruyucu** olduğu sözünü gözle teyit etmek lazım — sayfalar bozulmuş olabilir mi diye.

## 🛠️ Nasıl

### Adım 2.1: Bağımlılıkları kur

```bash
cd "C:\Users\Murat KOSTAK\Desktop\murat"
npm install
```

Beklenen süre: 1-3 dakika. Çıktıda "added X packages" görmelisin. Sonunda `5 vulnerabilities` gibi uyarılar normal — şu an kritik değil, dependabot otomatik PR atacak (bkz. Adım 7).

### Adım 2.2: Tip kontrol + lint

```bash
npm run typecheck
npm run lint
```

Beklenen:
- `typecheck` → çıktı yok (= 0 hata) ✅
- `lint` → "0 errors, 56 warnings" — error yoksa OK ✅

### Adım 2.3: Test'leri koş

```bash
npm test
```

Beklenen son satır:

```
Test Files  34 passed (34)
     Tests  400 passed | 1 skipped (401)
```

### Adım 2.4: Geliştirme sunucusunu ayağa kaldır

```bash
npm run dev
```

`http://localhost:3000` açılmalı. Aşağıdaki **smoke test'i** sırayla yap:

#### Public site smoke (5 dk)
1. **Ana sayfa** http://localhost:3000/tr → ana sayfa açıldı, görseller yüklendi mi?
2. **Menü** http://localhost:3000/tr/menu → ürünler listelendi mi?
3. **Blog** http://localhost:3000/tr/blog → yazılar listelendi, bir tanesine tıkla → açıldı mı?
4. **Contact** http://localhost:3000/tr/contact → 3 panel görünüyor mu? Her birine tıkla — açılıyor mu?
5. **Resimler** → bolena_logo, menu görseli — Network sekmesinde `image/avif` content-type ile geliyor mu? (Eğer geliyorsa Sharp optimizasyonu çalıştı demektir.)

#### Admin smoke (10 dk)
1. **Login** http://localhost:3000/tr/login → giriş yap.
2. **Tablolar** /tr/admin/tables → masa açılıyor mu? Bir masaya bas → sipariş ekran açıldı mı?
3. **Sipariş** Bir ürün ekle → modal açılıyor mu? Ürün listesi geliyor mu? Ekle → siparişe yansıdı mı?
4. **Ödeme** Ödeme al → ödeme modal'ı açılıyor mu? Test ödemesi al → kapat.
5. **KDS** /tr/admin/kds → sipariş kalemi görünüyor mu? Hazırlandı işaretle → kalktı mı?
6. **Reservation** /tr/admin/reservations → liste yüklendi mi?
7. **Reports** /tr/admin/reports → grafikler 1-2 saniye gecikme ile yükleniyor mu? (Yeni eklenen lazy load.)
8. **Blog admin** /tr/admin/blog → editor açılıyor mu? (TipTap lazy load — kısa gecikme normal.)

## ✅ Doğrulama

Tüm akışlar bozulmadan çalıştı → ✅ geçiş başarılı.

## 🚨 Sorun olursa

| Hata | Sebep | Çözüm |
|------|-------|-------|
| `Invalid environment variables: ...` | `.env.local` eksik veya yanlış | Adım 1'i tekrar yap, anahtarları kontrol et |
| `module not found: sharp` | `npm install` tamamlanmadı | `rm -rf node_modules && npm install` |
| Sayfa açılıyor ama veri yok | Supabase URL yanlış veya RLS engelliyor | Browser console + Network sekmesinde 401/403 var mı? |
| Görseller `image/png` content-type ile geliyor | Browser AVIF cache'de değil | DevTools → Network → "Disable cache" kutusunu işaretle, F5 |
| KDS realtime çalışmıyor | Supabase realtime enabled değil | Supabase Dashboard → Database → Replication → tablo listesi kontrol |

---

# 3. Husky hook'larını aktive et

## 🎯 Hedef
`git commit` öncesi otomatik lint, `git push` öncesi otomatik typecheck çalışsın.

## ❓ Neden
- Kötü kod (lint error, type error) **commit'lenemesin** — herkesin tarihçesi temiz kalır.
- CI'da fail olmadan, daha lokal'de fark edilsin.
- Bu PC'de Claude tarafından zaten kuruldu, ama git config'de hook path'i set edilmiş olabilir veya olmayabilir.

## 🛠️ Nasıl

```bash
cd "C:\Users\Murat KOSTAK\Desktop\murat"
git init       # Eğer git henüz init edilmediyse (zaten edildi muhtemelen)
npx husky      # Hook'ları .git/hooks'a bağlar
```

## ✅ Doğrulama

```bash
git config core.hooksPath
```

Çıktı: `.husky/_` olmalı.

```bash
ls -la .husky/_
```

İçinde `pre-commit`, `pre-push`, `applypatch-msg` vb. dosyalar olmalı.

**Test et:**

```bash
echo "// test" >> README.md
git add README.md
git commit -m "test: husky"
```

Commit öncesi `lint-staged` çıktısı görmelisin. Eğer lint hatası olsaydı commit reddedilirdi.

```bash
git reset HEAD~1   # test commit'i geri al
```

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| `husky: command not found` | `npm install` eksik, tekrar koş |
| `not a git repository` | `git init` yap |
| Pre-commit hook çalışmıyor | `git config core.hooksPath` boş döndü → `npx husky` tekrar koş |

---

# 4. Migration 008 duplicate'i temizle

## 🎯 Hedef
İki dosyanın `008_` prefix'i ile başlamasını düzelt; `008_menu_campaigns.sql` → `009_menu_campaigns.sql`.

## ❓ Neden
- Bugün **çalışıyor** (Supabase alfabetik sıralayıp ikisini de uyguluyor).
- Ama "fragility": yeni bir geliştirici aynı numarayı kullanırsa, sıralama bozulur.
- Code review'da `008` iki kez görünmesi profesyonel değil.
- **Bu adım opsiyonel** — yapmasan zarar yok, ama yapmak hijyen.

## 🛠️ Nasıl

⚠️ **ÖNCE STAGING/BRANCH DB'DE TEST ET. PROD'DA DİREKT KOŞMA.**

### Adım 4.1: Supabase Branch DB oluştur

1. Supabase Dashboard → projenin → **Settings** → **Branching**
2. "Create Branch" → ad: `migration-008-fix`
3. Branch DB ayağa kalkar (1-2 dakika).

### Adım 4.2: Repair script'ini branch DB'de koş

`supabase/repair/repair-001-rename-008-menu-campaigns.sql` dosyasını aç. SQL Editor'da branch DB'ye karşı çalıştır:

```sql
BEGIN;

-- Mevcut durum kontrolü
SELECT version FROM supabase_migrations.schema_migrations
WHERE version LIKE '008%' OR version LIKE '009%'
ORDER BY version;

-- Asıl güncelleme
UPDATE supabase_migrations.schema_migrations
SET version = '009_menu_campaigns'
WHERE version = '008_menu_campaigns';

-- Doğrulama
SELECT version FROM supabase_migrations.schema_migrations
WHERE version LIKE '008%' OR version LIKE '009%'
ORDER BY version;

COMMIT;
```

### Adım 4.3: Lokalde dosyayı rename et

```bash
git mv supabase/migrations/008_menu_campaigns.sql supabase/migrations/009_menu_campaigns.sql
```

⚠️ Eğer mevcut `009_campaign_targeting.sql` ile çakışırsa onu da `010_campaign_targeting.sql`'e taşı ve `schema_migrations`'da aynı UPDATE'i koş.

### Adım 4.4: Branch DB'de doğrula

```bash
npx supabase migration list --db-url "postgresql://..."
```

Liste düzenli sıralı olmalı, duplicate yok.

### Adım 4.5: Prod'a uygula

Branch DB'de her şey OK ise:

1. Supabase Dashboard → branch'i **merge** et veya
2. SQL Editor'ı **production** projesine geç → aynı UPDATE'i koş.

## ✅ Doğrulama

```sql
SELECT version FROM supabase_migrations.schema_migrations
WHERE version LIKE '008%' OR version LIKE '009%';
```

Beklenen sonuç:
```
008_increment_stock
009_campaign_targeting
009_menu_campaigns      -- veya 010_menu_campaigns
```

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| Branch DB merge ederken çakışma | Branch'i kapat, prod'da elle UPDATE koş |
| `relation "supabase_migrations.schema_migrations" does not exist` | Tablo adı projeye göre farklı; Supabase Studio → "Database" → "Tables" → "supabase_migrations" namespace altında ara |
| Migration tekrar çalışmaya kalktı (deploy patladı) | Rollback: `supabase/repair/repair-001-rollback.sql`'i koş |

---

# 5. Performance + idempotency migration'larını prod'a uygula

## 🎯 Hedef
İki yeni migration'ı production'a uygula:
- `018_performance_indexes.sql` — sık sorgular için 8 index
- `019_production_hardening.sql` — payment idempotency UNIQUE, reservation çakışma constraint, audit_log iskeleti

## ❓ Neden
- **018:** Sık çalışan sorgular için 8 yeni composite/partial index. Tüm `IF NOT EXISTS` — idempotent.
- **019:** Production hardening:
  - `payments.idempotency_key` + UNIQUE → ödeme duplicate kesin koruma
  - `reservations` UNIQUE constraint → aynı masa/tarih/saat çakışmasını engelle
  - `orders.completed_at + status` CHECK constraint → veri tutarlılığı
  - `audit_log` tablosu + RLS → kritik işlemleri izlemek için iskelet

## 🛠️ Nasıl

### Adım 5.1: Migration'ı kontrol et

```bash
cat supabase/migrations/018_performance_indexes.sql
```

İçerik 8 `CREATE INDEX` ve `ANALYZE` deyimi olmalı. Hepsi `IF NOT EXISTS` — zarar vermez.

### Adım 5.2: Branch DB'de test et (önerilir)

Adım 4.1 gibi bir branch oluştur, oraya push et:

```bash
npx supabase db push --db-url "postgresql://branch-url..."
```

Hata yoksa devam.

### Adım 5.3: Prod'a uygula

```bash
npx supabase db push
```

Ya da Supabase Dashboard → SQL Editor → migration dosyasının içeriğini yapıştır → **Run**.

## ✅ Doğrulama

Supabase SQL Editor'da:

```sql
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_orders_%'
   OR indexname LIKE 'idx_reservations_%'
   OR indexname LIKE 'idx_blog_posts_%'
ORDER BY indexname;
```

Beklenen yeni indeksler listede görünmeli (örneğin `idx_orders_table_status`, `idx_blog_posts_published_at_desc`, vb.).

### Adım 5.4: Supabase tip dosyasını yeniden generate et

⚠️ **019 sonrası kritik:** `payments.idempotency_key` kolonu eklendi. Tip dosyasını güncellemezsen kod cast'lerle çalışıyor; düzgün tip için:

```bash
npx supabase gen types typescript --project-id guuqyqtcmlijhlvcblyh > types/database.types.ts
```

Sonra `app/[locale]/admin/orders/actions.ts` içindeki `as never` cast'lerini kaldırabilirsin (typecheck zaten geçecek, ama temiz tip için).

### Adım 5.5: Performance ölçümü (opsiyonel)

Index öncesi/sonrası karşılaştırma:

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE table_id = 'xxx' AND status = 'active';
```

`Index Scan using idx_orders_table_status` görmelisin (`Seq Scan` değil) — bu indexin kullanıldığı anlamına gelir.

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| `relation "blog_posts" does not exist` | `015_blog.sql` henüz prod'a uygulanmadı; önce o |
| `column "table_id" does not exist` | Şema değişmiş; migration dosyasını proje şemasına göre düzenle |
| Disk dolu | İndeks oluşturma ek yer ister; küçük index'ler için sorun olmaz ama büyük tablo için Supabase pro upgrade |

---

# 6. İlk commit + GitHub'a push

## 🎯 Hedef
Geçişte yapılan tüm değişiklikleri GitHub'da `main` branch'e (veya bir feature branch'e) yansıt.

## ❓ Neden
- Şu ana kadar tüm değişiklikler **sadece bu PC'de**. Push edilmeden başka makineye geçmez, CI tetiklenmez.
- Aşağıdaki adım 7 (branch protection) için PR akışı kurmak lazım.

## 🛠️ Nasıl

### Adım 6.1: Durumu gör

```bash
git status
```

Çok dosya değişmiş olmalı (~30-40 dosya). Yeni dosyalar:
- `lib/env.ts`, `lib/rate-limit.ts`, `lib/utils/sanitize-html.ts`
- `lib/validations/{order,dashboard,kds,site-settings}.schema.ts`
- `__tests__/actions/*`, `__tests__/components/orders/*`, `__tests__/helpers/*`
- `e2e/{reservations,kds,admin-menu,platform-orders}.spec.ts`
- `app/[locale]/(public)/{blog,menu,contact}/{loading,error}.tsx`
- `supabase/migrations/018_performance_indexes.sql`
- `supabase/repair/*`
- `scripts/optimize-images.mjs`
- `public/images/*.{webp,avif}` (yeni format'lar)
- `docs/{UPGRADE_NOTES,BENIM_YAPACAKLARIM}.md`
- `.husky/*`, `.github/dependabot.yml`

Değişen dosyalar:
- `next.config.ts`, `tsconfig.json`, `tsconfig.test.json`, `package.json`, `package-lock.json`
- `eslint.config.mjs`, `vitest.config.ts`
- Birkaç production kod dosyası (logger, schemalar, supabase client'lar, vs.)

### Adım 6.2: Feature branch aç (önerilir)

`main`'e direkt push yerine PR açmak daha güvenli:

```bash
git checkout -b chore/professional-infra-upgrade
```

### Adım 6.3: Stage + commit

```bash
git add .
git status   # bir kez daha kontrol — .env.local, node_modules listesinde OLMAMALI
```

Eğer `.env.local` listede görünüyorsa `git rm --cached .env.local` koş ve `.gitignore` kontrol et.

```bash
git commit -m "chore: professional infrastructure upgrade

- Security: CSP+headers, XSS sanitize, rate limiter, Supabase server-only marker
- Tests: 8 server action test files (50 tests), 3 RTL component tests, queue helper
- Performance: 11 dynamic imports (modals + recharts), AVIF/WebP assets (-90%),
  8 composite/partial DB indexes, bundle analyzer
- TypeScript: noUncheckedIndexedAccess + 2 more strict flags, 4 missing Zod schemas,
  t3-env validation
- Tooling: husky + lint-staged, jsx-a11y eslint, structured production logger,
  dependabot, expanded CI workflow

See docs/PROGRESS.md and docs/UPGRADE_NOTES.md for details.
See docs/BENIM_YAPACAKLARIM.md for remaining manual steps."
```

### Adım 6.4: Remote ekle (eğer yoksa)

```bash
git remote -v
```

Çıktı boşsa:

```bash
git remote add origin https://github.com/Mkosttak/bolena.git
```

### Adım 6.5: Push

```bash
git push -u origin chore/professional-infra-upgrade
```

İlk seferde GitHub kullanıcı adı + Personal Access Token (PAT) sorulur:
- GitHub Settings → Developer Settings → Personal Access Tokens → "Fine-grained" veya "Classic"
- Scope: `repo` (full control)
- Token oluştur, kopyala, parola yerine yapıştır.

Windows Credential Manager kaydeder; bir daha sormaz.

### Adım 6.6: PR aç

```bash
# gh CLI varsa:
gh pr create --title "chore: professional infrastructure upgrade" --body "Detaylı açıklama: docs/PROGRESS.md"
```

Yoksa GitHub web arayüzüne git → "Compare & pull request" → aç.

## ✅ Doğrulama

- GitHub'da branch görünür
- PR açılır
- CI tetiklenir → ~5-10 dakika içinde quality + e2e-smoke + audit job'ları yeşil olmalı

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| `Updates were rejected` | Önce `git pull origin main --rebase`, sonra push |
| CI'da typecheck fail | Lokalde geçti ama CI'da fail — `SKIP_ENV_VALIDATION=true` env yok mu? `.github/workflows/ci.yml`'de set edilmiş olmalı |
| CI'da e2e fail | Playwright env'leri (TEST_EMAIL, TEST_PASSWORD) GitHub Secrets'ta set edilmiş mi? Şimdilik atlayabilirsin (e2e smoke test'leri credentials yoksa skip) |
| `Permission denied (publickey)` | HTTPS yerine SSH kullanıyorsan SSH key kurmadın → `git remote set-url origin https://...` ile HTTPS'e geç |

---

# 7. GitHub branch protection ayarla

## 🎯 Hedef
`main` branch'ine doğrudan push yasak; sadece PR + CI + 1 onay ile merge.

## ❓ Neden
- Yanlışlıkla `main`'e push edip prod'u bozma riski sıfırlanır.
- Test/lint geçmemiş kod merge'lenemez.
- Code review zorunlu hale gelir → kalite + bilgi paylaşımı.

## 🛠️ Nasıl

1. GitHub repo → **Settings** (sağ üstteki dişli)
2. Sol menü → **Branches**
3. "Branch protection rules" → **Add rule** (veya mevcut `main` rule'unu düzenle)
4. **Branch name pattern:** `main`
5. Şunları aç:
   - ☑ **Require a pull request before merging**
     - ☑ Require approvals: **1**
     - ☑ Dismiss stale pull request approvals when new commits are pushed
   - ☑ **Require status checks to pass before merging**
     - ☑ Require branches to be up to date before merging
     - "Status checks that are required" → şunları ekle:
       - `quality` (lint + typecheck + tests)
       - `audit` (npm audit)
       - `e2e-smoke` (PR'da)
   - ☑ **Require conversation resolution before merging** (PR yorumları kapanmadan merge yok)
   - ☑ **Do not allow bypassing the above settings**
6. **Create** / **Save changes**

## ✅ Doğrulama

`main`'e direkt push denemesi:

```bash
git checkout main
echo "test" >> README.md
git commit -am "test"
git push origin main
```

Beklenen hata:
```
remote: error: GH006: Protected branch update failed for refs/heads/main.
```

Test commit'i geri al:
```bash
git reset --hard HEAD~1
```

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| Status check görünmüyor | Önce 1 PR açıp CI tetiklenmesi gerek; sonra rule'a eklenebilir |
| "I am admin, bypass" diye geçebiliyorum | "Do not allow bypassing" kutusunu kontrol et |
| Tek kişi olduğum için 1 approval bulamıyorum | Settings → Allow specified actors to bypass... → kendini ekle (ama bu ihlal ediyor güvenlik amacını) |

---

# 8. CSP Report-Only → Enforce geçişi

## 🎯 Hedef
Şu an Content-Security-Policy "raporla ama bloklama" modunda (production'da). 1 hafta soak ettikten sonra "blokla" moduna geç.

## ❓ Neden
- CSP yanlış yapılandırılırsa (örn. legitimate bir CDN'i unutmak) sayfa kısmen bozuk görünür.
- Önce **Report-Only** modunda yayınla, browser console'unda violation'ları izle, hepsini fix et, **sonra** enforce.

## 🛠️ Nasıl

### Adım 8.1: Report-Only modda izleme (1 hafta)

`next.config.ts` şu an production'da `Content-Security-Policy-Report-Only` set ediyor. Browser console'unda şu mesajları gör:

```
[Report Only] Refused to load the script 'https://gtag.com/...' because it violates the following Content Security Policy directive: ...
```

Her violation, izin vermek istediğin gerçek bir kaynak mı, yoksa engellemek istediğin saldırı mı — karar ver.

### Adım 8.2: Eksik izinleri ekle

Eğer Google Analytics, Stripe, Mixpanel vb. ekleyeceksen CSP'ye script-src'e ekle.

`next.config.ts` içinde `cspDirectives` objesini düzenle:

```ts
'script-src': [
  "'self'",
  "'unsafe-inline'",
  'https://www.googletagmanager.com',  // örn.
  'https://www.google-analytics.com',
],
```

### Adım 8.3: Enforce moda geç

`next.config.ts`:

```ts
const securityHeaders = [
  // ...
  {
    key: isProd ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
    value: cspHeader,
  },
]
```

bunu:

```ts
const securityHeaders = [
  // ...
  {
    key: 'Content-Security-Policy',  // hem dev hem prod enforce
    value: cspHeader,
  },
]
```

şekline getir.

### Adım 8.4: Deploy + son test

```bash
git add next.config.ts
git commit -m "chore(security): enforce CSP after soak period"
git push  # PR aç + merge
```

Production'a deploy ol → son bir kez ana akışları smoke test et.

## ✅ Doğrulama

Browser console artık `[Report Only]` değil, `Refused to load ... CSP violation` (gerçek blok) mesajı verir. Sayfan normal çalışıyorsa CSP enforce başarılı.

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| Sayfada bazı script'ler çalışmıyor | Console'da CSP violation oku → hangi domain → CSP'ye ekle |
| Inline style'lar bozuk | `style-src` zaten `'unsafe-inline'` içerir; ama nonce-based güvenliğe yükseltmek istersen ayrı sprint |
| TipTap editor bozuldu | `script-src` veya `connect-src`'a TipTap CDN'lerini ekle |
| Geri al | `Content-Security-Policy-Report-Only` formuna geri dön (hot rollback) |

---

# 9. KVKK Cookie Consent Banner ekle (yasal zorunluluk)

## 🎯 Hedef
Türkiye'de faaliyet gösteren web sitesi, KVKK Madde 5 gereği **çerez/yerel depolama** için kullanıcı izni almak zorunda. Şu an proje localStorage (Zustand persist), Supabase auth cookie kullanıyor — banner yok.

## ❓ Neden
- KVKK ihlali → para cezası (10.000-1.000.000 TL).
- AB'den gelen ziyaretçiler için GDPR gereksinimi de aynı.
- Mevcut: localStorage'da cart state, cookie'de auth session.

## 🛠️ Nasıl

### Seçenek A: Open-source paket (hızlı)

```bash
npm install vanilla-cookieconsent
```

`app/[locale]/(public)/layout.tsx`'e ekle:

```tsx
'use client'
import { useEffect } from 'react'
import 'vanilla-cookieconsent/dist/cookieconsent.css'

useEffect(() => {
  import('vanilla-cookieconsent').then((CookieConsent) => {
    CookieConsent.run({
      categories: {
        necessary: { enabled: true, readOnly: true },
        analytics: { enabled: false },
      },
      language: {
        default: 'tr',
        translations: {
          tr: {
            consentModal: {
              title: 'Çerez Tercihleri',
              description: 'Bu site, deneyiminizi iyileştirmek için çerez kullanır...',
              acceptAllBtn: 'Tümünü Kabul Et',
              acceptNecessaryBtn: 'Sadece Gerekli',
              showPreferencesBtn: 'Tercihleri Yönet',
            },
            preferencesModal: {
              title: 'Çerez Tercihleri',
              acceptAllBtn: 'Tümünü Kabul Et',
              acceptNecessaryBtn: 'Sadece Gerekli',
              savePreferencesBtn: 'Kaydet',
              sections: [
                {
                  title: 'Gerekli (Zorunlu)',
                  description: 'Site çalışması için zorunlu — kapatılamaz.',
                  linkedCategory: 'necessary',
                },
                {
                  title: 'Analitik (Opsiyonel)',
                  description: 'Anonim kullanım istatistikleri.',
                  linkedCategory: 'analytics',
                },
              ],
            },
          },
        },
      },
    })
  })
}, [])
```

### Seçenek B: Custom component

`components/shared/CookieBanner.tsx` yaz, `<dialog>` ile bottom-fixed banner. Sonner toast benzeri.

## ✅ Doğrulama

İlk ziyarette banner çıkar; "Sadece Gerekli" basılırsa analytics çerezi yüklenmez.

---

# 10. Privacy Policy + Terms of Service sayfaları (yasal zorunluluk)

## 🎯 Hedef
Footer'da link verilen iki yasal sayfa:
- `/tr/gizlilik` + `/en/privacy`
- `/tr/kosullar` + `/en/terms`

## ❓ Neden
- KVKK Aydınlatma Metni → "hangi veriyi alıyoruz, nasıl kullanıyoruz, ne kadar saklıyoruz".
- ToS → uyuşmazlıkta sorumluluk sınırı.

## 🛠️ Nasıl

1. Avukat/danışman ile metni yaz veya **iubenda**, **TermsFeed** gibi servislerden generate et (~$50/yıl).
2. `app/[locale]/(public)/{privacy,terms}/page.tsx` dosyaları oluştur, metni MDX olarak göm.
3. `components/shared/PublicFooter.tsx` veya layout'a footer link'leri ekle.
4. `i18n/messages/tr.json` + `en.json`'a `footer.privacyPolicy`, `footer.terms` anahtarları.

## ✅ Doğrulama

Footer'dan tıklanır, sayfa açılır, içerik görünür, mobile responsive.

---

# 11. Production build doğrulama

## 🎯 Hedef
Deploy etmeden önce lokal'de **production build**'in başarılı olduğunu teyit et.

## 🛠️ Nasıl

```bash
npm run build
```

Beklenen son satır: `Compiled successfully` veya benzeri. Bundle size raporu yazılır.

`npm run analyze` ile bundle sizes:

```bash
ANALYZE=true npm run build
```

Browser'da `analyze.html` açılır.

## ✅ Doğrulama

- Build sıfır error
- First Load JS public sayfalar < 200KB ideal
- Admin sayfalar < 400KB ideal

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| `Invalid environment variables` | `.env.local` eksik (Adım 1) |
| `Module not found: 'sharp'` | `npm install` koş |
| Bundle çok şişmiş | `npm run analyze` ile suçluyu bul, dynamic import ekle |

---

# 12. Vercel deployment

## 🎯 Hedef
Vercel'e deploy + production env'leri ayarla.

## 🛠️ Nasıl

1. https://vercel.com → New Project → GitHub repo'yu bağla
2. Root directory: `/`
3. Build command: `npm run build` (default)
4. Output directory: `.next` (default)
5. **Environment Variables** ekle (Production, Preview, Development üçü için ayrı ayrı):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (örn: `https://bolena.com.tr`)
   - `SENTRY_DSN` (opsiyonel — Adım 15)
   - `LOG_HTTP_ENDPOINT` (opsiyonel)
6. **Deploy** butonu

## ✅ Doğrulama

- Deploy build yeşil
- `https://your-domain.vercel.app` açılır
- `https://your-domain.vercel.app/api/health` `{ status: "healthy", services: { database: { ok: true } } }` döner

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| Build sırasında env hatası | Tüm 4 zorunlu env Vercel Settings'te var mı? |
| `/api/health` 503 dönüyor | Supabase URL doğru mu, RLS `site_settings.SELECT` policy var mı? |

---

# 13. Health endpoint'i monitör'e bağla

## 🎯 Hedef
Site çalışır mı, otomatik kontrol; çalışmazsa SMS/email al.

## 🛠️ Nasıl

### Ücretsiz seçenek: UptimeRobot
1. https://uptimerobot.com → Add New Monitor
2. Type: HTTP(s)
3. URL: `https://your-domain.com/api/health`
4. Monitoring Interval: 5 minutes
5. Alert Contacts: email/SMS

### Vercel built-in: Status Page (Pro plan)

## ✅ Doğrulama

UptimeRobot dashboard'da monitor "Up" görünür. Test için Vercel'de geçici olarak environment variable boz → 503 dönmeli, alert gelmeli.

---

# 14. Sentry hesabı (opsiyonel — production hata izleme)

## 🎯 Hedef
Production'da yakalanan hatalar Sentry'ye otomatik gönderilsin; e-posta/Slack bildirimi al.

## ❓ Neden
- `lib/utils/logger.ts` zaten Sentry-stub yapısında — kurulduğu an çalışır.
- Production'da kullanıcının gördüğü hatalar şu an sadece Vercel logs'ta. Aktif izleme yok.
- Sentry free tier 5000 event/ay verir → küçük-orta SaaS için yeter.

## 🛠️ Nasıl

### Adım 9.1: Hesap aç

1. https://sentry.io → Sign up
2. New project → "Next.js" → ad: `bolena2`
3. DSN URL kopyala: `https://xxx@xxx.ingest.sentry.io/yyy`

### Adım 9.2: Paket kur

```bash
npm install @sentry/nextjs
```

### Adım 9.3: Sentry config dosyalarını oluştur

```bash
npx @sentry/wizard@latest -i nextjs
```

Wizard sana DSN'i sorar, otomatik:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `instrumentation.ts`
- `next.config.ts` (Sentry plugin)

oluşturur. **next.config.ts'i değiştirirken DİKKAT** — bizim mevcut config'i bozmamalı. Manual review yap, gerekirse merge.

### Adım 9.4: Env'leri ayarla

`.env.local`'a ekle (geliştirme için):
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/yyy
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/yyy
```

`lib/env.ts`'e SENTRY_DSN'i opsiyonel server env olarak ekle:

```ts
server: {
  // ...
  SENTRY_DSN: z.string().url().optional(),
},
```

Vercel/production deployment env'leri:
- Vercel Dashboard → project → Settings → Environment Variables → ekle.

### Adım 9.5: Test

Bir test hatası tetikle (admin sayfasında geçici button):

```tsx
<button onClick={() => { throw new Error('test sentry') }}>Test</button>
```

Browser'da bas → birkaç saniye sonra Sentry dashboard'da event görünür.

## ✅ Doğrulama

Sentry dashboard → Issues → test hatasının kaydını gör. Stack trace, user agent, route hepsi var.

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| Sentry dashboard'da hiçbir şey gözükmüyor | DSN doğru mu? `NEXT_PUBLIC_` prefix var mı? `sentry.client.config.ts` import edilmiş mi (`instrumentation.ts`) |
| Source map'ler yok (minified stack) | `next.config.ts`'te Sentry webpack plugin auto upload set olmalı; `SENTRY_AUTH_TOKEN` env'i gerekir |
| Çok event geliyor (rate limit) | `sentry.client.config.ts`'te `tracesSampleRate: 0.1` (10% örnekleme) |

---

# 16. Müşteri PII Encryption at Rest (KVKK önerilen)

## 🎯 Hedef
Müşteri telefonu, adı gibi PII'leri DB'de plaintext yerine şifreli sakla.

## ❓ Neden
- Şu an `reservations.customer_phone`, `customer_name` plaintext — veritabanı dump'ı çalınırsa direkt okunur.
- KVKK önerilen: "uygun teknik tedbirler" — encryption at rest bunlardan biri.

## 🛠️ Nasıl

### Seçenek A: Supabase Vault (kolay, ücretli)
Supabase Pro+ planında dahil. Dashboard → Vault → kolon seçimi.

### Seçenek B: Application-level (Postgres pgcrypto)
1. Migration: `pgcrypto` extension etkinleştir.
2. Yeni kolon: `customer_phone_encrypted BYTEA`
3. App katmanında encrypt/decrypt: `pgp_sym_encrypt(phone, secret_key)`
4. Mevcut data'yı migrate et.
5. Plaintext kolonu drop et.

⚠️ Karmaşık iş — ayrı sprint planlamak lazım.

---

# 17. Faz 6 — Büyük Dosya Refactor (uzun vadeli)

## 🎯 Hedef
1000+ satırlık bileşenleri (HomeLanding, AddProductModal, ProductForm, PaymentModal, ReservationsClient) küçük parçalara böl.

## ❓ Neden
- 1000 satırlık dosya code review imkansız → bug birikir.
- Yeni geliştirici hangi bölümü değiştireceğini bulamaz → development hızı düşer.
- Test yazmak zor → dosya küçükçe test daha hedefli olur.

## 🛠️ Nasıl

⚠️ **Bu bir ayrı sprint olarak ele alınmalı (1-2 hafta).** Aşağıdaki disipline uy:

### Adım 10.1: Refactor öncesi test dene

Her büyük dosya için önce **smoke test ekle** (Faz 2.2'deki RTL pattern). Bu test refactor sırasında "ben bir şey bozdum mu" göstergesi.

### Adım 10.2: Extract → test → commit

Her seferinde **TEK** alt bileşeni dışarı çıkar:

1. Yeni dosya yarat: `components/modules/orders/AddProductModal/SizePicker.tsx`
2. SizePicker logic'ini AddProductModal'dan kes-yapıştır
3. Props arayüzünü tanımla
4. Parent'tan import et, kullanım yerinde değiştir
5. **Test koş** (`npm test` + manuel smoke)
6. Yeşilse commit: `refactor(orders): extract SizePicker from AddProductModal`
7. **Bir sonraki bileşene geç**

⚠️ Asla 5+ değişikliği aynı commit'te yapma — bug çıkarsa bisect zor olur.

### Adım 10.3: Hedef bölme stratejileri

| Dosya | Bölme stratejisi |
|-------|------------------|
| `HomeLanding.tsx` (1049) | `Hero/`, `Features/`, `Testimonials/`, `OnlineOrder/`, `Reviews/`, `CTA/` — her biri kendi dosyası, ana dosya orchestrator |
| `AddProductModal.tsx` (956) | `useAddProductState()` hook → `SizePicker`, `ExtraGroupSelector`, `IngredientToggles`, `QuantityControl`, `NotesTextarea` |
| `ProductForm.tsx` (861) | Tab bazlı: `BasicInfoTab`, `PricingTab`, `IngredientsTab`, `ExtrasTab`, `MediaTab` |
| `PaymentModal.tsx` (749) | Mod bazlı: `TablePaymentFlow`, `ReservationPaymentFlow`, `PickupPaymentFlow` — paylaşılan `PaymentForm` + `PaymentSummary` |
| `ReservationsClient.tsx` (716) | `useReservationsBoard()` hook + `ReservationFilters`, `ReservationCard`, `ReservationKanban` |

### Adım 10.4: a11y kalan 28 warning

Faz 6 ile **birlikte** yap. Modal yeniden yapılandırılırken `<div onClick>`'leri `<button>`'a çevirmek doğal.

## ✅ Doğrulama

- Dosyalar 300-500 satır arası
- Her bileşen tek sorumluluk
- Test coverage düşmedi (vitest threshold yeşil kalır)
- Manuel smoke: hiçbir akış değişmedi
- Lint warning sayısı düştü

## 🚨 Sorun olursa

| Hata | Çözüm |
|------|-------|
| Refactor sonrası UI bozuldu | `git diff` çek, ne değişti gör; veya `git revert` son commit'i geri al |
| Test fail oldu | İyi haber: refactor güvencesi çalıştı, fix et |
| Performance düştü | Memoization eksik; `useMemo`/`useCallback` ekle |
| State sızdı | Lift state up: parent'ta tut, child'a prop'la geç |

---

# Genel kurallar

## 🛡️ Güvenlik

- `.env.local` **asla** commit'leme. `.gitignore` koruyor ama yine de `git status`'a bak.
- Service role key **asla** `NEXT_PUBLIC_*` ile başlamasın.
- Production'a push etmeden önce **mutlaka** branch'te test et.

## 📝 Commit mesajı kuralı

Conventional Commits formatı kullan:

```
<type>(<scope>): <subject>

<body>
```

Type: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `perf`, `style`, `ci`

Örnekler:
- `feat(orders): add discount approval workflow`
- `fix(kds): prevent realtime memory leak on unmount`
- `chore(deps): bump tanstack-query to 5.96.0`

## 🔄 Düzenli bakım (haftalık)

- **Pazartesi sabahı:** Dependabot PR'larını gözden geçir, merge et
- **Cuma akşamı:** `npm audit` koş, kritik CVE varsa fix
- **Aylık:** `npm run analyze` ile bundle size kontrol et — şişmiş mi?
- **Aylık:** Sentry dashboard → en sık 5 hata → fix sprint planla

## 🆘 Yardım

- Doküman: `docs/` (PROGRESS, UPGRADE_NOTES, ARCHITECTURE, SECURITY, TESTING, DATABASE)
- Migration history: `supabase/migrations/`
- AI session geçmişi: bu PC'deki Claude Code projects/

---

## Bitirdiğinde

✅ Çalıştığını doğruladıktan sonra bu dosyayı kayıt amaçlı tut, kaldırma. İleride başka bir geliştirici aynı yolu izleyecek.

✅ Tüm adımları yapmak zorunda değilsin — kendi temponda ilerle. Adım 1, 2, 5, 6, 7 zorunlu; diğerleri yumuşak öneri.

İyi çalışmalar!
