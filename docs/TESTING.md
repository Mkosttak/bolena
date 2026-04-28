# Bolena Cafe — Test Stratejisi

**Kural:** Yeni özellik bitince test yaz; test yoksa görev tamamlanmış sayılmaz. `docs/PROGRESS.md` güncelle.

## Araçlar

| Araç | Kullanım |
|------|-----------|
| Vitest | Unit / entegrasyon |
| React Testing Library + user-event | Bileşen |
| Playwright | Kritik E2E |
| MSW | İsteğe bağlı API mock (`__tests__/setup.ts`) |

## Neyi test et?

| Katman | Örnek |
|--------|--------|
| `lib/utils/*` | Fiyat, kampanya, tarih, KDS gruplama |
| `lib/validations/*` | Zod şemaları — geçerli / geçersiz fixture |
| `lib/stores/*` | Auth / QR session davranışı |
| Kritik UI | Sipariş modal’ları, özet, ödeme — mutasyon + guard’lar |

## E2E önceliği

- Giriş + yetkisiz yönlendirme
- Masa siparişi: ürün ekle → ödeme (mümkünse env’li tam akış; yoksa smoke)

## Komutlar

```bash
npm run test
npm run test:e2e
npm run ci:verify    # lint + typecheck + unit
```

Vitest ayarı: `vitest.config.ts` — `setupFiles: ['__tests__/setup.ts']`, `environment: 'jsdom'`.

## Modül → test eşlemesi (kısa)

| Alan | Unit | Bileşen | E2E |
|------|------|---------|-----|
| Auth | store | login form | giriş |
| Menü | schema, utils | form / sheet | isteğe bağlı |
| Sipariş | order.utils | AddProduct, Payment | masa akışı |
| Raporlar | reports.utils | — | — |

İsimler Türkçe veya İngilizce olabilir; davranış net olsun.
