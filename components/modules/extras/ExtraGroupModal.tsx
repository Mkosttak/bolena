'use client'

import { useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { extraGroupSchema, type ExtraGroupInput } from '@/lib/validations/extras.schema'
import { extrasKeys } from '@/lib/queries/extras.queries'
import { createExtraGroup, updateExtraGroup } from '@/app/[locale]/admin/menu/actions'
import type { ExtraGroup } from '@/types'

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

interface ExtraGroupModalProps {
  open: boolean
  productId: string
  group?: ExtraGroup
  onClose: () => void
}

export function ExtraGroupModal({ open, productId, group, onClose }: ExtraGroupModalProps) {
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
  } = useForm<ExtraGroupInput>({
    resolver: zodResolver(extraGroupSchema) as Resolver<ExtraGroupInput>,
    defaultValues: {
      name_tr: '',
      name_en: '',
      is_required: false,
      max_bir_secim: false,
    },
  })

  const isRequired = watch('is_required')
  const isSingleSelect = watch('max_bir_secim')

  useEffect(() => {
    if (open) {
      reset({
        name_tr: group?.name_tr ?? '',
        name_en: group?.name_en ?? '',
        is_required: group?.is_required ?? false,
        max_bir_secim: group?.max_bir_secim ?? false,
      })
    }
  }, [open, group, reset])

  const mutation = useMutation({
    mutationFn: (data: ExtraGroupInput) =>
      group ? updateExtraGroup(group.id, data) : createExtraGroup(productId, data),
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
          <DialogTitle>{group ? t('editGroup') : t('addGroup')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{t('groupNameTr')}</Label>
              <Input {...register('name_tr')} disabled={mutation.isPending} />
              {errors.name_tr && (
                <p className="text-xs text-destructive">{errors.name_tr.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>{t('groupNameEn')}</Label>
              <Input {...register('name_en')} disabled={mutation.isPending} />
              {errors.name_en && (
                <p className="text-xs text-destructive">{errors.name_en.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isRequired}
              onCheckedChange={(v) => setValue('is_required', v)}
              disabled={mutation.isPending}
            />
            <Label className="font-normal cursor-pointer">{t('isRequired')}</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              checked={isSingleSelect}
              onCheckedChange={(v) => setValue('max_bir_secim', v)}
              disabled={mutation.isPending}
            />
            <Label className="font-normal cursor-pointer">{t('isSingleSelect')}</Label>
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
