# Bolena Cafe — Modüller (rota özeti)

Durum için `docs/PROGRESS.md`; kararlar için `docs/DECISIONS.md`.

Tüm admin yolları: `/[locale]/admin/...` (`tr` | `en`).

| Modül | Rota | Not |
|--------|------|-----|
| Giriş | `/[locale]/login` | `(admin)` dışında |
| Kullanıcılar | `.../admin/users` | Sadece admin |
| Menü | `.../admin/menu` (+ kampanya alt rotaları) | DnD sıra, kampanya |
| Ekstralar | `.../admin/extras` | Grup + seçenek |
| Masalar | `.../admin/tables`, `.../tables/[id]` | Realtime |
| Rezervasyon | `.../admin/reservations` | Realtime |
| Platform | `.../admin/platform-orders` | Realtime |
| Çalışma saatleri | `.../admin/working-hours` | `isOpen`: önce istisna |
| Raporlar | `.../admin/reports` | CSV export |
| KDS | `.../admin/kds` | `kds_status` satır bazlı |
| Dashboard | `.../admin/dashboard` | KPI |
| Site / QR | `.../admin/site-settings` | Global QR, masa token |
| Public | `/[locale]`, `/menu`, `/contact` | SSR + i18n |

**Müşteri QR:** `/qr/[token]` — `[locale]` dışı; `proxy` bypass.

Ortak sipariş bileşenleri: `components/modules/orders/` (CLAUDE.md tablosu ile uyumlu).
