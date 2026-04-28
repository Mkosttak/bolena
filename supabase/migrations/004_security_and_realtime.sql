-- =====================================================
-- 004_security_and_realtime.sql
-- Bolena Cafe — Güvenlik düzeltmeleri + Realtime
-- =====================================================

-- =====================================================
-- Güvenlik: search_path sabitlendi (Security Advisor uyarısı giderildi)
-- "Function Search Path Mutable" uyarısı: fonksiyonlar
-- search_path injection saldırılarına karşı korunmaya alındı
-- =====================================================

ALTER FUNCTION update_updated_at_column()
  SET search_path = public, pg_temp;

ALTER FUNCTION handle_new_user()
  SET search_path = public, pg_temp;

ALTER FUNCTION get_my_role()
  SET search_path = public, pg_temp;

ALTER FUNCTION decrement_stock(UUID, INTEGER)
  SET search_path = public, pg_temp;

-- =====================================================
-- Realtime: tablolar supabase_realtime publication'a eklendi
-- (Supabase Free plan'da desteklenir)
-- Idempotent: zaten ekli ise atlanır
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'reservations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
  END IF;
END $$;
