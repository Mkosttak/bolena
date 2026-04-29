/**
 * Centralized logger. In production, swap console.error with your
 * error tracking service (e.g. Sentry.captureException).
 */

type LogLevel = 'error' | 'warn' | 'info'

function log(level: LogLevel, message: string, extra?: unknown) {
  if (process.env.NODE_ENV === 'production') {
    // TODO: replace with Sentry or your preferred service
    // e.g. import * as Sentry from '@sentry/nextjs'; Sentry.captureException(extra)
    return
  }
  console[level](`[${level.toUpperCase()}] ${message}`, extra ?? '')
}

export const logger = {
  error: (message: string, extra?: unknown) => log('error', message, extra),
  warn: (message: string, extra?: unknown) => log('warn', message, extra),
  info: (message: string, extra?: unknown) => log('info', message, extra),
}
