'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { CalendarClock, ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addDays, parseISO, isToday, isBefore, startOfDay } from 'date-fns'

import { reservationSchema } from '@/lib/validations/reservation.schema'
import type { ReservationInput } from '@/lib/validations/reservation.schema'
import { reservationsKeys } from '@/lib/queries/reservations.queries'
import { createReservation, updateReservation } from '@/app/[locale]/admin/reservations/actions'
import type { Reservation } from '@/types'
import type { Resolver } from 'react-hook-form'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ReservationModalProps {
  open: boolean
  onClose: () => void
  reservation?: Reservation | null
  defaultType?: 'reservation' | 'takeaway'
  onCreated?: (reservationId: string, orderId: string, customerName: string, type: 'reservation' | 'takeaway') => void
}

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

export function ReservationModal({
  open,
  onClose,
  reservation,
  defaultType = 'reservation',
  onCreated,
}: ReservationModalProps) {
  const t = useTranslations('reservations')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const isEdit = !!reservation

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema) as Resolver<ReservationInput>,
    defaultValues: {
      type: reservation?.type ?? defaultType,
      customer_name: reservation?.customer_name ?? '',
      customer_phone: reservation?.customer_phone ?? '',
      reservation_date: reservation?.reservation_date ?? todayStr(),
      reservation_time: reservation?.reservation_time ?? '',
      party_size: reservation?.party_size ?? undefined,
      notes: reservation?.notes ?? '',
    },
  })

  const watchType = watch('type')
  const watchDate = watch('reservation_date')
  const watchPhone = watch('customer_phone')

  useEffect(() => {
    if (open) {
      reset({
        type: reservation?.type ?? defaultType,
        customer_name: reservation?.customer_name ?? '',
        customer_phone: reservation?.customer_phone ?? '',
        reservation_date: reservation?.reservation_date ?? todayStr(),
        reservation_time: reservation?.reservation_time ?? '',
        party_size: reservation?.party_size ?? undefined,
        notes: reservation?.notes ?? '',
      })
    }
  }, [open, reservation, defaultType, reset])

  function changeDate(delta: number) {
    const current = watchDate ? parseISO(watchDate) : new Date()
    const next = addDays(current, delta)
    if (isBefore(next, startOfDay(new Date()))) return
    setValue('reservation_date', format(next, 'yyyy-MM-dd'))
  }

  const mutation = useMutation({
    mutationFn: async (data: ReservationInput) => {
      if (isEdit && reservation) {
        return updateReservation(reservation.id, data)
      }
      return createReservation(data)
    },
    onSuccess: (result, variables) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
      if (!isEdit && 'reservationId' in result && 'orderId' in result) {
        const r = result as { reservationId: string; orderId: string }
        onCreated?.(r.reservationId, r.orderId, variables.customer_name, variables.type)
      }
      onClose()
    },
  })

  const dateLabel = watchDate
    ? isToday(parseISO(watchDate))
      ? tCommon('today')
      : format(parseISO(watchDate), 'dd MMMM yyyy', { locale: undefined })
    : ''

  const isDateToday = watchDate ? isToday(parseISO(watchDate)) : true

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('editReservation')
              : watchType === 'takeaway'
              ? t('addTakeaway')
              : t('addReservation')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {/* Tip Seçici */}
          {!isEdit && (
            <div className="space-y-1.5">
              <Label>{t('type')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={watchType === 'reservation' ? 'default' : 'outline'}
                  className="justify-start gap-2 h-10"
                  onClick={() => setValue('type', 'reservation')}
                >
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  {t('typePending')}
                </Button>
                <Button
                  type="button"
                  variant={watchType === 'takeaway' ? 'default' : 'outline'}
                  className="justify-start gap-2 h-10"
                  onClick={() => setValue('type', 'takeaway')}
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  {t('typeTakeaway')}
                </Button>
              </div>
            </div>
          )}

          {/* Müşteri Adı — zorunlu */}
          <div className="space-y-1.5">
            <Label htmlFor="customer_name">
              {t('customerName')}
              <span className="text-destructive ml-0.5" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="customer_name"
              autoComplete="off"
              {...register('customer_name')}
              disabled={mutation.isPending}
            />
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
              placeholder={t('phonePlaceholder')}
              value={watchPhone ?? ''}
              onChange={(e) => setValue('customer_phone', formatPhoneInput(e.target.value))}
              disabled={mutation.isPending}
              autoComplete="off"
            />
            {errors.customer_phone && (
              <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
            )}
          </div>

          {/* Tarih + Saat */}
          {(watchType === 'reservation' || watchType === 'takeaway') && (
            <div className="space-y-1.5">
              <Label>
                {watchType === 'takeaway' ? t('pickupDate') : t('reservationDate')}
              </Label>
              <div className="flex items-center gap-2">
                {/* Önceki gün */}
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

                {/* Tarih input */}
                <div className="flex-1 relative">
                  <Input
                    id="reservation_date"
                    type="date"
                    min={todayStr()}
                    {...register('reservation_date')}
                    disabled={mutation.isPending}
                    className="pr-20"
                  />
                  {dateLabel && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      {dateLabel}
                    </span>
                  )}
                </div>

                {/* Sonraki gün */}
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
              {errors.reservation_date && (
                <p className="text-xs text-destructive">{errors.reservation_date.message}</p>
              )}

              {/* Saat */}
              <div className="space-y-1.5 mt-2">
                <Label htmlFor="reservation_time">
                  {watchType === 'takeaway' ? t('pickupTime') : t('reservationTime')}
                  {watchType === 'takeaway' && (
                    <span className="text-xs text-muted-foreground ml-1">({tCommon('optional')})</span>
                  )}
                </Label>
                <Input
                  id="reservation_time"
                  type="time"
                  {...register('reservation_time')}
                  disabled={mutation.isPending}
                />
              </div>
            </div>
          )}

          {/* Kişi Sayısı — opsiyonel */}
          <div className="space-y-1.5">
            <Label htmlFor="party_size">
              {t('partySize')}
              <span className="text-xs text-muted-foreground ml-1">({tCommon('optional')})</span>
            </Label>
            <Input
              id="party_size"
              type="number"
              min={1}
              {...register('party_size', { valueAsNumber: true })}
              disabled={mutation.isPending}
              placeholder="—"
            />
            {errors.party_size && (
              <p className="text-xs text-destructive">{errors.party_size.message}</p>
            )}
          </div>

          {/* Notlar */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Textarea
              id="notes"
              rows={2}
              {...register('notes')}
              disabled={mutation.isPending}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? tCommon('loading') : tCommon('save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
