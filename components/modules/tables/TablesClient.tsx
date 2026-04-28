'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { LayoutGrid, Settings } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { tablesKeys, fetchTablesWithOrder, fetchTableCategories } from '@/lib/queries/tables.queries'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCard } from './TableCard'
import { TableEditModal } from './TableEditModal'

interface TablesClientProps {
  locale: string
}

export function TablesClient({ locale }: TablesClientProps) {
  const t = useTranslations('tables')
  const [editModalOpen, setEditModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: tables, isLoading } = useQuery({
    queryKey: tablesKeys.list(),
    queryFn: fetchTablesWithOrder,
    refetchInterval: 15_000,
  })

  // Realtime: QR'dan veya başka kanaldan gelen sipariş değişikliklerini yakala
  useEffect(() => {
    const supabase = createClient()
    const invalidate = () => queryClient.invalidateQueries({ queryKey: tablesKeys.list() })
    const channel = supabase
      .channel('tables-client-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, invalidate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, invalidate)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  const { data: categories } = useQuery({
    queryKey: tablesKeys.categories(),
    queryFn: fetchTableCategories,
  })

  // Gruplandırma ve Sıralama
  const groupedTables = (tables ?? []).reduce(
    (acc, table) => {
      const catId = table.category_id || 'none'
      if (!acc[catId]) acc[catId] = []
      acc[catId].push(table)
      return acc
    },
    {} as Record<string, typeof tables>
  )

  // Her grubu kendi içinde doğal sayısal sıraya göre sırala (Masa 1, Masa 2, Masa 10)
  Object.values(groupedTables).forEach((group) => {
    group?.sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }))
  })

  // Kategorileri isimlerine göre sırala (kategorisi olmayanlar sona)
  const sortedCategoryIds = [
    ...(categories ?? [])
      .sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }))
      .map((c) => c.id),
    'none',
  ].filter((id) => (groupedTables[id]?.length ?? 0) > 0)

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] lg:min-h-screen">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute top-40 -left-16 h-56 w-56 rounded-full bg-chart-4/[0.07] blur-3xl" />
      </div>

      <div className="relative p-4 md:p-5 lg:p-6 space-y-5 md:space-y-6 max-w-[1600px] mx-auto">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4 sm:pb-6">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-heading tracking-tight text-foreground">
              {t('title')}
            </h1>
            <p className="text-[11px] text-muted-foreground/50 font-medium uppercase tracking-widest">
              {tables?.length ?? 0} {t('tablesInSection', { count: tables?.length ?? 0 }).toLowerCase()}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditModalOpen(true)}
            className="shrink-0 w-full sm:w-auto h-9 px-4 gap-2 rounded-xl border-border bg-card/50 hover:bg-muted transition-all duration-300"
          >
            <Settings className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <span className="text-xs font-semibold">{t('editTables')}</span>
          </Button>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : !tables?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 md:py-20 text-center">
            <div className="relative mx-auto flex max-w-md flex-col items-center gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <LayoutGrid className="h-8 w-8" strokeWidth={1} aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="text-base font-heading text-foreground">{t('noTables')}</p>
                <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-[200px] mx-auto">Sistemde henüz kayıtlı masa bulunmuyor.</p>
              </div>
              <Button
                variant="default"
                size="sm"
                className="rounded-xl px-8"
                onClick={() => setEditModalOpen(true)}
              >
                {t('addTable')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-10 md:space-y-12 pt-2">
            {sortedCategoryIds.map((catId) => {
              const categoryName =
                catId === 'none'
                  ? t('uncategorized')
                  : categories?.find((c) => c.id === catId)?.name ?? t('uncategorized')
              const tablesInGroup = groupedTables[catId]
              const count = tablesInGroup?.length ?? 0

              return (
                <section key={catId} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      {categoryName}
                    </h2>
                    <span className="text-[10px] font-medium text-muted-foreground/30">
                      ({count})
                    </span>
                    <div className="h-px flex-1 bg-border/40" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
                    {(tablesInGroup ?? []).map((table) => (
                      <TableCard key={table.id} table={table} locale={locale} />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        <TableEditModal open={editModalOpen} onClose={() => setEditModalOpen(false)} />
      </div>
    </div>
  )
}
