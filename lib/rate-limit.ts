/**
 * In-memory rate limit (single-region only).
 *
 * Production note: Vercel multi-region veya birden fazla instance varsa
 * bu yetersizdir; @upstash/ratelimit + Redis'e geçilmeli. API yüzeyi
 * aynı kalsın diye `limit()` Promise döner.
 */

type Bucket = {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

export type RateLimitConfig = {
  /** İsim — log/debug için. */
  name: string
  /** Pencere içinde izin verilen istek sayısı. */
  limit: number
  /** Pencere uzunluğu (saniye). */
  windowSeconds: number
}

function cleanupExpired(now: number) {
  if (store.size < 1000) return
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key)
  }
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = Date.now()
  cleanupExpired(now)

  const key = `${config.name}:${identifier}`
  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowSeconds * 1000
    store.set(key, { count: 1, resetAt })
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetAt,
      retryAfterSeconds: 0,
    }
  }

  if (existing.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    }
  }

  existing.count += 1
  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  }
}

export function getClientIdentifier(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export const rateLimits = {
  auth: { name: 'auth', limit: 5, windowSeconds: 60 } satisfies RateLimitConfig,
  qrOrder: { name: 'qr-order', limit: 10, windowSeconds: 60 } satisfies RateLimitConfig,
  contact: { name: 'contact', limit: 3, windowSeconds: 60 } satisfies RateLimitConfig,
  publicMutation: { name: 'public-mutation', limit: 20, windowSeconds: 60 } satisfies RateLimitConfig,
} as const

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.retryAfterSeconds > 0 ? { 'Retry-After': String(result.retryAfterSeconds) } : {}),
  }
}
