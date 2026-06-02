-- =====================================================
-- 020_payments_realtime.sql
-- Bolena Cafe — payments tablosunu realtime yayınına ekle
-- =====================================================
--
-- Sorun: TableOrderScreen ve ReservationOrderScreen `payments` tablosuna
-- realtime abone oluyor, ancak `payments` hiçbir migration'da
-- supabase_realtime publication'a eklenmemişti. Bu yüzden ödeme INSERT'leri
-- realtime ile gelmiyordu (yalnız `orders` UPDATE üzerinden dolaylı yansıyordu).
--
-- Bu migration payments'ı yayına ekler → çoklu cihaz arası anlık ödeme senkronu.
-- Idempotent: zaten ekliyse no-op.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payments;
  END IF;
END $$;
