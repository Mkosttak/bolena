-- REPAIR-001 rollback: 009_menu_campaigns adını 008_menu_campaigns'e geri al.

BEGIN;

UPDATE supabase_migrations.schema_migrations
SET version = '008_menu_campaigns'
WHERE version = '009_menu_campaigns';

SELECT version FROM supabase_migrations.schema_migrations
WHERE version LIKE '008%'
ORDER BY version;

COMMIT;
