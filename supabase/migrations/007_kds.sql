-- =====================================================
-- 007_kds.sql
-- KDS (Mutfak/Bar Ekranı) — order_items kds_status kolonu
-- =====================================================

-- Mutfak ekranında her sipariş kalemi için ayrı durum takibi
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS kds_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (kds_status IN ('pending', 'ready'));

-- İndeks: KDS ekranı sadece pending item'ları çeker
CREATE INDEX IF NOT EXISTS idx_order_items_kds_status
  ON order_items (kds_status)
  WHERE kds_status = 'pending';
