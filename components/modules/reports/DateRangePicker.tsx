'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { CalendarIcon, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { buildDateRange, type DateRange, type DateRangeKey } from '@/lib/utils/reports.utils'

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const RANGE_KEYS: DateRangeKey[] = ['yesterday', 'today', 'week', 'month', 'custom']

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const t = useTranslations('reports.dateRange')
  const [open, setOpen] = useState(false)
  const [customStart, setCustomStart] = useState(value.start)
  const [customEnd, setCustomEnd] = useState(value.end)

  function handleKeySelect(key: DateRangeKey) {
    if (key === 'custom') {
      onChange(buildDateRange('custom', value.start, value.end))
      setOpen(true)
      return
    }
    const range = buildDateRange(key)
    onChange(range)
  }

  function handleCustomApply() {
    if (customStart > customEnd) return
    onChange(buildDateRange('custom', customStart, customEnd))
    setOpen(false)
  }

  const labelMap: Record<DateRangeKey, string> = {
    today: t('today'),
    yesterday: t('yesterday'),
    week: t('week'),
    month: t('month'),
    custom: t('custom'),
  }

  return (
    <div className="flex items-center gap-3">
      <Tabs 
        value={value.key} 
        onValueChange={(v) => handleKeySelect(v as DateRangeKey)}
        className="hidden sm:block"
      >
        <TabsList className="border bg-muted/50 dark:border-primary/20 dark:bg-muted/40">
          {RANGE_KEYS.map((key) => (
            <TabsTrigger key={key} value={key} className="text-xs px-4">
              {labelMap[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Mobilde dropdown olarak kalabilir veya hepsi yan yana sığabilir */}
      <div className="sm:hidden">
         {/* Basit kalsın şimdilik mobil için ayrı uğraşmıyorum */}
      </div>

      {value.key === 'custom' && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={(triggerProps) => (
              <Button
                {...triggerProps}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  'h-9 gap-2 px-3 border-dashed border-primary/50 text-primary bg-primary/5',
                  triggerProps.className
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                  {value.start} – {value.end}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            )}
          />
          <PopoverContent align="end" className="w-72 p-4 space-y-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('custom')}</p>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('startDate')}</Label>
                <Input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('endDate')}</Label>
                <Input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                className="w-full mt-2"
                disabled={customStart > customEnd}
                onClick={handleCustomApply}
              >
                {t('apply')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
