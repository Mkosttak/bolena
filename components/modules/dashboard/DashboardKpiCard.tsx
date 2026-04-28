'use client'

import { ReactNode, KeyboardEvent } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'

export type DashboardKpiIconTone = 'emerald' | 'amber' | 'sky' | 'orange'

const TONE_STYLES: Record<
  DashboardKpiIconTone,
  { iconWrap: string; orb: string; bar: string }
> = {
  emerald: {
    iconWrap:
      'bg-emerald-500/12 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    orb: 'bg-emerald-500/[0.12]',
    bar: 'from-emerald-500/50 via-emerald-400/30 to-transparent',
  },
  amber: {
    iconWrap:
      'bg-amber-500/12 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
    orb: 'bg-amber-500/[0.12]',
    bar: 'from-amber-500/50 via-amber-400/30 to-transparent',
  },
  sky: {
    iconWrap:
      'bg-sky-500/12 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
    orb: 'bg-sky-500/[0.12]',
    bar: 'from-sky-500/50 via-sky-400/30 to-transparent',
  },
  orange: {
    iconWrap:
      'bg-orange-500/12 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300',
    orb: 'bg-orange-500/[0.12]',
    bar: 'from-orange-500/50 via-orange-400/30 to-transparent',
  },
}

interface DashboardKpiCardProps {
  title: string
  icon: ReactNode
  iconTone?: DashboardKpiIconTone
  mainValue: string | number
  subValue?: string | ReactNode
  footnote?: string
  className?: string
  onClick?: () => void
}

export function DashboardKpiCard({
  title,
  icon,
  iconTone = 'emerald',
  mainValue,
  subValue,
  footnote,
  className,
  onClick,
}: DashboardKpiCardProps) {
  const tone = TONE_STYLES[iconTone]

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <Card
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? title : undefined}
      className={cn(
        'relative overflow-hidden border-border/60 bg-card/80 shadow-sm backdrop-blur-sm transition-all duration-300',
        onClick &&
          'cursor-pointer hover:border-primary/35 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r to-transparent',
          tone.bar,
        )}
      />
      <CardContent className="relative p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium leading-snug text-muted-foreground pr-2">
            {title}
          </p>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              tone.iconWrap,
            )}
          >
            {icon}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            {mainValue}
          </span>
          {subValue !== undefined && subValue !== '' && (
            <span className="text-sm font-medium text-muted-foreground">
              {subValue}
            </span>
          )}
        </div>

        {footnote ? (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {footnote}
          </p>
        ) : null}

        {onClick ? (
          <ChevronRight
            className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/40 transition-transform duration-300 group-hover/card:translate-x-0.5 opacity-0 group-hover/card:opacity-100"
            aria-hidden
          />
        ) : null}

        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl',
            tone.orb,
          )}
        />
      </CardContent>
    </Card>
  )
}
