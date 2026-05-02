# Migration Repair Scripts

Bu klasör **otomatik çalıştırılmaz**. Buradaki SQL dosyaları, supabase migration tablosundaki kayıtları **elle düzeltmek** için referanstır.

## REPAIR-001: Migration 008 Duplicate

### Sorun
`supabase/migrations/` altında iki dosya `008_` ile başlıyor:
- `008_increment_stock.sql`
- `008_menu_campaigns.sql`

Supabase CLI bunları alfabetik sıralayıp ikisini de uyguluyor (önce increment_stock, sonra menu_campaigns). Production'da `schema_migrations` tablosunda iki kayıt mevcut.

### Risk
- Yeni geliştirici aynı numarayı tekrar kullanabilir.
- Supabase versiyonu bir gün sıralama kuralını değiştirirse uygulama sırası belirsizleşir.

### Repair Stratejisi
**Önce staging/branch DB'de test et. Sonra prod'a uygula.**

#### Adımlar

1. **Branch DB oluştur** (Supabase dashboard'tan):
   ```
   Settings → Branching → Create Branch
   ```

2. **Branch'te `repair-001-rename-008-menu-campaigns.sql`'i çalıştır:**
   ```sql
   UPDATE supabase_migrations.schema_migrations
   SET version = '009_menu_campaigns'
   WHERE version = '008_menu_campaigns';
   ```

3. **Lokalde dosyayı rename et:**
   ```bash
   git mv supabase/migrations/008_menu_campaigns.sql supabase/migrations/009_menu_campaigns.sql
   ```

4. **Sonraki migration'lar zaten doğru numarada** (`009_campaign_targeting.sql` mevcut) — çakışma kontrolü:
   - `009_menu_campaigns.sql` (yeni) ve `009_campaign_targeting.sql` ikisi `009_` ile başlar.
   - **Çözüm A:** `009_campaign_targeting.sql` → `010_campaign_targeting.sql` ve sonrakileri kaydır (zincirleme rename).
   - **Çözüm B:** `008_menu_campaigns.sql` → `008b_menu_campaigns.sql` (daha az invazif).

5. **`supabase db push --dry-run`** ile uygulanacak değişiklikleri kontrol et.

6. **Branch DB'de `supabase migration list`** ile durum doğrula.

7. **Branch'i prod'a merge** veya elle prod DB'de SQL'i çalıştır.

### Tavsiye
Bu, **opsiyonel kozmetik düzeltme**. Bugün çalışıyor. Yapılmazsa fonksiyonel zarar yok. Ama yeni migration eklerken **timestamp-based prefix** kullanılması önerilir (Supabase CLI default'u):

```bash
supabase migration new <name>
```

Bu, `20260501120000_<name>.sql` formatında dosya oluşturur — duplicate imkansız olur.
