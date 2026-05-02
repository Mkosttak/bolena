'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AdminModuleError({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error('[AdminError]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <p className="text-destructive font-semibold text-lg mb-2">Bir hata oluştu</p>
      {process.env.NODE_ENV !== 'production' && (
        <p className="text-muted-foreground text-xs mb-4 max-w-md font-mono">
          {error.message}
        </p>
      )}
      <button
        onClick={reset}
        className="text-sm underline text-primary hover:no-underline"
      >
        Tekrar Dene
      </button>
    </div>
  )
}
