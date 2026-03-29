# Bolena Cafe — Kod Konvansiyonları

> Tüm yapay zekalar bu kurallara uyar. Farklı bir yol tercih etme —
> tutarlılık, "daha iyi" bir alternatiften daha önemlidir.

---

## Dosya ve Klasör İsimlendirme

```
Bileşenler (components/):    PascalCase.tsx      → AddProductModal.tsx
Sayfalar (app/):             kebab-case/          → platform-orders/page.tsx
Hooks (lib/hooks/):          use + PascalCase.ts  → usePermission.ts
Store (lib/stores/):         camelCase.store.ts   → auth.store.ts
Queries (lib/queries/):      camelCase.queries.ts → menu.queries.ts
Validations (lib/validations/): camelCase.schema.ts → menu.schema.ts
Utils (lib/utils/):          camelCase.utils.ts   → order.utils.ts
Types (types/):              camelCase.types.ts   → index.ts
```

---

## Import Sırası (Her Dosyada)

```typescript
// 1. React / Next.js
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// 2. Üçüncü taraf paketler
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { z } from 'zod'

// 3. Supabase
import { createBrowserClient } from '@/lib/supabase/client'

// 4. Stores
import { useAuthStore } from '@/lib/stores/auth.store'

// 5. Queries / Utils
import { menuKeys } from '@/lib/queries/menu.queries'

// 6. Types
import type { Product, Category } from '@/types'

// 7. Bileşenler (ui önce, sonra shared, sonra modules)
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/shared/Modal'
import { OrderItemList } from '@/components/modules/orders/OrderItemList'
```

---

## Bileşen Yapısı

```typescript
// ✅ Standart bileşen yapısı
interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  onAdd: (item: OrderItemInput) => void
}

export function AddProductModal({ isOpen, onClose, productId, onAdd }: AddProductModalProps) {
  // 1. Hooks (i18n, router, store)
  const t = useTranslations('orders')
  const { user } = useAuthStore()

  // 2. State
  const [quantity, setQuantity] = useState(1)

  // 3. Query / Mutation
  const { data: product } = useQuery(productQuery(productId))

  // 4. Handlers
  const handleSubmit = () => { ... }

  // 5. Render
  return ( ... )
}
```

**Kurallar:**
- Default export YOK — her zaman named export
- Props interface adı: `{ComponentName}Props`
- `'use client'` direktifi sadece gerektiğinde, mümkün olduğunca server component kullan

---

## TanStack Query Keys

```typescript
// lib/queries/menu.queries.ts

export const menuKeys = {
  all: ['menu'] as const,
  categories: () => [...menuKeys.all, 'categories'] as const,
  products: () => [...menuKeys.all, 'products'] as const,
  product: (id: string) => [...menuKeys.products(), id] as const,
  productsByCategory: (categoryId: string) => [...menuKeys.products(), { categoryId }] as const,
}

// Her modülün kendi keys factory'si var:
// menuKeys, orderKeys, tableKeys, reservationKeys, userKeys...
```

---

## Zustand Store Yapısı

```typescript
// lib/stores/auth.store.ts
import { create } from 'zustand'
import type { Profile, ModuleName } from '@/types'

interface AuthState {
  profile: Profile | null
  permissions: ModuleName[]
  isLoading: boolean
  // Actions
  setProfile: (profile: Profile) => void
  setPermissions: (permissions: ModuleName[]) => void
  clearAuth: () => void
  hasPermission: (module: ModuleName) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  permissions: [],
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setPermissions: (permissions) => set({ permissions }),
  clearAuth: () => set({ profile: null, permissions: [] }),
  hasPermission: (module) => {
    const { profile, permissions } = get()
    if (profile?.role === 'admin') return true
    return permissions.includes(module)
  },
}))
```

---

## Zod v4 Şema Yapısı

```typescript
// lib/validations/menu.schema.ts
import { z } from 'zod'

export const productSchema = z.object({
  category_id: z.string().uuid('Geçerli bir kategori seçin'),
  name_tr: z.string().min(1, 'Ürün adı zorunludur').max(100),
  name_en: z.string().min(1, 'Product name is required').max(100),
  price: z.number().positive('Fiyat 0\'dan büyük olmalıdır'),
  campaign_price: z.number().positive().optional().nullable(),
  // ...
})

export type ProductInput = z.infer<typeof productSchema>
```

---

## Server Action Yapısı

```typescript
// app/[locale]/(admin)/users/actions.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { userSchema } from '@/lib/validations/user.schema'

export async function createUserAction(formData: FormData) {
  // 1. Validate
  const parsed = userSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  // 2. Auth kontrolü (server-side)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 3. Admin işlemi
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({ ... })

  if (error) return { error: error.message }
  return { success: true, data }
}
```

---

## i18n Kullanımı

```typescript
// ✅ Client Component
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('menu') // namespace
  return <h1>{t('title')}</h1>
}

// ✅ Server Component
import { getTranslations } from 'next-intl/server'

export async function MyServerComponent() {
  const t = await getTranslations('menu')
  return <h1>{t('title')}</h1>
}
```

**i18n JSON yapısı:**
```json
// tr.json
{
  "common": { "save": "Kaydet", "cancel": "İptal", "delete": "Sil" },
  "menu": { "title": "Menü Yönetimi", "addProduct": "Ürün Ekle" },
  "orders": { "addItem": "Ürün Ekle", "total": "Toplam" },
  "tables": { "title": "Masalar", "editTables": "Masaları Düzenle" }
}
```

---

## Supabase Query Yapısı

```typescript
// ✅ Type-safe query
const { data, error } = await supabase
  .from('products')
  .select(`
    id,
    name_tr,
    name_en,
    price,
    categories ( id, name_tr )
  `)
  .eq('is_visible', true)
  .order('created_at', { ascending: false })

// Tipi: Database['public']['Tables']['products']['Row'] & { categories: ... }

// ✅ RPC çağrısı
const { error } = await supabase.rpc('decrement_stock', {
  p_product_id: productId,
  p_quantity: quantity
})
```

---

## Hata Yönetimi

```typescript
// ✅ Supabase hata kontrolü her sorguda
const { data, error } = await supabase.from('products').select('*')
if (error) {
  console.error('[products:fetch]', error.message)
  throw new Error(error.message)
}

// ✅ TanStack Query'de hata state kullan
const { data, isLoading, isError, error } = useQuery(...)
if (isError) return <ErrorState message={error.message} />
```

---

## Tarih İşlemleri

```typescript
// Hep date-fns kullan — native Date metotları değil
import { format, isAfter, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

// Kampanya fiyatı kontrolü
const isOnCampaign = (product: Product): boolean => {
  if (!product.campaign_price || !product.campaign_end_date) return false
  return isAfter(parseISO(product.campaign_end_date), new Date())
}

// Tarih formatla
format(new Date(), 'dd MMM yyyy', { locale: tr }) // "29 Mar 2026"
```

---

## Error Boundary ve Loading State Kuralları

### Her modül sayfasında zorunlu
```typescript
// app/[locale]/(admin)/menu/page.tsx
// Supabase data olan her sayfada loading + error state zorunlu

// ✅ Server Component'ta
export default async function MenuPage() {
  return (
    <Suspense fallback={<TableSkeleton />}>   {/* loading */}
      <ErrorBoundary fallback={<ErrorState />}> {/* error */}
        <MenuContent />
      </ErrorBoundary>
    </Suspense>
  )
}

// ✅ Client Component'ta (TanStack Query)
const { data, isLoading, isError, error } = useQuery(...)
if (isLoading) return <Skeleton />
if (isError) return <ErrorState message={error.message} />
```

**Skeleton bileşenleri:** `components/shared/skeletons/` altında modül bazlı oluştur.
**ErrorState bileşeni:** `components/shared/ErrorState.tsx` — tek bir merkezi hata bileşeni.

---

## ESLint Kuralları (next.config.ts)

Next.js 16 default ESLint kurallarına ek olarak:
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["error", "warn"] }],
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

---

## Stok Yönetimi (Kritik)

```typescript
// ❌ YANLIŞ — race condition riski
await supabase
  .from('products')
  .update({ stock_count: currentStock - quantity })
  .eq('id', productId)

// ✅ DOĞRU — atomik RPC
const { error } = await supabase.rpc('decrement_stock', {
  p_product_id: productId,
  p_quantity: quantity
})
if (error) throw new Error('Stok yetersiz: ' + error.message)
```
