-- =====================================================
-- 018_performance_indexes.sql
-- Sık kullanılan sorgular için kompozit ve partial indeksler.
-- Tümü IF NOT EXISTS — tekrar uygulanması güvenli (idempotent).
-- =====================================================

-- Açık siparişleri masaya göre çekme (TableOrderScreen, TablesClient)
CREATE INDEX IF NOT EXISTS idx_orders_table_status
  ON orders (table_id, status)
  WHERE status = 'active';

-- Tarih bazlı rezervasyon görünümü (ReservationsClient günlük listeleme)
CREATE INDEX IF NOT EXISTS idx_reservations_date_status
  ON reservations (reservation_date, status)
  WHERE reservation_date IS NOT NULL;

-- KDS pending'leri zaman sırasıyla (KdsClient queue)
-- Not: 007_kds.sql'de partial index var, bu daha spesifik (created_at sıralı sayımı hızlandırır).
CREATE INDEX IF NOT EXISTS idx_order_items_kds_pending_time
  ON order_items (kds_status, created_at)
  WHERE kds_status = 'pending';

-- Yayında olan blog post'ları yeniden eskiye sıralı (public blog list)
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at_desc
  ON blog_posts (published_at DESC)
  WHERE is_published = true;

-- Aktif siparişin payment'larını çekme (PaymentModal her ödemede yeniden çekiyor)
CREATE INDEX IF NOT EXISTS idx_payments_order
  ON payments (order_id, created_at);

-- Ödeme durumuna göre sipariş listeleme (raporlar)
CREATE INDEX IF NOT EXISTS idx_orders_completed_at
  ON orders (completed_at DESC)
  WHERE status = 'completed';

-- order_items hızlı order_id lookup (zaten FK index var ama query plan için kontrol)
CREATE INDEX IF NOT EXISTS idx_order_items_order_created
  ON order_items (order_id, created_at);

-- module_permissions kullanıcı bazlı listeleme (admin layout)
CREATE INDEX IF NOT EXISTS idx_module_permissions_user_access
  ON module_permissions (user_id, can_access)
  WHERE can_access = true;

-- ANALYZE indekslerin planner tarafından hemen kullanılması için
ANALYZE orders;
ANALYZE reservations;
ANALYZE order_items;
ANALYZE blog_posts;
ANALYZE payments;
ANALYZE module_permissions;
