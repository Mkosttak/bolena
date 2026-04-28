'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { extraOptionSchema, type ExtraOptionInput } from '@/lib/validations/extras.schema'
import { extrasKeys } from '@/lib/queries/extras.queries'
import { createExtraOption, updateExtraOption } from '@/app/[locale]/admin/menu/actions'
import type { ExtraOption } from '@/types'

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
import { Switch } from '@/components/ui/switch'

interface ExtraOptionModalProps {
  open: boolean
  productId: string
  groupId?: string
  option?: ExtraOption
  onClose: () => void
}

export function ExtraOptionModal({ open, productId, groupId, option, onClose }: ExtraOptionModalProps) {
  const t = useTranslations('extras')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ExtraOptionInput>({
    resolver: zodResolver(extraOptionSchema) as Resolver<ExtraOptionInput>,
    defaultValues: {
      name_tr: '',
      name_en: '',
      price: 0,
      max_selections: 1,
      is_active: true,
      sort_order: 0,
    },
  })

  const isActive = watch('is_active')

  useEffect(() => {
    if (open) {
      reset({
        name_tr: option?.name_tr ?? '',
        name_en: option?.name_en ?? '',
        price: option?.price ?? 0,
        max_selections: option?.max_selections ?? 1,
        is_active: option?.is_active ?? true,
        sort_order: option?.sort_order ?? 0,
      })
    }
  }, [open, option, reset])

  const mutation = useMutation({
    mutationFn: (data: ExtraOptionInput) =>
      option
        ? updateExtraOption(option.id, data)
        : createExtraOption(groupId!, data),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: extrasKeys.byProduct(productId) })
      onClose()
    },
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{option ? t('editOption') : t('addOption')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('optionNameTr')}</Label>
              <Input {...register('name_tr')} disabled={mutation.isPending} />
              {errors.name_tr && (
                <p className="text-xs text-destructive">{errors.name_tr.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>{t('optionNameEn')}</Label>
              <Input {...register('name_en')} disabled={mutation.isPending} />
              {errors.name_en && (
                <p className="text-xs text-destructive">{errors.name_en.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('optionPrice')}</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                disabled={mutation.isPending}
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>{t('maxSelections')}</Label>
              <Input
                type="number"
                min={1}
                disabled={mutation.isPending}
                {...register('max_selections', { valueAsNumber: true })}
              />
              {errors.max_selections && (
                <p className="text-xs text-destructive">{errors.max_selections.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isActive}
              onCheckedChange={(v) => setValue('is_active', v)}
              disabled={mutation.isPending}
            />
            <Label className="font-normal cursor-pointer">{tCommon('active')}</Label>
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
