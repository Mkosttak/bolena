'use client'

import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Pencil, Trash2, Plus, Eye, EyeOff } from 'lucide-react'

import { categorySchema, type CategoryInput } from '@/lib/validations/menu.schema'
import { menuKeys, fetchCategories } from '@/lib/queries/menu.queries'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoriesOrder,
  toggleCategoryActive,
} from '@/app/[locale]/admin/menu/actions'
import type { Category } from '@/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface CategoryModalProps {
  open: boolean
  onClose: () => void
}

interface CategoryFormProps {
  defaultValues?: Category
  onSuccess: () => void
  onCancel: () => void
}

function CategoryForm({ defaultValues, onSuccess, onCancel }: CategoryFormProps) {
  const t = useTranslations('menu')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema) as Resolver<CategoryInput>,
    defaultValues: {
      name_tr: defaultValues?.name_tr ?? '',
      name_en: defaultValues?.name_en ?? '',
      sort_order: defaultValues?.sort_order ?? 0,
      is_active: defaultValues?.is_active ?? true,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: CategoryInput) =>
      defaultValues ? updateCategory(defaultValues.id, data) : createCategory(data),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>{t('nameTr')}</Label>
          <Input {...register('name_tr')} />
          {errors.name_tr && (
            <p className="text-xs text-destructive">{errors.name_tr.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>{t('nameEn')}</Label>
          <Input {...register('name_en')} />
          {errors.name_en && (
            <p className="text-xs text-destructive">{errors.name_en.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}

interface SortableCategoryItemProps {
  cat: Category
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, current: boolean) => void
  isDeleting: boolean
  isTogglingId: string | null
}

function SortableCategoryItem({
  cat,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting,
  isTogglingId,
}: SortableCategoryItemProps) {
  const t = useTranslations('menu')
  const tCommon = useTranslations('common')
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-md border px-3 py-2 bg-background ${
        isDragging ? 'shadow-lg border-primary/50 opacity-80' : ''
      } ${!cat.is_active ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:text-primary transition-colors touch-none"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{cat.name_tr}</span>
          <span className="text-sm text-muted-foreground">/ {cat.name_en}</span>
          {!cat.is_active && (
            <Badge variant="secondary">{tCommon('passive')}</Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {/* Görünürlük toggle */}
        <Button
          size="icon"
          variant="ghost"
          className={`h-7 w-7 ${cat.is_active ? 'text-muted-foreground' : 'text-amber-600'}`}
          title={cat.is_active ? t('deactivateCategory') : t('activateCategory')}
          onClick={() => onToggleActive(cat.id, cat.is_active)}
          disabled={isTogglingId === cat.id}
        >
          {cat.is_active ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => onEdit(cat)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(cat.id)}
          disabled={isDeleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

export function CategoryModal({ open, onClose }: CategoryModalProps) {
  const t = useTranslations('menu')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: menuKeys.categories(),
    queryFn: fetchCategories,
    enabled: open,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleCategoryActive(id, isActive),
    onMutate: ({ id }) => setTogglingId(id),
    onSettled: () => setTogglingId(null),
    onSuccess: (result, variables) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(t('toggleCategorySuccess'))
      // Optimistic cache update
      queryClient.setQueryData<Category[]>(menuKeys.categories(), (old) =>
        old?.map((c) =>
          c.id === variables.id ? { ...c, is_active: variables.isActive } : c
        )
      )
    },
    onError: () => toast.error(tCommon('error')),
  })

  const handleClose = () => {
    setEditingCategory(null)
    setShowForm(false)
    onClose()
  }

  const handleFormSuccess = () => {
    setEditingCategory(null)
    setShowForm(false)
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const orderMutation = useMutation({
    mutationFn: (orders: { id: string; sort_order: number }[]) => updateCategoriesOrder(orders),
    onSuccess: (result) => {
      if (result.error) toast.error(result.error)
      queryClient.invalidateQueries({ queryKey: menuKeys.categories() })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !categories) return

    const oldIndex = categories.findIndex((c) => c.id === active.id)
    const newIndex = categories.findIndex((c) => c.id === over.id)
    const newOrder = arrayMove(categories, oldIndex, newIndex)

    queryClient.setQueryData(menuKeys.categories(), newOrder)

    orderMutation.mutate(
      newOrder.map((cat, idx) => ({ id: cat.id, sort_order: idx }))
    )
  }

  const isFormVisible = showForm || editingCategory !== null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('editCategories')}</DialogTitle>
        </DialogHeader>

        {isFormVisible ? (
          <CategoryForm
            defaultValues={editingCategory ?? undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => { setEditingCategory(null); setShowForm(false) }}
          />
        ) : (
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-2 py-1">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))
              ) : !categories?.length ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {tCommon('noData')}
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={categories.map((c) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {categories.map((cat) => (
                        <SortableCategoryItem
                          key={cat.id}
                          cat={cat}
                          onEdit={setEditingCategory}
                          onDelete={(id) => deleteMutation.mutate(id)}
                          onToggleActive={(id, current) =>
                            toggleActiveMutation.mutate({ id, isActive: !current })
                          }
                          isDeleting={deleteMutation.isPending}
                          isTogglingId={togglingId}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addCategory')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
