'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

import { extrasKeys, fetchExtraGroupsByProduct } from '@/lib/queries/extras.queries'
import {
  deleteExtraGroup,
  deleteExtraOption,
  toggleExtraOptionActive,
} from '@/app/[locale]/admin/menu/actions'
import type { ExtraGroup, ExtraOption } from '@/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ExtraGroupModal } from '@/components/modules/extras/ExtraGroupModal'
import { ExtraOptionModal } from '@/components/modules/extras/ExtraOptionModal'

interface ProductExtrasPanelProps {
  productId: string
}

export function ProductExtrasPanel({ productId }: ProductExtrasPanelProps) {
  const t = useTranslations('menu')
  const tCommon = useTranslations('common')
  const tExtras = useTranslations('extras')
  const queryClient = useQueryClient()

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [groupModal, setGroupModal] = useState<{ open: boolean; group?: ExtraGroup }>({
    open: false,
  })
  const [optionModal, setOptionModal] = useState<{
    open: boolean
    groupId?: string
    option?: ExtraOption
  }>({ open: false })

  const { data: groups, isLoading } = useQuery({
    queryKey: extrasKeys.byProduct(productId),
    queryFn: () => fetchExtraGroupsByProduct(productId),
  })

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => deleteExtraGroup(id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(t('groupDeleted'))
      queryClient.invalidateQueries({ queryKey: extrasKeys.byProduct(productId) })
    },
  })

  const deleteOptionMutation = useMutation({
    mutationFn: (id: string) => deleteExtraOption(id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(t('optionDeleted'))
      queryClient.invalidateQueries({ queryKey: extrasKeys.byProduct(productId) })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleExtraOptionActive(id, isActive),
    onSuccess: (result, variables) => {
      if (result.error) { toast.error(result.error); return }
      queryClient.setQueryData<ExtraGroup[]>(extrasKeys.byProduct(productId), (old) =>
        old?.map((g) => ({
          ...g,
          extra_options: g.extra_options?.map((o) =>
            o.id === variables.id ? { ...o, is_active: variables.isActive } : o
          ),
        }))
      )
    },
  })

  function toggleExpand(groupId: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t('extrasTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('extrasDesc')}</p>
        </div>
        <Button size="sm" onClick={() => setGroupModal({ open: true })}>
          <Plus className="h-4 w-4 mr-1.5" />
          {t('addGroup')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : !groups?.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">{t('noExtras')}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setGroupModal({ open: true })}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {t('addFirstGroup')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const isExpanded = expandedGroups.has(group.id)
            const optionCount = group.extra_options?.length ?? 0

            return (
              <div key={group.id} className="rounded-lg border bg-card">
                {/* Grup başlığı */}
                <div className="flex items-center justify-between p-3">
                  <button
                    type="button"
                    className="flex items-center gap-2.5 flex-1 text-left"
                    onClick={() => toggleExpand(group.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{group.name_tr}</span>
                      <span className="text-xs text-muted-foreground">/ {group.name_en}</span>
                      {group.is_required && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">
                          {tExtras('isRequired')}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ({optionCount} {tExtras('addOption').toLowerCase()})
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setGroupModal({ open: true, group })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteGroupMutation.mutate(group.id)}
                      disabled={deleteGroupMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Seçenekler */}
                {isExpanded && (
                  <div className="border-t px-3 pb-3 pt-2 space-y-1.5">
                    {optionCount === 0 ? (
                      <p className="text-xs text-muted-foreground py-1 text-center">
                        {t('noOptions')}
                      </p>
                    ) : (
                      (group.extra_options ?? []).map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2 bg-muted/30"
                        >
                          <div className="flex items-center gap-2.5">
                            <Switch
                              checked={option.is_active}
                              onCheckedChange={(checked) =>
                                toggleActiveMutation.mutate({ id: option.id, isActive: checked })
                              }
                            />
                            <div>
                              <span className="text-sm font-medium">{option.name_tr}</span>
                              <span className="text-xs text-muted-foreground ml-1.5">
                                / {option.name_en}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-sm text-right">
                              <span className="font-medium">
                                {option.price === 0
                                  ? t('free')
                                  : `+₺${Number(option.price).toFixed(2)}`}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1.5">
                                maks.{option.max_selections}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() =>
                                  setOptionModal({ open: true, groupId: group.id, option })
                                }
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={() => deleteOptionMutation.mutate(option.id)}
                                disabled={deleteOptionMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-1"
                      onClick={() => setOptionModal({ open: true, groupId: group.id })}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {t('addOption')}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ExtraGroupModal
        open={groupModal.open}
        productId={productId}
        group={groupModal.group}
        onClose={() => setGroupModal({ open: false })}
      />

      <ExtraOptionModal
        open={optionModal.open}
        productId={productId}
        groupId={optionModal.groupId}
        option={optionModal.option}
        onClose={() => setOptionModal({ open: false })}
      />
    </div>
  )
}
