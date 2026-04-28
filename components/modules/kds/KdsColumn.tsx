import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Inbox } from 'lucide-react'
import { KdsCard } from './KdsCard'
import type { KdsGroup } from '@/lib/utils/kds.utils'
import { cn } from '@/lib/utils'

interface KdsColumnProps {
  title: string
  icon: ReactNode
  accentClassName?: string
  groups: KdsGroup[]
  onCardClick: (group: KdsGroup) => void
  onMarkReady: (itemIds: string[]) => void
}

export function KdsColumn({
  title,
  icon,
  accentClassName = 'bg-primary/12 text-primary border border-primary/15',
  groups,
  onCardClick,
  onMarkReady,
}: KdsColumnProps) {
  const t = useTranslations('kds')

  return (
    <div className="flex flex-col min-w-0 flex-1">
      {/* Kolon başlığı */}
      <div className="sticky top-[var(--kds-sticky-offset,4.5rem)] z-10 bg-background/95 backdrop-blur-md border-b border-border px-1 pb-3 pt-1 mb-3">
        <div className="flex flex-wrap items-center gap-2 min-h-9">
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              accentClassName
            )}
            aria-hidden
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-sm uppercase tracking-wide text-foreground truncate">
              {title}
            </h2>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">
              {groups.length > 0
                ? t('columnQueueCount', { count: groups.length })
                : t('columnQueueEmpty')}
            </p>
          </div>
          {groups.length > 0 && (
            <span className="bg-primary/10 text-primary text-xs font-bold rounded-full min-w-8 h-8 px-2 flex items-center justify-center tabular-nums shrink-0">
              {groups.length}
            </span>
          )}
        </div>
      </div>

      {/* Kart listesi */}
      {groups.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-14 px-4 text-center rounded-xl border border-dashed border-border/80 bg-muted/20">
          <Inbox className="h-10 w-10 text-muted-foreground/50" strokeWidth={1.25} aria-hidden />
          <p className="text-sm font-medium text-muted-foreground">{t('emptyColumn')}</p>
          <p className="text-xs text-muted-foreground/90 max-w-[16rem]">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-1 pb-6">
          {groups.map((group) => (
            <KdsCard
              key={group.id}
              group={group}
              onMarkReady={onMarkReady}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
