# Bolena Cafe — İş akışları

Kod değişince bu akışların bozulmamasına dikkat.

## 1. Sipariş yaşam döngüsü

`active` → kalem / indirim / ödeme → `payment_status` partial veya paid → kapatınca `completed` + `completed_at`. İptal / no-show: rezervasyon tarafı kurallarına uy.

## 2. Ödeme (parçalı)

Masa, rezervasyon, gel-al: `PaymentModal` — birden fazla `payments` satırı; toplam ödenene kadar `partial`. Platform aggregator: tek ödeme / `PaymentModalSimple` (K-09).

**Tutar:** `unit_price` (kampanya dahil efektif fiyat) + ekstralar → satır toplamı; ikramlar subtotal dışı; indirim `discount_type` ile `total_amount`.

## 3. Rezervasyon → masa

Rezervasyon + `orders` (type reservation) → müşteri gelince masa seç → `orders.table_id`, `type=table`, rezervasyon `seated` → ödeme → sipariş + rezervasyon tamamlanır. Gel-al: `takeaway` order tipi.

## 4. Stok

`track_stock` ise kaleme eklemede `decrement_stock`; adet düşürme / silmede `increment_stock` veya tanımlı RPC. Doğrudan `UPDATE stock_count` ile yarış yapma.

## 5. Platform

`orders.type=platform` + platform alanı; teslim / ödeme kuralları modüle göre (K-09).

## 6. Auth

`proxy.ts` → admin session → layout → client store + `usePermission` / server `requireModuleAccess` → RLS.

## 7. Çalışma saati (public)

`isOpen(date)`: önce `working_hours_exceptions` tarih eşleşmesi, yoksa haftalık `working_hours`.
