'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  findPeakHeatmapSlot,
  getHeatmapIntensity,
  type DateRange,
} from '@/lib/utils/reports.utils'
import { reportsKeys } from '@/lib/queries/reports.queries'
import { fetchHourlyHeatmap } from '@/app/[locale]/admin/reports/actions'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 9) // 09:00–22:00

interface HourlyHeatmapProps {
  dateRange: DateRange
}

export function HourlyHeatmap({ dateRange }: HourlyHeatmapProps) {
  const t = useTranslations('reports')

  const { data, isLoading } = useQuery({
    queryKey: reportsKeys.heatmap(dateRange.key, dateRange.start, dateRange.end),
    queryFn: () => fetchHourlyHeatmap(dateRange.start, dateRange.end),
    staleTime: 5 * 60 * 1000,
  })

  const points =
    'data' in (data ?? {})
      ? (data as { data: { dayOfWeek: number; hour: number; count: number }[] }).data
      : []

  const dayLabels: string[] = t.raw('heatmap.days') as string[]
  // Pazartesi başlangıçlı: 1,2,3,4,5,6,0
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]

  const countMap = new Map<string, number>()
  for (const p of points) {
    countMap.set(`${p.dayOfWeek}-${p.hour}`, p.count)
  }

  const maxCount = Math.max(...Array.from(countMap.values()), 1)
  const peak = findPeakHeatmapSlot(points)

  return (
    <Card>
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-sm font-semibold">{t('charts.hourlyHeatmap')}</CardTitle>
        {!isLoading && peak && peak.count > 0 && (
          <p className="text-xs text-muted-foreground font-normal">
            {t('heatmap.peakLine', {
              day: dayLabels[peak.dayOfWeek] ?? '',
              hour: String(peak.hour).padStart(2, '0'),
              count: peak.count,
            })}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-52 w-full rounded-lg" />
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              {/* Saat başlıkları */}
              <div className="flex mb-1 pl-10">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-[10px] text-muted-foreground font-medium"
                  >
                    {String(h).padStart(2, '0')}
                  </div>
                ))}
              </div>

              {/* Grid */}
              {orderedDays.map((day) => (
                <div key={day} className="flex items-center gap-0 mb-1">
                  <div className="w-10 text-[11px] text-muted-foreground font-medium shrink-0 pr-1 text-right">
                    {dayLabels[day]}
                  </div>
                  {HOURS.map((hour) => {
                    const count = countMap.get(`${day}-${hour}`) ?? 0
                    const intensity = getHeatmapIntensity(count, maxCount)
                    const mixPct = Math.round((intensity === 0 ? 0.06 : 0.1 + intensity * 0.9) * 100)

                    return (
                      <div
                        key={hour}
                        className="flex-1 aspect-square rounded-sm mx-0.5 flex items-center justify-center group relative"
                        style={{
                          backgroundColor: `color-mix(in oklch, var(--chart-1) ${mixPct}%, transparent)`,
                        }}
                        title={t('heatmap.cellTooltip', {
                          day: dayLabels[day] ?? '',
                          hour: String(hour).padStart(2, '0'),
                          count,
                        })}
                      >
                        {count > 0 && intensity > 0.4 && (
                          <span className="text-[9px] font-bold text-primary-foreground drop-shadow-sm leading-none">
                            {count}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* Lejant */}
              <div className="flex items-center gap-2 mt-3 pl-10">
                <span className="text-[10px] text-muted-foreground">{t('heatmap.low')}</span>
                {[0.06, 0.2, 0.4, 0.6, 0.8, 1].map((a) => (
                  <div
                    key={a}
                    className="w-4 h-4 rounded-sm"
                    style={{
                      backgroundColor: `color-mix(in oklch, var(--chart-1) ${Math.round(a * 100)}%, transparent)`,
                    }}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground">{t('heatmap.high')}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
