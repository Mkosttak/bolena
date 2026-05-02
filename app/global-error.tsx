'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

/**
 * Last-resort error boundary. Sadece root layout crash'lerinde devreye girer.
 * Kendi <html><body> tag'lerini render etmek zorundadır.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('[global-error] root crash', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <html lang="tr">
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF8F2',
          color: '#1B3C2A',
          margin: 0,
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>Beklenmeyen bir hata oluştu</h1>
          <p style={{ marginBottom: 24, opacity: 0.7 }}>
            Sorunu kaydettik. Sayfayı yeniden yüklemek ister misiniz?
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              border: 'none',
              backgroundColor: '#1B3C2A',
              color: '#FAF8F2',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tekrar dene
          </button>
          {error.digest && (
            <p style={{ marginTop: 24, fontSize: 11, opacity: 0.4 }}>
              Hata referansı: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
