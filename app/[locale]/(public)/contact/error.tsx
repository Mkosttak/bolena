'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/button'

export default function ContactError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('[contact] route error', { message: error.message, digest: error.digest })
  }, [error])

  return (
    <div className="container mx-auto max-w-2xl px-4 py-24 text-center">
      <h2 className="text-2xl font-semibold mb-3">İletişim sayfası yüklenemedi</h2>
      <p className="text-muted-foreground mb-6">Tekrar denemek ister misiniz?</p>
      <Button onClick={reset}>Tekrar dene</Button>
    </div>
  )
}
