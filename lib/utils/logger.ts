/**
 * Centralized logger.
 *
 * Davranış:
 * - error → her ortamda console.error + production'da `reportError()` (Sentry/Datadog/Logtail)
 * - warn  → development'ta console.warn, prod'da sessiz
 * - info  → development'ta console.info, prod'da sessiz
 *
 * Production hata izleme:
 *   - SENTRY_DSN env var → @sentry/nextjs varsa dynamic import ile gönder
 *   - LOG_HTTP_ENDPOINT env var → JSON line POST (Datadog/Logtail/custom HTTP collector için)
 *   - Hiçbiri yoksa: yalnızca structured JSON `console.error` (Vercel/Cloud Logs zaten ingest eder)
 *
 * Eklemek için: `npm i @sentry/nextjs` ve sentry.client.config.ts/sentry.server.config.ts oluştur.
 */

type LogLevel = 'error' | 'warn' | 'info'

type LogEntry = {
  level: LogLevel
  message: string
  timestamp: string
  env: string | undefined
  extra?: unknown
}

const isProd = process.env.NODE_ENV === 'production'

function structuredLine(entry: LogEntry): string {
  try {
    return JSON.stringify(entry)
  } catch {
    return JSON.stringify({ ...entry, extra: '[unserializable]' })
  }
}

async function tryReportToSentry(entry: LogEntry): Promise<void> {
  if (!process.env.SENTRY_DSN) return
  try {
    // @ts-expect-error — opsiyonel paket; dynamic import build-time'da check edilmez
    const Sentry = await import('@sentry/nextjs').catch(() => null)
    if (!Sentry?.captureException) return
    if (entry.extra instanceof Error) {
      Sentry.captureException(entry.extra, { extra: { message: entry.message } })
    } else {
      Sentry.captureMessage(entry.message, {
        level: entry.level === 'error' ? 'error' : 'warning',
        extra: { extra: entry.extra },
      })
    }
  } catch {
    // Sentry SDK hatası uygulamayı bozmasın
  }
}

async function tryReportToHttp(entry: LogEntry): Promise<void> {
  const endpoint = process.env.LOG_HTTP_ENDPOINT
  if (!endpoint) return
  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: structuredLine(entry),
      // Don't await response; fire-and-forget. Use keepalive on edge for finalize.
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    // sessiz
  }
}

function reportError(entry: LogEntry): void {
  if (!isProd) return
  // Fire-and-forget: log call'larını block etme
  void tryReportToSentry(entry)
  void tryReportToHttp(entry)
}

function log(level: LogLevel, message: string, extra?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    extra,
  }

  if (level === 'error') {
    if (isProd) {
      // Structured JSON line — Vercel/Cloud Logs ingest eder
      console.error(structuredLine(entry))
      reportError(entry)
    } else {
      console.error(`[ERROR] ${message}`, extra ?? '')
    }
    return
  }

  if (isProd) return

  // eslint-disable-next-line no-console
  console[level](`[${level.toUpperCase()}] ${message}`, extra ?? '')
}

export const logger = {
  error: (message: string, extra?: unknown) => log('error', message, extra),
  warn: (message: string, extra?: unknown) => log('warn', message, extra),
  info: (message: string, extra?: unknown) => log('info', message, extra),
}
