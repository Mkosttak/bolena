-- REPAIR-001: 008_menu_campaigns adını 009_menu_campaigns yap.
-- ÖNCE staging/branch DB'de test et. Geri alma scripti aşağıda.
--
-- Bu komut Supabase CLI'nin schema_migrations tablosundaki kaydı günceller.
-- Bu komutu çalıştırmadan ÖNCE dosya adını lokalde rename ETMEYIN — sıra önemli.
--
-- Adım sırası:
-- 1. (DB'de) Aşağıdaki UPDATE'i çalıştır.
-- 2. (Lokalde) `git mv supabase/migrations/008_menu_campaigns.sql supabase/migrations/009_menu_campaigns.sql`
-- 3. (DB'de) `supabase migration list` ile teyit et.
-- 4. Eğer 009_campaign_targeting.sql ile çakışma olursa, `009_campaign_targeting.sql`'i de
--    `010_campaign_targeting.sql`'e taşı ve schema_migrations'da aynı UPDATE'i koş.

BEGIN;

-- Mevcut durum kontrolü:
SELECT version FROM supabase_migrations.schema_migrations
WHERE version LIKE '008%' OR version LIKE '009%'
ORDER BY version;

-- Asıl güncelleme:
UPDATE supabase_migrations.schema_migrations
SET version = '009_menu_campaigns'
WHERE version = '008_menu_campaigns';

-- Doğrulama:
SELECT version FROM supabase_migrations.schema_migrations
WHERE version LIKE '008%' OR version LIKE '009%'
ORDER BY version;

-- Sonuç beklenir:
--   008_increment_stock
--   009_campaign_targeting   <-- mevcut
--   009_menu_campaigns       <-- yeni
--   ... (sonrakiler)

-- Beklenen değil ise ROLLBACK çağır.
COMMIT;
