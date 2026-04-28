import { useTranslations } from 'next-intl'
import { Clock, ChefHat, Calendar, AlertCircle } from 'lucide-react'
import { isAfter, startOfTomorrow, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { KdsItemRow } from './KdsItemRow'
import type { KdsGroup } from '@/lib/utils/kds.utils'
import { isKnownPlatformChannel } from '@/lib/utils/kds.utils'
import { cn } from '@/lib/utils'

interface KdsCardProps {
  group: KdsGroup
  onMarkReady: (itemIds: string[]) => void
  onCardClick: (group: KdsGroup) => void
}

const PLATFORM_EMOJI: Record<string, string> = {
  yemeksepeti: '🍽️',
  getir: '🟣',
  trendyol: '🟠',
  courier: '🛵',
}

export function KdsCard({ group, onMarkReady, onCardClick }: KdsCardProps) {
  const t = useTranslations('kds')

  const urgencyStyles = {
    normal: 'border-border bg-card',
    warning: 'border-orange-200 bg-orange-50/20',
    critical: 'border-red-200 bg-red-50/20',
  }

  const urgencyLeftBorder = {
    normal: 'bg-muted-foreground/10',
    warning: 'bg-orange-400',
    critical: 'bg-red-500',
  }

  const urgencyBadge = {
    normal: 'bg-secondary text-secondary-foreground',
    warning: 'bg-orange-100 text-orange-700 border border-orange-200',
    critical: 'bg-red-100 text-red-700 border border-red-200',
  }

  const headerLabel = (): string => {
    if (group.orderType === 'table') {
      return group.tableName ?? t('headerTable')
    }
    if (group.orderType === 'platform') {
      const emoji = group.platform ? PLATFORM_EMOJI[group.platform] ?? '' : ''
      const name = group.platform
        ? isKnownPlatformChannel(group.platform)
          ? t(`platform.${group.platform}`)
          : group.platform
        : t('headerPlatformDefault')
      const trimmed = `${emoji} ${group.customerName ?? name}`.trim()
      return trimmed
    }
    return (
      group.customerName ??
      (group.orderType === 'takeaway'
        ? t('headerTakeaway')
        : group.orderType === 'reservation'
          ? t('headerReservation')
          : t('headerCustomer'))
    )
  }

  const isReservation = group.orderType === 'reservation' || group.orderType === 'takeaway'

  /** Rezervasyon zamanına göre geri sayım / gecikme; yoksa sipariş bekleme süresi. */
  const getTimerDisplay = (): {
    label: string | null
    variant: 'late' | 'soon' | 'wait'
  } => {
    if (!isReservation || !group.reservationTime) {
      const label =
        group.elapsedMinutes < 1
          ? t('waitingTimeLessThan')
          : t('waitingTime', { minutes: group.elapsedMinutes })
      return { label, variant: 'wait' }
    }

    const resDateTime =
      group.reservationDate && group.reservationTime
        ? new Date(`${group.reservationDate}T${group.reservationTime}`)
        : null

    if (!resDateTime) {
      return {
        label: t('waitingTime', { minutes: group.elapsedMinutes }),
        variant: 'wait',
      }
    }

    const diffMs = resDateTime.getTime() - Date.now()
    const diffMin = Math.round(diffMs / 60000)

    if (diffMin > 60) {
      return { label: null, variant: 'wait' }
    }

    if (diffMin > 0) {
      return {
        label: t('minutesUntilReservation', { minutes: diffMin }),
        variant: 'soon',
      }
    }

    return {
      label: t('minutesLateReservation', { minutes: Math.abs(diffMin) }),
      variant: 'late',
    }
  }

  const { label: timerLabel, variant: timerVariant } = getTimerDisplay()
  const isLately = timerVariant === 'late'
  const isSoon = timerVariant === 'soon'
  let isTomorrow = false
  if (isReservation && group.reservationDate) {
    const resDate = parseISO(group.reservationDate)
    const tomorrow = startOfTomorrow()
    isTomorrow = isAfter(resDate, tomorrow) || resDate.getTime() === tomorrow.getTime()
  }

  return (
    <div
      className={cn(
        'rounded-xl border flex overflow-hidden transition-all duration-300 relative group',
        urgencyStyles[group.urgency],
        group.urgency === 'critical' && 'ring-2 ring-red-500/60 ring-offset-1 animate-pulse',
        group.urgency === 'warning' && 'shadow-md shadow-orange-300/40'
      )}
    >
      {/* Sol vurgu çizgisi */}
      <div className={cn('w-2 shrink-0', urgencyLeftBorder[group.urgency])} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — tıklanabilir */}
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-black/5 transition-colors border-b border-border/40"
          onClick={() => onCardClick(group)}
        >
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm sm:text-base text-foreground truncate tracking-tight lowercase first-letter:uppercase">
                {headerLabel()}
              </span>
              {group.orderType === 'takeaway' && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-black h-5 px-1.5 uppercase">
                  {t('takeaway')}
                </Badge>
              )}
              {group.orderType === 'reservation' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-black h-5 px-1.5 uppercase">
                  {t('reservation')}
                </Badge>
              )}
              {group.isQrOrder && (
                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-[10px] font-black h-5 px-1.5 uppercase dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800">
                  📱 Müşteri
                </Badge>
              )}
            </div>
            {isReservation && group.reservationTime && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-sm font-bold text-blue-700">
                  {group.reservationTime.substring(0, 5)}
                  {isTomorrow && (
                    <span className="ml-1.5 text-[10px] uppercase font-black bg-blue-100 px-1.5 py-0.5 rounded-sm">
                      {t('tomorrow')}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>

          {isReservation && timerLabel && (
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs font-bold rounded-lg px-2.5 py-1.5 shrink-0 transition-transform group-hover:scale-105',
                isLately
                  ? 'bg-red-600 text-white animate-pulse shadow-md'
                  : isSoon
                    ? 'bg-orange-500 text-white animate-pulse shadow-md'
                    : urgencyBadge[group.urgency]
              )}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {timerLabel}
            </div>
          )}
        </button>

        {/* Order note — Daha görünür */}
        {group.orderNotes && (
          <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-blue-900 leading-snug italic">
                {group.orderNotes}
              </p>
            </div>
          </div>
        )}

        {/* Items */}
        <div
          className="px-4 py-1 grow cursor-pointer active:opacity-70 transition-opacity"
          onClick={() => onCardClick(group)}
        >
          {group.items.map((item) => (
            <KdsItemRow
              key={item.id}
              item={item}
              onMarkReady={onMarkReady}
            />
          ))}
        </div>

        {/* Footer — Hazırlandı butonu */}
        <div className="px-4 pb-4 pt-2">
          <Button
            variant="default"
            size="lg"
            className={cn(
              'w-full gap-2.5 font-semibold rounded-xl min-h-[3.25rem] transition-all duration-200',
              'bg-gradient-to-b from-primary to-primary/88 text-primary-foreground shadow-md shadow-primary/20',
              'border border-primary/35 hover:from-primary/95 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/25',
              'active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2'
            )}
            onClick={(e) => {
              e.stopPropagation()
              onMarkReady(group.itemIds)
            }}
          >
            <ChefHat className="h-5 w-5 shrink-0 opacity-95" strokeWidth={2} />
            <span className="tracking-wide">
              {t('markReady')}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}
