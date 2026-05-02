# Server Action Testleri

Bu klasörde server action'lar için **mock-based** unit test'ler bulunur. Supabase client `__tests__/helpers/supabase-mock.ts` üzerinden mock'lanır — gerçek DB'ye bağlanmaz, env gerektirmez.

## Mevcut testler (kritik akışlar)

- `orders.actions.test.ts` — sipariş ekle/sil, stok hatası, ödeme, kapat
- `qr-session.actions.test.ts` — QR sipariş submit, session validation, rate limit
- `blog.actions.test.ts` — blog create/delete, XSS sanitize doğrulama

## Eklenmesi gereken testler (skeleton — yapılacak)

Aşağıdaki action'lar henüz test edilmedi. Yukarıdaki dosyaları template alarak ekleyin.

### Yüksek öncelik
- `tables.actions.test.ts` — `getOrCreateTableOrder`, `transferTableOrder`, `regenerateQrToken`
- `reservations.actions.test.ts` — `createReservation`, `assignTable`, `cancelReservation`
- `users.actions.test.ts` — `createUser` (admin/employee yetki ayrımı), `updateRole`, `deleteUser` cascade

### Orta öncelik
- `kds.actions.test.ts` — `markItemReady`, `markBatchReady`
- `menu.actions.test.ts` — kategori/ürün CRUD, sort order
- `menu-campaign.actions.test.ts` — kampanya create/update, hedefleme

### Düşük öncelik
- `platform-orders.actions.test.ts` — basic CRUD
- `working-hours.actions.test.ts` — upsert, exception
- `reports.actions.test.ts` — service role kullandığı için integration test ideali

## Test yazma rehberi

1. **Setup:** Dosyanın tepesine mock'ları ekleyin:
   ```ts
   const mockClient = createSupabaseMock()

   vi.mock('@/lib/supabase/server', () => ({
     createClient: vi.fn(async () => mockClient.client),
   }))
   ```

2. **Senaryo başına 3 test:** happy path, validation hatası, RPC/DB hatası.

3. **RPC çağrıları:** `mockClient.setNextRpcResult({ data, error })`. Sonra `expect(mockClient.mock.rpc).toHaveBeenCalledWith(...)`.

4. **Query chain'leri:** `mockClient.setNextQueryResult({ data, error })`. Daha kompleks zincir için `mockClient.fromChain.<method>.mockReturnValueOnce(...)`.

5. **Auth context:** Default mock'ta `getUser()` `test-user-id` döner. Override için `mockClient.mock.auth.getUser.mockResolvedValueOnce(...)`.

6. **Coverage hedefi:** server action'lar için %90 line coverage.
