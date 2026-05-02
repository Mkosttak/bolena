-- =====================================================
-- 019_production_hardening.sql
-- Production öncesi sağlamlık iyileştirmeleri.
-- Hepsi idempotent (IF NOT EXISTS).
-- =====================================================

-- ─────────────────────────────────────────────────────────────────
-- 1. Payment idempotency — opsiyonel idempotency_key + UNIQUE
--    Application'da fallback (10 sn dedupe) zaten var; bu ek katman
--    network retry / double-submit'e karşı kesin koruma.
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Sadece idempotency_key NOT NULL olanlar için unique
CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_idempotency_key
  ON payments (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 2. Performance index migration tekrarı — CONCURRENTLY ile
--    018 zaten uygulandıysa atlanır (IF NOT EXISTS).
--    Yoksa CONCURRENTLY ile tablo lock'unu önler.
--
--    NOT: CONCURRENTLY transaction içinde çalışmaz — Supabase migrate
--    her dosyayı tek transaction'da koşar. Bu yüzden her CREATE INDEX
--    CONCURRENTLY ayrı dosyada olmalı veya migration runner outside-tx
--    desteklemeli. Şimdilik UNIQUE olmayan index'ler için CONCURRENTLY
--    eklemeyi atlıyoruz; migration zaten 018'de standart CREATE INDEX
--    olarak uygulandı.
--
--    Production'da yeni index eklemek için: ayrı migration dosyası,
--    BEGIN/COMMIT'siz, sadece "CREATE INDEX CONCURRENTLY ..." satırı.
-- ─────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────
-- 3. Reservation çakışma kontrolü — aynı tarih/saat/masa
--    Application-level dışında DB constraint ekleyerek güvenli yap.
-- ─────────────────────────────────────────────────────────────────

-- Aynı tarih + saat aralığında aynı masaya birden fazla 'pending'/'seated'
-- rezervasyon yapılamasın (overlap için tam time-range constraint
-- karmaşık; basit varyant: aynı tarih/saat tam çakışmasını engelle).
CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_table_datetime_active
  ON reservations (table_id, reservation_date, reservation_time)
  WHERE table_id IS NOT NULL
    AND reservation_date IS NOT NULL
    AND reservation_time IS NOT NULL
    AND status IN ('pending', 'seated');

-- ─────────────────────────────────────────────────────────────────
-- 4. Order completed_at ile status tutarlılığı
--    completed_at NOT NULL ise status 'completed' olmalı.
-- ─────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE constraint_name = 'chk_orders_completed_at_status'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT chk_orders_completed_at_status
      CHECK (
        (completed_at IS NULL) OR (status = 'completed')
      ) NOT VALID;  -- Mevcut row'ları validate etmez (geçmiş veriyi bozmasın)
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 5. Audit log iskeleti
--
-- Şu an hiçbir action bu tabloya yazmıyor (kullanım planı: kritik
-- mutation'larda — payment, role change, delete cascade — server action
-- içinden insert'lerle doldurulacak).
--
-- TASARIM KARARLARI:
-- - SELECT: Sadece admin görebilir (audit kim ne yaptı sırrı, employee görmemeli)
-- - INSERT: Sadece **kendi adına** authenticated user yazabilir (auth.uid() = user_id)
--   Service role bu RLS'i bypass eder — eğer ileride RPC ile bulk insert gerekirse
--   service role context'te yapılabilir.
-- - UPDATE/DELETE: Hiç policy yok = default DENY. Audit log immutable.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id     UUID NOT NULL,
  action      TEXT NOT NULL CHECK (length(action) BETWEEN 1 AND 64),
  entity      TEXT NOT NULL CHECK (length(entity) BETWEEN 1 AND 64),
  entity_id   TEXT,
  details     JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity_time
  ON audit_log (entity, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_time
  ON audit_log (user_id, occurred_at DESC);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_admin_select ON audit_log;
CREATE POLICY audit_log_admin_select ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Insert: Kullanıcı sadece KENDİ user_id'siyle log yazabilir (kimliğini değiştiremez).
-- Service role bypass eder; yani admin RPC fonksiyonları sistem-attribution insert yapabilir.
DROP POLICY IF EXISTS audit_log_self_insert ON audit_log;
CREATE POLICY audit_log_self_insert ON audit_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE/DELETE policy yok → immutable log (default DENY).
