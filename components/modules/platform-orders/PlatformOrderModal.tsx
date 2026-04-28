'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, parseISO, isToday, isBefore, startOfDay } from 'date-fns'

import {
  platformOrderSchema,
  type PlatformOrderInput,
} from '@/lib/validations/platform-order.schema'
import { platformOrdersKeys } from '@/lib/queries/platform-orders.queries'
import { createPlatformOrder } from '@/app/[locale]/admin/platform-orders/actions'
import type { Order, PlatformType } from '@/types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface PlatformOrderModalProps {
  open: boolean
  onClose: () => void
  onCreated: (orderId: string, initialOrder: Order) => void
}

const PLATFORM_OPTIONS: { value: PlatformType; label: string; emoji: string }[] = [
  { value: 'yemeksepeti', label: 'Yemeksepeti', emoji: '🍽️' },
  { value: 'getir', label: 'Getir', emoji: '🟣' },
  { value: 'trendyol', label: 'Trendyol', emoji: '🟠' },
  { value: 'courier', label: 'Kurye', emoji: '🛵' },
]

function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 4) return digits
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`
  if (digits.length <= 9) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`
}

export function PlatformOrderModal({ open, onClose, onCreated }: PlatformOrderModalProps) {
  const t = useTranslations('platformOrders')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PlatformOrderInput>({
    resolver: zodResolver(platformOrderSchema) as never,
    defaultValues: {
      platform: 'yemeksepeti',
      customer_name: '',
      customer_phone: '',
      customer_address: '',
      delivery_date: todayStr(),
      delivery_time: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        platform: 'yemeksepeti',
        customer_name: '',
        customer_phone: '',
        customer_address: '',
        delivery_date: todayStr(),
        delivery_time: '',
        notes: '',
      })
    }
  }, [open, reset])

  const selectedPlatform = watch('platform')
  const watchPhone = watch('customer_phone')
  const watchDate = watch('delivery_date')

  function changeDate(delta: number) {
    const current = watchDate ? parseISO(watchDate) : new Date()
    const next = addDays(current, delta)
    if (isBefore(next, startOfDay(new Date()))) return
    setValue('delivery_date', format(next, 'yyyy-MM-dd'))
  }

  const isDateToday = watchDate ? isToday(parseISO(watchDate)) : true
  const dateLabel = watchDate
    ? isToday(parseISO(watchDate))
      ? tCommon('today')
      : format(parseISO(watchDate), 'dd.MM.yyyy')
    : ''

  const mutation = useMutation({
    mutationFn: (data: PlatformOrderInput) => createPlatformOrder(data),
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: platformOrdersKeys.all })

      const now = new Date().toISOString()
      const initialOrder: Order = {
        id: result.orderId!,
        type: 'platform',
        status: 'active',
        table_id: null,
        customer_name: variables.customer_name,
        customer_phone: variables.customer_phone.replace(/\s/g, '') || null,
        customer_address: variables.customer_address ?? null,
        platform: variables.platform,
        notes: variables.notes ?? null,
        subtotal: 0,
        discount_amount: 0,
        discount_type: null,
        total_amount: 0,
        payment_status: 'pending',
        created_at: now,
        updated_at: now,
        completed_at: null,
      }

      reset()
      onCreated(result.orderId!, initialOrder)
      onClose()
    },
  })

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('addOrder')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {/* Platform seçimi */}
          <div className="space-y-2">
            <Label>{t('platform')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORM_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  variant={selectedPlatform === opt.value ? 'default' : 'outline'}
                  className="justify-start gap-2"
                  onClick={() => setValue('platform', opt.value)}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </Button>
              ))}
            </div>
            {errors.platform && (
              <p className="text-xs text-destructive">{errors.platform.message}</p>
            )}
          </div>

          {/* Müşteri adı — zorunlu */}
          <div className="space-y-1.5">
            <Label htmlFor="customer_name">
              {t('customerName')}
              <span className="text-destructive ml-0.5" aria-hidden>
                *
              </span>
            </Label>
            <Input id="customer_name" autoComplete="off" {...register('customer_name')} />
            {errors.customer_name && (
              <p className="text-xs text-destructive">{errors.customer_name.message}</p>
            )}
          </div>

          {/* Telefon — masked input */}
          <div className="space-y-1.5">
            <Label htmlFor="customer_phone">
              {t('customerPhone')}
              <span className="text-xs text-muted-foreground ml-1">({tCommon('optional')})</span>
            </Label>
            <Input
              id="customer_phone"
              type="tel"
              inputMode="numeric"
              placeholder="0555 555 55 55"
              value={watchPhone ?? ''}
              onChange={(e) => setValue('customer_phone', formatPhoneInput(e.target.value))}
              autoComplete="off"
            />
            {errors.customer_phone && (
              <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
            )}
          </div>

          {/* Adres */}
          <div className="space-y-1.5">
            <Label htmlFor="customer_address">
              {t('customerAddress')}
              <span className="text-xs text-muted-foreground ml-1">({tCommon('optional')})</span>
            </Label>
            <Textarea
              id="customer_address"
              rows={2}
              {...register('customer_address')}
            />
            {errors.customer_address && (
              <p className="text-xs text-destructive">{errors.customer_address.message}</p>
            )}
          </div>

          {/* Teslim Tarihi + Saati */}
          <div className="space-y-1.5">
            <Label>{t('deliveryDate')}</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => changeDate(-1)}
                disabled={isDateToday || mutation.isPending}
                title={tCommon('prevDay')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex-1 relative">
                <Input
                  id="delivery_date"
                  type="date"
                  min={todayStr()}
                  {...register('delivery_date')}
                  disabled={mutation.isPending}
                  className="pr-20"
                />
                {dateLabel && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    {dateLabel}
                  </span>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => changeDate(1)}
                disabled={mutation.isPending}
                title={tCommon('nextDay')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Teslim Saati — opsiyonel */}
            <div className="space-y-1.5 mt-2">
              <Label htmlFor="delivery_time">
                {t('deliveryTime')}
                <span className="text-xs text-muted-foreground ml-1">({tCommon('optional')})</span>
              </Label>
              <Input
                id="delivery_time"
                type="time"
                {...register('delivery_time')}
                disabled={mutation.isPending}
              />
            </div>
          </div>

          {/* Not */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">
              {t('notes')}
              <span className="text-xs text-muted-foreground ml-1">({tCommon('optional')})</span>
            </Label>
            <Input
              id="notes"
              placeholder={tCommon('note')}
              {...register('notes')}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? tCommon('loading') : tCommon('add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
