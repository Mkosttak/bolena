'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { RefreshCw, Loader2, Copy, Check } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { QrCodeDisplay } from './QrCodeDisplay'
import { updateQrEnabled, regenerateQrTokenAction } from '@/app/[locale]/admin/tables/actions'
import type { TableWithQr } from '@/types'

interface QrTableCardProps {
  table: TableWithQr
  baseUrl: string
}

export function QrTableCard({ table, baseUrl }: QrTableCardProps) {
  const t = useTranslations('siteSettings')
  const tCommon = useTranslations('common')
  const [qrToken, setQrToken] = useState(table.qr_token)
  const [qrEnabled, setQrEnabled] = useState(table.qr_enabled)
  const [copied, setCopied] = useState(false)
  const [regenDialogOpen, setRegenDialogOpen] = useState(false)
  const [isPendingToggle, startToggle] = useTransition()
  const [isPendingRegen, startRegen] = useTransition()

  const qrUrl = `${baseUrl}/qr/${qrToken}`

  const handleToggleQr = (checked: boolean) => {
    startToggle(async () => {
      const result = await updateQrEnabled(table.id, checked)
      if (result.error) {
        toast.error(t('toastUpdateFailed'), { description: result.error })
        return
      }
      setQrEnabled(checked)
      toast.success(checked ? t('toastPerTableQrOn') : t('toastPerTableQrOff'))
    })
  }

  function confirmRegenerate() {
    setRegenDialogOpen(false)
    startRegen(async () => {
      const result = await regenerateQrTokenAction(table.id)
      if (result.error) {
        toast.error(t('toastRegenerateFailed'), { description: result.error })
        return
      }
      if (result.newToken) {
        setQrToken(result.newToken)
        toast.success(t('regenerateSuccess'))
      }
    })
  }

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(qrUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Dialog open={regenDialogOpen} onOpenChange={setRegenDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>{t('regenerateQr')}</DialogTitle>
            <DialogDescription>{t('regenerateConfirm')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRegenDialogOpen(false)}
              disabled={isPendingRegen}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="button" onClick={confirmRegenerate} disabled={isPendingRegen}>
              {isPendingRegen ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
                  {t('regenerateConfirmCta')}
                </>
              ) : (
                t('regenerateConfirmCta')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    <div className={`bg-card border rounded-xl p-5 flex flex-col gap-4 transition-opacity ${!qrEnabled ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">{table.name}</p>
          {table.table_categories && (
            <p className="text-xs text-muted-foreground">{(table.table_categories as { name: string }).name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(isPendingToggle || isPendingRegen) && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
          <Switch
            checked={qrEnabled}
            onCheckedChange={handleToggleQr}
            disabled={isPendingToggle}
            aria-label={`${table.name} QR aktifliği`}
          />
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center">
        <QrCodeDisplay url={qrUrl} size={140} />
      </div>

      {/* URL + Copy */}
      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
        <p className="text-xs text-muted-foreground truncate flex-1 font-mono">/qr/{qrToken.slice(0, 8)}...</p>
        <button
          onClick={handleCopyUrl}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          title="URL kopyala"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Regenerate */}
      <button
        type="button"
        onClick={() => setRegenDialogOpen(true)}
        disabled={isPendingRegen}
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-destructive border border-dashed border-gray-200 hover:border-destructive/30 rounded-lg py-2 transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {t('regenerateQr')}
      </button>
    </div>
    </>
  )
}
