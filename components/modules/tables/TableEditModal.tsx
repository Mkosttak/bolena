'use client'

import { useState } from 'react'
import { type Resolver, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'

import { tableSchema, tableCategorySchema, type TableInput, type TableCategoryInput } from '@/lib/validations/tables.schema'
import { tablesKeys, fetchTablesWithOrder, fetchTableCategories } from '@/lib/queries/tables.queries'
import {
  createTable, updateTable, deleteTable,
  createTableCategory, updateTableCategory, deleteTableCategory,
} from '@/app/[locale]/admin/tables/actions'
import type { Table, TableCategory } from '@/types'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TableEditModalProps {
  open: boolean
  onClose: () => void
}

// ─── Table Form ───────────────────────────────────────────────────────────────

interface TableFormProps {
  defaultValues?: Table
  categories: TableCategory[]
  onSuccess: () => void
  onCancel: () => void
}

function TableForm({ defaultValues, categories, onSuccess, onCancel }: TableFormProps) {
  'use no memo'
  const tCommon = useTranslations('common')
  const t = useTranslations('tables')
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TableInput>({
    resolver: zodResolver(tableSchema) as Resolver<TableInput>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      category_id: defaultValues?.category_id ?? undefined,
    },
  })

  const currentCategoryId = watch('category_id')

  const mutation = useMutation({
    mutationFn: (data: TableInput) =>
      defaultValues ? updateTable(defaultValues.id, data) : createTable(data),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: tablesKeys.list() })
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t('tableName')}</Label>
        <Input {...register('name')} disabled={mutation.isPending} placeholder="Masa Adı" className="focus-visible:ring-primary" />
        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">{t('category')}</Label>
        <Select
          value={currentCategoryId ?? '__none__'}
          onValueChange={(v) => setValue('category_id', v === '__none__' ? null : v)}
          disabled={mutation.isPending}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {!currentCategoryId || currentCategoryId === '__none__'
                ? <span className="text-muted-foreground">Kategori seç...</span>
                : (categories.find(c => c.id === currentCategoryId)?.name ?? <span className="text-muted-foreground">Yükleniyor...</span>)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Kategorisiz</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}

// ─── Category Form ────────────────────────────────────────────────────────────

interface CategoryFormProps {
  defaultValues?: TableCategory
  onSuccess: () => void
  onCancel: () => void
}

function CategoryForm({ defaultValues, onSuccess, onCancel }: CategoryFormProps) {
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<TableCategoryInput>({
    resolver: zodResolver(tableCategorySchema) as Resolver<TableCategoryInput>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      sort_order: defaultValues?.sort_order ?? 0,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: TableCategoryInput) =>
      defaultValues ? updateTableCategory(defaultValues.id, data) : createTableCategory(data),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: tablesKeys.categories() })
      onSuccess()
    },
  })

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
      <div className="space-y-1">
        <Label>Kategori Adı</Label>
        <Input {...register('name')} disabled={mutation.isPending} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {tCommon('save')}
        </Button>
      </div>
    </form>
  )
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function TableEditModal({ open, onClose }: TableEditModalProps) {
  const tCommon = useTranslations('common')
  const t = useTranslations('tables')
  const queryClient = useQueryClient()

  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [showTableForm, setShowTableForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<TableCategory | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<TableCategory | null>(null)

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: tablesKeys.list(),
    queryFn: fetchTablesWithOrder,
    enabled: open,
  })

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: tablesKeys.categories(),
    queryFn: fetchTableCategories,
    enabled: open,
  })

  const deleteTableMutation = useMutation({
    mutationFn: (id: string) => deleteTable(id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: tablesKeys.list() })
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteTableCategory(id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: tablesKeys.categories() })
    },
  })

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('editTables')}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tables">
          <TabsList className="w-full">
            <TabsTrigger value="tables" className="flex-1">Masalar</TabsTrigger>
            <TabsTrigger value="categories" className="flex-1">Kategoriler</TabsTrigger>
          </TabsList>

          {/* ── Masalar Tab ── */}
          <TabsContent value="tables" className="mt-4">
            {showTableForm || editingTable ? (
              <TableForm
                defaultValues={editingTable ?? undefined}
                categories={categories ?? []}
                onSuccess={() => { setShowTableForm(false); setEditingTable(null) }}
                onCancel={() => { setShowTableForm(false); setEditingTable(null) }}
              />
            ) : (
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {tablesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))
                  ) : !tables?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {tCommon('noData')}
                    </p>
                  ) : (
                    tables.map((table) => (
                      <div key={table.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                        <div>
                          <span className="font-medium">{table.name}</span>
                          {table.table_categories && (
                            <span className="text-xs text-muted-foreground ml-2">
                              {table.table_categories.name}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => setEditingTable(table)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setTableToDelete(table)}
                            disabled={deleteTableMutation.isPending}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowTableForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addTable')}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ── Kategoriler Tab ── */}
          <TabsContent value="categories" className="mt-4">
            {showCategoryForm || editingCategory ? (
              <CategoryForm
                defaultValues={editingCategory ?? undefined}
                onSuccess={() => { setShowCategoryForm(false); setEditingCategory(null) }}
                onCancel={() => { setShowCategoryForm(false); setEditingCategory(null) }}
              />
            ) : (
              <div className="space-y-3">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {categoriesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))
                  ) : !categories?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {tCommon('noData')}
                    </p>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                        <span className="font-medium">{cat.name}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => setEditingCategory(cat)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setCategoryToDelete(cat)}
                            disabled={deleteCategoryMutation.isPending}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setShowCategoryForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addCategory')}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    {/* Masa Silme Onay Dialogu */}
    <Dialog open={!!tableToDelete} onOpenChange={(open) => !open && setTableToDelete(null)}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Masayı Sil
          </DialogTitle>
          <DialogDescription className="pt-2">
            <strong>&quot;{tableToDelete?.name}&quot;</strong> masasını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setTableToDelete(null)} className="flex-1 sm:flex-none">
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (tableToDelete) {
                deleteTableMutation.mutate(tableToDelete.id)
                setTableToDelete(null)
              }
            }}
            disabled={deleteTableMutation.isPending}
            className="flex-1 sm:flex-none font-bold"
          >
            {deleteTableMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Kategori Silme Onay Dialogu */}
    <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Kategoriyi Sil
          </DialogTitle>
          <DialogDescription className="pt-2">
            <strong>&quot;{categoryToDelete?.name}&quot;</strong> kategorisini silmek istediğinize emin misiniz? Bu kategorideki masalar kategorisiz kalacak.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setCategoryToDelete(null)} className="flex-1 sm:flex-none">
            Vazgeç
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (categoryToDelete) {
                deleteCategoryMutation.mutate(categoryToDelete.id)
                setCategoryToDelete(null)
              }
            }}
            disabled={deleteCategoryMutation.isPending}
            className="flex-1 sm:flex-none font-bold"
          >
            {deleteCategoryMutation.isPending ? 'Siliniyor...' : 'Evet, Sil'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>  
  )
}
