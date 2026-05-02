import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// NOT: lib/env.ts import edilmedi — health endpoint env eksikse "degraded"
// dönmeli, build/runtime patlamalı değil. Direkt process.env defensive.

/**
 * Health check endpoint.
 *
 * - GET /api/health → uygulama + DB bağlantısı sağlam mı kontrolü
 * - Vercel/Render/UptimeRobot/Pingdom için kullanılır
 * - 200 OK + JSON status; herhangi bir alt sistem fail ise 503
 *
 * NOT: Public endpoint — auth yok. Hassas bilgi sızdırmaz, sadece yes/no.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

type ServiceStatus = { ok: boolean; latencyMs?: number; error?: string }

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return { ok: false, latencyMs: 0, error: 'Supabase env missing' }
  }
  try {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
    })
    // Hafif sorgu — public RLS-safe tablo (site_settings veya benzeri)
    const { error } = await supabase.from('site_settings').select('key').limit(1)
    if (error) return { ok: false, latencyMs: Date.now() - start, error: error.message }
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return { ok: false, latencyMs: Date.now() - start, error: (err as Error).message }
  }
}

export async function GET() {
  const startedAt = Date.now()

  const [database] = await Promise.all([checkDatabase()])

  const allHealthy = database.ok
  const status = allHealthy ? 200 : 503

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - startedAt,
      services: {
        database,
      },
      version: process.env.npm_package_version ?? 'unknown',
      env: process.env.NODE_ENV ?? 'unknown',
    },
    {
      status,
      headers: {
        'cache-control': 'no-store, max-age=0',
        'content-type': 'application/json',
      },
    },
  )
}
