# Bolena Cafe — Konvansiyonlar

Tutarlılık > kişisel tercih. Detay şema için mevcut `lib/` dosyalarına bak.

## İsimlendirme

- Bileşen: `PascalCase.tsx`
- Sayfa klasörü: `kebab-case`
- Hook: `useThing.ts`
- Store / queries / validations / utils: `thing.store.ts`, `thing.queries.ts`, `thing.schema.ts`, `thing.utils.ts`

## Export / bileşen

- Named export; props tipi `FooProps`.
- `'use client'` yalnız gerektiğinde.

## Import sırası

React/Next → üçüncü parti → `@/lib` → `@/components/ui` → `@/components/shared` → `@/components/modules` → `@/types`.

## TanStack Query

Her modülde `*Keys` factory (`all`, liste, detay…). Invalidate hedefi dar tut.

## Zustand

İnce store; auth’ta `hasPermission(module)`.

## Zod

Form + server action’da aynı şema; mesajlar i18n ile uyumlu (veya şema içi TR/EN ayrımı proje stiline göre).

## Server action

`safeParse` → auth → Supabase / admin client → düzgün hata dönüşü. **Service role asla client’ta.**

## i18n

Client: `useTranslations(ns)`; RSC: `getTranslations`. Metin gömme yok.

## Supabase

`.from().select()` ile typed kullanım; RPC parametreleri isimlendirilmiş. Stok: RPC.

## Tarih

`date-fns` tercih; saat dilimi gereksinimleri rapor koduna uy (TR gün sınırı vb.).

## Loading / hata

Query: `isLoading` / `isError`. Sayfa: `loading.tsx`, `error.tsx` App Router kalıbı.

## ESLint

`no-explicit-any`; `console` production’da yok (proje kuralı).
