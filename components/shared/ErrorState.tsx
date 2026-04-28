'use client'

import { useTranslations } from 'next-intl'

interface ErrorStateProps {
  message?: string
  retry?: () => void
}

export function ErrorState({ message, retry }: ErrorStateProps) {
  const tCommon = useTranslations('common')

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-destructive font-medium mb-2">{tCommon('error')}</p>
      {message && (
        <p className="text-muted-foreground text-sm mb-4">{message}</p>
      )}
      {retry && (
        <button
          onClick={retry}
          className="text-sm underline text-primary hover:no-underline"
        >
          {tCommon('retry')}
        </button>
      )}
    </div>
  )
}
