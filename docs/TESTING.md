# Bolena Cafe — Test Stratejisi

> **YAPAY ZEKA TALİMATI:**
> Her yeni özellik veya modül tamamlandığında testleri YAZ.
> Test yazmadan görev "tamamlandı" sayılmaz.
> `docs/PROGRESS.md`'de ✅ işareti koyabilmek için testler geçmeli.

---

## Test Araçları

| Araç | Amaç | Versiyon |
|---|---|---|
| **Vitest** | Unit + Integration testler | latest |
| **React Testing Library** | Bileşen testleri | latest |
| **@testing-library/user-event** | Kullanıcı etkileşimi simülasyonu | latest |
| **Playwright** | E2E (kritik akışlar) | latest |
| **MSW (Mock Service Worker)** | Supabase mock'lama | latest |

---

## Test Klasör Yapısı

```
bolena2/
├── __tests__/
│   ├── unit/
│   │   ├── utils/
│   │   │   ├── order.utils.test.ts
│   │   │   └── date.utils.test.ts
│   │   ├── stores/
│   │   │   └── auth.store.test.ts
│   │   └── validations/
│   │       ├── menu.schema.test.ts
│   │       └── order.schema.test.ts
│   ├── integration/
│   │   ├── queries/
│   │   │   └── menu.queries.test.ts
│   │   └── actions/
│   │       └── user.actions.test.ts
│   └── components/
│       ├── orders/
│       │   ├── AddProductModal.test.tsx
│       │   ├── PaymentModal.test.tsx
│       │   └── OrderSummary.test.tsx
│       └── shared/
│           └── Sidebar.test.tsx
├── e2e/
│   ├── auth.spec.ts
│   ├── menu-management.spec.ts
│   ├── table-order.spec.ts
│   └── payment.spec.ts
└── __tests__/setup.ts          # Global test setup
```

---

## Her Modül İçin Test Zorunluluğu

### ✅ Zorunlu Testler (Her Modülde)

#### 1. Utility Fonksiyonları → Unit Test
```typescript
// lib/utils/order.utils.test.ts
describe('calculateOrderTotal', () => {
  it('ürün fiyatlarını doğru toplar', () => { ... })
  it('kampanya fiyatını kullanır (bitiş tarihi geçmemişse)', () => { ... })
  it('kampanya fiyatını kullanmaz (bitiş tarihi geçmişse)', () => { ... })
  it('ekstra ücretleri toplama ekler', () => { ... })
  it('ikram ürünleri toplama eklemez', () => { ... })
  it('yüzde indirimi doğru uygular', () => { ... })
  it('tutar indirimini doğru uygular', () => { ... })
})
```

#### 2. Zod Şemaları → Unit Test
```typescript
// lib/validations/menu.schema.test.ts
describe('productSchema', () => {
  it('geçerli ürün verisini kabul eder', () => { ... })
  it('boş ürün adını reddeder', () => { ... })
  it('negatif fiyatı reddeder', () => { ... })
  it('kampanya fiyatı normal fiyattan büyükse uyarır', () => { ... })
})
```

#### 3. Zustand Store'ları → Unit Test
```typescript
// lib/stores/auth.store.test.ts
describe('useAuthStore', () => {
  it('admin rolü tüm modüllere erişebilir', () => { ... })
  it('employee sadece izinli modüllere erişebilir', () => { ... })
  it('clearAuth profili ve izinleri sıfırlar', () => { ... })
})
```

#### 4. Kritik Bileşenler → Component Test
```typescript
// components/modules/orders/AddProductModal.test.tsx
describe('AddProductModal', () => {
  it('zorunlu ekstra seçilmeden sipariş eklenemiyor', () => { ... })
  it('çıkartılabilir içerik kaldırılabiliyor', () => { ... })
  it('adet artırma/azaltma çalışıyor', () => { ... })
  it('maksimum ekstra seçim sayısı aşılamıyor', () => { ... })
})

// components/modules/orders/PaymentModal.test.tsx
describe('PaymentModal', () => {
  it('kısmi ödeme sonrası kalan tutarı doğru gösteriyor', () => { ... })
  it('toplam ödeme >= toplam tutar ise sipariş kapanıyor', () => { ... })
  it('indirim uygulandıktan sonra doğru toplam gösteriyor', () => { ... })
})
```

---

## E2E Testler (Kritik Akışlar)

### Öncelikli E2E Testler
```typescript
// e2e/auth.spec.ts
- Admin girişi başarılı → dashboard'a yönlenir
- Yanlış şifre → hata mesajı gösterilir
- Yetkisiz sayfa → login'e yönlendirilir
- Employee izinsiz modül → 403 sayfası

// e2e/table-order.spec.ts
- Masaya tıkla → sipariş ekranı açılır
- Ürün ekle (ekstralarla) → sipariş listesine düşer
- Ödeme al → parçalı ödeme → sipariş kapanır

// e2e/payment.spec.ts
- Tam ödeme → siparişi kapatır
- Kısmi ödeme → sipariş açık kalır, kalan tutar güncellenir
- İndirim uygula → doğru tutar hesaplanır
```

---

## Test Yazma Kuralları

### 1. Her test bağımsız çalışmalı
```typescript
// ✅ DOĞRU: Her test kendi setup'ını yapar
beforeEach(() => {
  useAuthStore.getState().clearAuth()
})

// ❌ YANLIŞ: Testler birbirine bağımlı
```

### 2. Supabase mock'lanmalı
```typescript
// __tests__/setup.ts
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'

export const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 3. Test isimleri Türkçe olabilir (açıklayıcı olsun)
```typescript
it('stok 0 olduğunda ürün otomatik satıştan kalkıyor', () => { ... })
it('kampanya bitiş tarihi geçmişse normal fiyat gösteriliyor', () => { ... })
```

### 4. Kritik iş mantığı her zaman test edilmeli
Şunların testi olmadan modül tamamlanmış sayılmaz:
- Fiyat hesaplama (ekstra, indirim, ikram)
- Stok düşürme (atomik RPC kontrolü)
- Yetki kontrolü (admin vs employee)
- Çalışma saati istisnası kontrolü (`isOpen()`)
- Kampanya fiyatı kontrolü

---

## Vitest Konfigürasyonu

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['__tests__/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules', '.next', 'e2e', 'components/ui'],
      // Minimum coverage eşikleri
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
      }
    }
  }
})
```

---

## Test Komutları

```bash
npm run test          # Tüm unit/integration/component testleri
npm run test:watch    # Watch mode
npm run test:coverage # Coverage raporu
npm run test:e2e      # Playwright E2E testler
npm run test:e2e:ui   # Playwright UI mode
```

---

## Hangi Testler Hangi Modülde

| Modül | Unit | Component | E2E |
|---|---|---|---|
| Auth | store testi | login form | giriş akışı, yetki reddi |
| Kullanıcı Yönetimi | — | izin matrisi | kullanıcı ekleme |
| Menü | schema, utils | ürün formu | ürün ekleme akışı |
| Ekstralar | — | seçenek formu | — |
| Masa Sistemi | fiyat hesap | AddProductModal, PaymentModal | sipariş + ödeme akışı |
| Rezervasyon | — | rezervasyon formu | masaya atama akışı |
| Platform Siparişleri | — | sipariş formu | teslim akışı |
| Çalışma Saatleri | isOpen() | istisna formu | — |
| Public Site | kampanya fiyatı | — | — |
