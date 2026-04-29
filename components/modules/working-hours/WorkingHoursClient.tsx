'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CalendarDays, Clock, Plus, Pencil, Trash2 } from 'lucide-react'

import {
  workingHoursKeys,
  fetchWeeklyHours,
  fetchWorkingHoursExceptions,
  type WorkingHoursRow,
  type WorkingHoursExceptionRow,
} from '@/lib/queries/working-hours.queries'
import {
  updateWorkingHours,
  deleteWorkingHoursException,
} from '@/app/[locale]/admin/working-hours/actions'
import type { WorkingHoursInput } from '@/lib/validations/working-hours.schema'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ExceptionModal } from './ExceptionModal'

interface WorkingHoursClientProps {
  /** Site ayarları hub sekmesinde gömülü gösterim */
  embeddedInHub?: boolean
}

export function WorkingHoursClient({ embeddedInHub = false }: WorkingHoursClientProps) {
  const t = useTranslations('workingHours')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [exceptionModal, setExceptionModal] = useState<{
    open: boolean
    exception?: WorkingHoursExceptionRow | null
  }>({ open: false })

  const { data: weeklyHours = [], isLoading: weeklyLoading } = useQuery({
    queryKey: workingHoursKeys.weekly(),
    queryFn: fetchWeeklyHours,
  })

  const { data: exceptions = [], isLoading: exceptionsLoading } = useQuery({
    queryKey: workingHoursKeys.exceptions(),
    queryFn: fetchWorkingHoursExceptions,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: WorkingHoursInput }) =>
      updateWorkingHours(id, input),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.weekly() })
    },
  })

  const deleteExceptionMutation = useMutation({
    mutationFn: (id: string) => deleteWorkingHoursException(id),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.exceptions() })
    },
  })

  return (
    <div
      className={cn(
        'mx-auto w-full max-w-5xl space-y-8',
        embeddedInHub ? 'px-0 py-0' : 'px-4 py-6 md:px-6'
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.07] via-muted/40 to-background p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
                {t('title')}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground leading-relaxed">
                {t('subtitle')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border/60">
              <Clock className="h-4 w-4" />
            </span>
            {t('weeklySchedule')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t('openTime')} / {t('closeTime')} — {t('isClosed')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-5 md:p-6">
          {weeklyLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {weeklyHours.map((row, idx) => (
                <WeeklyHoursRow
                  key={row.id}
                  row={row}
                  onUpdate={(input) => updateMutation.mutate({ id: row.id, input })}
                  isLoading={updateMutation.isPending}
                  t={t}
                  zebra={idx % 2 === 0}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-4 border-b border-border/50 bg-muted/20 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border/60">
                <CalendarDays className="h-4 w-4" />
              </span>
              {t('exceptions')}
            </CardTitle>
            <CardDescription className="mt-1 text-xs sm:text-sm">
              {t('exceptionDate')} · {t('isOpen')} / {t('isClosed')}
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-2 self-start sm:self-auto"
            onClick={() => setExceptionModal({ open: true, exception: null })}
          >
            <Plus className="h-4 w-4" />
            {t('addException')}
          </Button>
        </CardHeader>
        <CardContent className="p-4 pt-5 md:p-6">
          {exceptionsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : exceptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/15 py-12 text-center">
              <CalendarDays className="mb-2 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{tCommon('noData')}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => setExceptionModal({ open: true, exception: null })}
              >
                <Plus className="h-4 w-4" />
                {t('addException')}
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {exceptions.map((exc) => (
                <li
                  key={exc.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-[box-shadow] hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <Badge
                      variant={exc.is_open ? 'default' : 'secondary'}
                      className="w-fit text-xs font-medium"
                    >
                      {exc.is_open ? t('isOpen') : t('isClosed')}
                    </Badge>
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium tabular-nums">{exc.date}</p>
                      {exc.is_open && exc.open_time && exc.close_time && (
                        <p className="text-xs text-muted-foreground">
                          {exc.open_time} – {exc.close_time}
                        </p>
                      )}
                      {exc.description_tr ? (
                        <p className="text-xs italic text-muted-foreground line-clamp-2">
                          {exc.description_tr}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 justify-end gap-1 border-t border-border/40 pt-2 sm:border-0 sm:pt-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9"
                      onClick={() => setExceptionModal({ open: true, exception: exc })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => deleteExceptionMutation.mutate(exc.id)}
                      disabled={deleteExceptionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <ExceptionModal
        open={exceptionModal.open}
        onClose={() => setExceptionModal({ open: false })}
        exception={exceptionModal.exception}
      />
    </div>
  )
}

// ─── Günlük satır bileşeni ─────────────────────────────────────────────────────

type TFn = ReturnType<typeof useTranslations<'workingHours'>>

interface WeeklyHoursRowProps {
  row: WorkingHoursRow
  onUpdate: (input: WorkingHoursInput) => void
  isLoading: boolean
  t: TFn
  zebra: boolean
}

const DEFAULT_OPEN = '09:00'
const DEFAULT_CLOSE = '22:00'

function WeeklyHoursRow({ row, onUpdate, isLoading, t, zebra }: WeeklyHoursRowProps) {
  const [openTime, setOpenTime] = useState(row.open_time ?? DEFAULT_OPEN)
  const [closeTime, setCloseTime] = useState(row.close_time ?? DEFAULT_CLOSE)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!row.open_time) setOpenTime(DEFAULT_OPEN)
    else setOpenTime(row.open_time.slice(0, 5))

    if (!row.close_time) setCloseTime(DEFAULT_CLOSE)
    else setCloseTime(row.close_time.slice(0, 5))
  }, [row.open_time, row.close_time])

  const DAY_KEYS = ['0', '1', '2', '3', '4', '5', '6'] as const

  function handleSave(isOpen: boolean) {
    onUpdate({
      day_of_week: row.day_of_week,
      is_open: isOpen,
      open_time: isOpen ? (openTime || DEFAULT_OPEN) : null,
      close_time: isOpen ? (closeTime || DEFAULT_CLOSE) : null,
    })
  }

  return (
    <div
      className={[
        'flex flex-col gap-4 rounded-xl border border-border/50 p-4 transition-colors sm:flex-row sm:items-center sm:gap-4',
        zebra ? 'bg-muted/15' : 'bg-background',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3 sm:w-36 sm:shrink-0">
        <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          {t(`days.${DAY_KEYS[row.day_of_week]}` as Parameters<typeof t>[0])}
        </span>
        <div className="sm:hidden">
          <Switch
            checked={row.is_open}
            disabled={isLoading}
            onCheckedChange={(v) => handleSave(v)}
          />
        </div>
      </div>

      <div className="hidden sm:block">
        <Switch
          checked={row.is_open}
          disabled={isLoading}
          onCheckedChange={(v) => handleSave(v)}
        />
      </div>

      {row.is_open ? (
        <div className="flex w-full flex-1 flex-wrap items-center gap-2 sm:flex-nowrap">
          <Input
            type="time"
            className="h-10 flex-1 text-sm sm:h-9 sm:max-w-[7.5rem]"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            onBlur={() => handleSave(true)}
          />
          <span className="text-muted-foreground text-sm">–</span>
          <Input
            type="time"
            className="h-10 flex-1 text-sm sm:h-9 sm:max-w-[7.5rem]"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
            onBlur={() => handleSave(true)}
          />
        </div>
      ) : (
        <span className="text-sm font-medium text-muted-foreground sm:flex-1">{t('isClosed')}</span>
      )}
    </div>
  )
}
