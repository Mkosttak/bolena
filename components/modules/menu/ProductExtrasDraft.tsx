'use client'

import { useState, useEffect } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

import { extraGroupSchema, extraOptionSchema } from '@/lib/validations/extras.schema'
import type { ExtraGroupInput, ExtraOptionInput } from '@/lib/validations/extras.schema'
import {
  addDraftGroup,
  updateDraftGroup,
  deleteDraftGroup,
  addDraftOption,
  updateDraftOption,
  deleteDraftOption,
  toggleDraftOptionActive,
} from '@/lib/utils/extras-draft.utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

export interface DraftExtraOption {
  tempId: string
  name_tr: string
  name_en: string
  price: number
  max_selections: number
  is_active: boolean
  sort_order: number
}

export interface DraftExtraGroup {
  tempId: string
  name_tr: string
  name_en: string
  is_required: boolean
  options: DraftExtraOption[]
}

interface ProductExtrasDraftProps {
  value: DraftExtraGroup[]
  onChange: (groups: DraftExtraGroup[]) => void
}

// ─── Grup Modal ───────────────────────────────────────────────────────────────

function GroupModal({
  open,
  initial,
  onSave,
  onClose,
}: {
  open: boolean
  initial?: DraftExtraGroup
  onSave: (data: ExtraGroupInput) => void
  onClose: () => void
}) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<ExtraGroupInput>({
      resolver: zodResolver(extraGroupSchema) as Resolver<ExtraGroupInput>,
      defaultValues: { name_tr: '', name_en: '', is_required: false },
    })

  // BUG FIX: defaultValues yalnızca mount'ta çalışır; open/initial değişince reset şart
  useEffect(() => {
    if (open) {
      reset({
        name_tr: initial?.name_tr ?? '',
        name_en: initial?.name_en ?? '',
        is_required: initial?.is_required ?? false,
      })
    }
  }, [open, initial, reset])

  const isRequired = watch('is_required')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Grup Düzenle' : 'Grup Ekle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => { onSave(d); onClose() })} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Grup Adı (TR)</Label>
              <Input {...register('name_tr')} />
              {errors.name_tr && <p className="text-xs text-destructive">{errors.name_tr.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Grup Adı (EN)</Label>
              <Input {...register('name_en')} />
              {errors.name_en && <p className="text-xs text-destructive">{errors.name_en.message}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isRequired} onCheckedChange={(v) => setValue('is_required', v)} />
            <Label className="font-normal cursor-pointer">Zorunlu</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Seçenek Modal ────────────────────────────────────────────────────────────

function OptionModal({
  open,
  initial,
  onSave,
  onClose,
}: {
  open: boolean
  initial?: DraftExtraOption
  onSave: (data: ExtraOptionInput) => void
  onClose: () => void
}) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<ExtraOptionInput>({
      resolver: zodResolver(extraOptionSchema) as Resolver<ExtraOptionInput>,
      defaultValues: { name_tr: '', name_en: '', price: 0, max_selections: 1, is_active: true, sort_order: 0 },
    })

  // BUG FIX: aynı stale form problemi
  useEffect(() => {
    if (open) {
      reset({
        name_tr: initial?.name_tr ?? '',
        name_en: initial?.name_en ?? '',
        price: initial?.price ?? 0,
        max_selections: initial?.max_selections ?? 1,
        is_active: initial?.is_active ?? true,
        sort_order: initial?.sort_order ?? 0,
      })
    }
  }, [open, initial, reset])

  const isActive = watch('is_active')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Seçenek Düzenle' : 'Seçenek Ekle'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => { onSave(d); onClose() })} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Seçenek Adı (TR)</Label>
              <Input {...register('name_tr')} />
              {errors.name_tr && <p className="text-xs text-destructive">{errors.name_tr.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Seçenek Adı (EN)</Label>
              <Input {...register('name_en')} />
              {errors.name_en && <p className="text-xs text-destructive">{errors.name_en.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Fiyat (0 = ücretsiz)</Label>
              <Input type="number" step="0.01" min={0} {...register('price', { valueAsNumber: true })} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Maks. Seçim</Label>
              <Input type="number" min={1} {...register('max_selections', { valueAsNumber: true })} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} />
            <Label className="font-normal cursor-pointer">Aktif</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────

export function ProductExtrasDraft({ value, onChange }: ProductExtrasDraftProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [groupModal, setGroupModal] = useState<{ open: boolean; group?: DraftExtraGroup }>({ open: false })
  const [optionModal, setOptionModal] = useState<{ open: boolean; groupTempId?: string; option?: DraftExtraOption }>({ open: false })

  function toggleExpand(tempId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.has(tempId) ? next.delete(tempId) : next.add(tempId)
      return next
    })
  }

  function handleSaveGroup(data: ExtraGroupInput) {
    const payload = { name_tr: data.name_tr, name_en: data.name_en, is_required: data.is_required ?? false }
    if (groupModal.group) {
      onChange(updateDraftGroup(value, groupModal.group.tempId, payload))
    } else {
      const updated = addDraftGroup(value, payload)
      onChange(updated)
      // yeni eklenen grubu otomatik aç
      const newest = updated[updated.length - 1]
      if (newest) setExpandedGroups((prev) => new Set(prev).add(newest.tempId))
    }
  }

  function handleSaveOption(data: ExtraOptionInput) {
    const groupTempId = optionModal.groupTempId!
    const payload = {
      name_tr: data.name_tr,
      name_en: data.name_en,
      price: data.price ?? 0,
      max_selections: data.max_selections ?? 1,
      is_active: data.is_active ?? true,
    }
    if (optionModal.option) {
      onChange(updateDraftOption(value, groupTempId, optionModal.option.tempId, payload))
    } else {
      onChange(addDraftOption(value, groupTempId, payload))
    }
  }

  return (
    <div className="space-y-4">
      <Separator />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Ekstra Grupları</h2>
          <p className="text-sm text-muted-foreground">
            Bu ürüne özel ekstralar (sos, pişirme derecesi, boyut vb.)
          </p>
        </div>
        <Button type="button" size="sm" onClick={() => setGroupModal({ open: true })}>
          <Plus className="h-4 w-4 mr-1.5" />
          Grup Ekle
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">Henüz ekstra grubu eklenmemiş.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setGroupModal({ open: true })}>
            <Plus className="h-4 w-4 mr-1.5" />
            İlk Grubu Ekle
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((group) => {
            const isExpanded = expandedGroups.has(group.tempId)
            return (
              <div key={group.tempId} className="rounded-lg border bg-card">
                <div className="flex items-center justify-between p-3">
                  <button
                    type="button"
                    className="flex items-center gap-2.5 flex-1 text-left"
                    onClick={() => toggleExpand(group.tempId)}
                  >
                    {isExpanded
                      ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{group.name_tr}</span>
                      <span className="text-xs text-muted-foreground">/ {group.name_en}</span>
                      {group.is_required && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">Zorunlu</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">({group.options.length} seçenek)</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button type="button" size="icon" variant="ghost" className="h-7 w-7"
                      onClick={() => setGroupModal({ open: true, group })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" size="icon" variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onChange(deleteDraftGroup(value, group.tempId))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-3 pb-3 pt-2 space-y-1.5">
                    {group.options.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-1 text-center">Henüz seçenek yok.</p>
                    ) : (
                      group.options.map((option) => (
                        <div key={option.tempId}
                          className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/30">
                          <div className="flex items-center gap-2.5">
                            <Switch
                              checked={option.is_active}
                              onCheckedChange={() =>
                                onChange(toggleDraftOptionActive(value, group.tempId, option.tempId))
                              }
                            />
                            <div>
                              <span className="text-sm font-medium">{option.name_tr}</span>
                              <span className="text-xs text-muted-foreground ml-1.5">/ {option.name_en}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium">
                              {option.price === 0 ? 'Ücretsiz' : `+₺${option.price.toFixed(2)}`}
                            </span>
                            <div className="flex gap-1">
                              <Button type="button" size="icon" variant="ghost" className="h-6 w-6"
                                onClick={() => setOptionModal({ open: true, groupTempId: group.tempId, option })}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button type="button" size="icon" variant="ghost"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => onChange(deleteDraftOption(value, group.tempId, option.tempId))}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <Button type="button" variant="outline" size="sm" className="w-full mt-1"
                      onClick={() => setOptionModal({ open: true, groupTempId: group.tempId })}>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Seçenek Ekle
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <GroupModal
        open={groupModal.open}
        initial={groupModal.group}
        onSave={handleSaveGroup}
        onClose={() => setGroupModal({ open: false })}
      />
      <OptionModal
        open={optionModal.open}
        initial={optionModal.option}
        onSave={handleSaveOption}
        onClose={() => setOptionModal({ open: false })}
      />
    </div>
  )
}
