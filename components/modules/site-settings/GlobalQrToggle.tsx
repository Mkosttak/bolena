'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2, Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { updateGlobalQrSetting } from '@/app/[locale]/admin/tables/actions'

interface GlobalQrToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export function GlobalQrToggle({ enabled, onToggle }: GlobalQrToggleProps) {
  const t = useTranslations('siteSettings')
  const [isPending, startTransition] = useTransition()

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await updateGlobalQrSetting(checked)
      if (result.error) {
        toast.error(t('toastUpdateFailed'), { description: result.error })
        return
      }
      onToggle(checked)
      toast.success(checked ? t('toastQrEnabled') : t('toastQrDisabled'))
    })
  }

  return (
    <div className="flex items-center justify-between rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">{t('globalQrToggle')}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('globalQrToggleDesc')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        <Switch
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={isPending}
          aria-label={t('globalQrAriaLabel')}
        />
      </div>
    </div>
  )
}
