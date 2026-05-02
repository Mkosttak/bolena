'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

/**
 * Root layout error boundary — global-error.tsx'ten önce devreye girer.
 * Layout korunur, sadece içerik replace edilir.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('[root-error] page crash', {
      message: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, marginBottom: 12 }}>Bir şeyler ters gitti</h2>
        <p style={{ marginBottom: 24, opacity: 0.7, fontSize: 14 }}>
          Sayfa yüklenirken hata oluştu. Tekrar denemek ister misiniz?
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '10px 24px',
            borderRadius: 999,
            border: '1px solid currentColor',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          Tekrar dene
        </button>
      </div>
    </div>
  )
}
