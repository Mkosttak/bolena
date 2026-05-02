'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { logger } from '@/lib/utils/logger'

/**
 * Real User Monitoring (RUM) — gerçek kullanıcı tarayıcısından Web Vitals toplar.
 *
 * Metrikler:
 * - LCP (Largest Contentful Paint) — ana içerik ne kadar sürede göründü
 * - INP (Interaction to Next Paint) — kullanıcı tıklamasına yanıt süresi
 * - CLS (Cumulative Layout Shift) — sayfa atlama miktarı
 * - FCP (First Contentful Paint) — ilk piksel ne zaman çıktı
 * - TTFB (Time to First Byte) — sunucu yanıt süresi
 *
 * Production'da:
 * - LOG_HTTP_ENDPOINT veya Vercel Analytics ile dashboard'a gönder
 * - Eşik altı metrikleri error olarak logger'a yansıt
 */

const PERFORMANCE_THRESHOLDS = {
  LCP: 2500,    // ms — Google "Good" eşiği
  INP: 200,     // ms — Google "Good" eşiği
  CLS: 0.1,     // unitless — Google "Good" eşiği
  FCP: 1800,    // ms
  TTFB: 800,    // ms
} as const

type MetricName = keyof typeof PERFORMANCE_THRESHOLDS

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    const name = metric.name as MetricName
    const threshold = PERFORMANCE_THRESHOLDS[name]
    const isPoor = threshold !== undefined && metric.value > threshold

    // Production'da yalnızca poor metrikleri logla (gürültü azalt)
    if (process.env.NODE_ENV === 'production') {
      if (isPoor) {
        logger.warn(`[web-vitals] poor ${name}`, {
          name: metric.name,
          value: Math.round(metric.value),
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        })
      }

      // Vercel Analytics endpoint (auto-detect)
      // veya custom HTTP endpoint için:
      const endpoint = process.env.NEXT_PUBLIC_VITALS_ENDPOINT
      if (endpoint) {
        const body = JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          id: metric.id,
          page: window.location.pathname,
          ts: Date.now(),
        })
        // navigator.sendBeacon — sayfa kapanırken bile ulaşır
        if (navigator.sendBeacon) {
          navigator.sendBeacon(endpoint, body)
        } else {
          fetch(endpoint, { body, method: 'POST', keepalive: true }).catch(() => undefined)
        }
      }
    } else if (process.env.NODE_ENV === 'development') {
      // Dev'de tüm metrikleri konsola — anında görsel feedback
      const color = metric.rating === 'good' ? 'green' : metric.rating === 'needs-improvement' ? 'orange' : 'red'
      // eslint-disable-next-line no-console
      console.log(`%c[Web Vitals] ${metric.name} = ${Math.round(metric.value)}ms (${metric.rating})`, `color:${color}`)
    }
  })

  return null
}
