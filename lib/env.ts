import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

/**
 * Tek noktadan, tip-güvenli env erişimi.
 *
 * Validation davranışı:
 * - Development/Test: gerçek validation. Eksik env varsa erken patlat.
 * - SKIP_ENV_VALIDATION=true: tamamen atla (CI test job'ları için).
 * - Vercel BUILD phase (NEXT_PHASE=phase-production-build): atla.
 *   Sebep: sitemap/feed/route handler'ları build-time generate edilebilir,
 *   o anda Vercel runtime env'leri set etmiş olsa bile build container'ı
 *   bunları doğrulamaya hazır olmayabilir. Runtime'da yine her şey
 *   process.env üzerinden çalışır.
 *
 * Defensive route handler'lar (sitemap.ts, feed.xml/route.ts, api/health)
 * env import etmez, direkt process.env + fallback kullanır.
 */

const isProductionBuild =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build'

const skipValidation =
  process.env.SKIP_ENV_VALIDATION === 'true' || isProductionBuild

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  skipValidation,
  emptyStringAsUndefined: true,
})
