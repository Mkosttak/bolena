'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import {
  workingHoursExceptionSchema,
  type WorkingHoursExceptionInput,
} from '@/lib/validations/working-hours.schema'
import { workingHoursKeys } from '@/lib/queries/working-hours.queries'
import {
  createWorkingHoursException,
  updateWorkingHoursException,
} from '@/app/[locale]/admin/working-hours/actions'
import type { WorkingHoursExceptionRow } from '@/lib/queries/working-hours.queries'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface ExceptionModalProps {
  open: boolean
  onClose: () => void
  exception?: WorkingHoursExceptionRow | null
}

export function ExceptionModal({ open, onClose, exception }: ExceptionModalProps) {
  'use no memo'
  const t = useTranslations('workingHours')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<WorkingHoursExceptionInput>({
    resolver: zodResolver(workingHoursExceptionSchema) as never,
    defaultValues: {
      date: '',
      is_open: true,
      open_time: '09:00',
      close_time: '22:00',
      description_tr: '',
      description_en: '',
    },
  })

  const isOpen = watch('is_open')

  useEffect(() => {
    if (open) {
      if (exception) {
        reset({
          date: exception.date,
          is_open: exception.is_open,
            open_time: exception.open_time?.slice(0, 5) ?? '09:00',
            close_time: exception.close_time?.slice(0, 5) ?? '22:00',
          description_tr: exception.description_tr ?? '',
          description_en: exception.description_en ?? '',
        })
      } else {
        reset({
          date: '',
          is_open: true,
          open_time: '09:00',
          close_time: '22:00',
          description_tr: '',
          description_en: '',
        })
      }
    }
  }, [open, exception, reset])

  const mutation = useMutation({
    mutationFn: (data: WorkingHoursExceptionInput) =>
      exception
        ? updateWorkingHoursException(exception.id, data)
        : createWorkingHoursException(data),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: workingHoursKeys.exceptions() })
      onClose()
    },
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {exception ? t('addException') : t('addException')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {/* Tarih */}
          <div className="space-y-1">
            <Label htmlFor="date">{t('exceptionDate')}</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Açık/Kapalı */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>{isOpen ? t('isOpen') : t('isClosed')}</Label>
            <Switch
              checked={isOpen}
              onCheckedChange={(v) => setValue('is_open', v)}
            />
          </div>

          {/* Saatler (sadece açıksa) */}
          {isOpen && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="open_time">{t('openTime')}</Label>
                <Input id="open_time" type="time" {...register('open_time')} />
                {errors.open_time && (
                  <p className="text-xs text-destructive">{errors.open_time.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="close_time">{t('closeTime')}</Label>
                <Input id="close_time" type="time" {...register('close_time')} />
                {errors.close_time && (
                  <p className="text-xs text-destructive">{errors.close_time.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Açıklama */}
          <div className="space-y-1">
            <Label htmlFor="description_tr">{t('descriptionTr')}</Label>
            <Input
              id="description_tr"
              placeholder="Yılbaşı tatili..."
              {...register('description_tr')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="description_en">{t('descriptionEn')}</Label>
            <Input
              id="description_en"
              placeholder="New Year holiday..."
              {...register('description_en')}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? tCommon('loading') : tCommon('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
