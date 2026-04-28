# Bolena2

Next.js 16 + Supabase ile glutensiz kafe operasyon paneli (public site + admin).

## Stack

Next 16 (App Router), React 19, TypeScript, Supabase (Auth, Postgres, RLS, Realtime, Storage), TanStack Query, Zustand, Tailwind + shadcn, Vitest + RTL + Playwright.

## Kurulum

```bash
npm ci
```

`.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

```bash
npm run dev
```

→ `http://localhost:3000`

## Scriptler

`dev` | `build` | `start` | `lint` | `typecheck` | `test` | `test:e2e` | `ci:verify` (lint + typecheck + unit)

## Veritabanı

Şema ve RLS: `supabase/migrations/`. Detay özeti: `docs/DATABASE.md`.

## CI

`.github/workflows/ci.yml` — lint, typecheck, unit; PR’de E2E.

## Dokümantasyon

`docs/` — mimari: `ARCHITECTURE.md`; kararlar: `DECISIONS.md`; güvenlik: `SECURITY.md`; deploy: `DEPLOYMENT.md`. AI oturum rehberi: `CLAUDE.md`.
