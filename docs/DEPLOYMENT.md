# Bolena Cafe — Deployment

## Ön koşullar

- Supabase proje ayakta; Node 20+.
- `.env.local` (git dışı): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ( **`NEXT_PUBLIC_` ile service role asla** ).

Service role: Dashboard → Settings → API → `service_role` reveal → sadece sunucu env.

## Migration

`supabase/migrations/` altındaki dosyaları **dosya adı sırasıyla** SQL Editor veya CLI ile uygula. Realtime / search_path / ek tablolar son migration’larda; tek tek README eski numara listesine güvenme — klasör tek kaynak.

## Storage

Bucket `bolena-cafe` (public okuma, upload authenticated); ayrıntı policy’ler için `011_storage_policies.sql` ve Dashboard.

## İlk admin

Auth’ta kullanıcı oluştur → `profiles.role = 'admin'` (SQL veya admin UI).

## Build

```bash
npm ci
npm run build
npm run ci:verify
```

Vercel: env’leri panelden gir; repo’da `.env` yok.

## Post-deploy kontrol

- `/tr` ve `/tr/menu` açılıyor
- `/tr/admin` yetkisizde login’e gidiyor
- Login, menü CRUD, masa Realtime, storage upload
- Dashboard → Advisors: kritik uyarı yok

## Sorun giderme

| Belirti | Bak |
|---------|-----|
| Realtime yok | Publication + migration |
| Admin user oluşmuyor | `SUPABASE_SERVICE_ROLE_KEY` |
| Stok hata | `decrement_stock` / `increment_stock` migration |
| Redirect döngüsü | `proxy.ts` + login route (K-19/K-20) |
