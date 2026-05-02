'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Plus, CheckCircle, Package } from 'lucide-react'

import {
  platformOrdersKeys,
  fetchActivePlatformOrders,
  fetchPlatformOrderHistory,
  PLATFORM_HISTORY_PAGE_SIZE,
} from '@/lib/queries/platform-orders.queries'
import { deliverPlatformOrder } from '@/app/[locale]/admin/platform-orders/actions'
import type { Order } from '@/types'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PlatformOrderModal } from './PlatformOrderModal'
import { PlatformOrderScreen } from './PlatformOrderScreen'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PLATFORM_LABELS: Record<string, string> = {
  yemeksepeti: '🍽️ Yemeksepeti',
  getir: '🟣 Getir',
  trendyol: '🟠 Trendyol',
  courier: '🛵 Kurye',
}

export function PlatformOrdersClient() {
  const t = useTranslations('platformOrders')
  const queryClient = useQueryClient()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [orderScreen, setOrderScreen] = useState<{ order: Order; autoOpenAddModal?: boolean } | null>(null)
  const [historyOrderScreen, setHistoryOrderScreen] = useState<Order | null>(null)
  const [historyPage, setHistoryPage] = useState(0)

  const { data: activeOrders = [], isLoading: activeLoading } = useQuery({
    queryKey: platformOrdersKeys.active(),
    queryFn: fetchActivePlatformOrders,
    refetchInterval: 30_000,
  })

  const { data: historyResult, isLoading: historyLoading } = useQuery({
    queryKey: platformOrdersKeys.history(historyPage),
    queryFn: () => fetchPlatformOrderHistory(historyPage),
    placeholderData: (prev) => prev,
  })

  const historyOrders = historyResult?.orders ?? []
  const historyTotal = historyResult?.total ?? 0
  const historyPageCount = Math.ceil(historyTotal / PLATFORM_HISTORY_PAGE_SIZE)

  const deliverMutation = useMutation({
    mutationFn: (orderId: string) => deliverPlatformOrder(orderId),
    onMutate: async (orderId) => {
      await queryClient.cancelQueries({ queryKey: platformOrdersKeys.active() })

      const prevActive = queryClient.getQueryData<Order[]>(platformOrdersKeys.active())

      queryClient.setQueryData<Order[]>(
        platformOrdersKeys.active(),
        (old) => old?.filter((o) => o.id !== orderId) ?? []
      )

      return { prevActive }
    },
    onError: (_err, _orderId, context) => {
      if (context?.prevActive !== undefined) {
        queryClient.setQueryData(platformOrdersKeys.active(), context.prevActive)
      }
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        queryClient.invalidateQueries({ queryKey: platformOrdersKeys.all })
        return
      }
      toast.success(t('delivered'))
      queryClient.invalidateQueries({ queryKey: platformOrdersKeys.all })
    },
  })

  function handleCreated(_orderId: string, initialOrder: Order) {
    queryClient.invalidateQueries({ queryKey: platformOrdersKeys.all })
    setOrderScreen({ order: initialOrder, autoOpenAddModal: true })
  }

  if (orderScreen) {
    return (
      <PlatformOrderScreen
        orderId={orderScreen.order.id}
        initialOrder={orderScreen.order}
        autoOpenAddModal={orderScreen.autoOpenAddModal}
        onClose={() => {
          setOrderScreen(null)
          queryClient.invalidateQueries({ queryKey: platformOrdersKeys.all })
        }}
      />
    )
  }

  if (historyOrderScreen) {
    return (
      <PlatformOrderScreen
        orderId={historyOrderScreen.id}
        initialOrder={historyOrderScreen}
        readOnly
        onClose={() => {
          setHistoryOrderScreen(null)
          queryClient.invalidateQueries({ queryKey: platformOrdersKeys.all })
        }}
      />
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {t('addOrder')}
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            {t('activeOrders')} ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="history">{t('history')}</TabsTrigger>
        </TabsList>

        {/* Aktif Siparişler */}
        <TabsContent value="active" className="mt-4">
          {activeLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Package className="h-10 w-10 opacity-30" />
              <p>{t('noActiveOrders')}</p>
            </div>
          ) : (
            <ActiveOrdersTable
              orders={activeOrders}
              onView={(order) => setOrderScreen({ order, autoOpenAddModal: false })}
              onDeliver={(orderId) => deliverMutation.mutate(orderId)}
              isLoading={deliverMutation.isPending}
            />
          )}
        </TabsContent>

        {/* Geçmiş */}
        <TabsContent value="history" className="mt-4 space-y-3">
          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <HistoryTable orders={historyOrders} onSelect={(order) => setHistoryOrderScreen(order)} />
          )}
          {historyPageCount > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {historyTotal} sipariş · Sayfa {historyPage + 1} / {historyPageCount}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                  disabled={historyPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage((p) => Math.min(historyPageCount - 1, p + 1))}
                  disabled={historyPage >= historyPageCount - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <PlatformOrderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(orderId, initialOrder) => {
          setCreateModalOpen(false)
          handleCreated(orderId, initialOrder)
        }}
      />
    </div>
  )
}

// ─── Aktif Siparişler Tablosu ─────────────────────────────────────────────────

interface ActiveOrdersTableProps {
  orders: Order[]
  onView: (order: Order) => void
  onDeliver: (orderId: string) => void
  isLoading: boolean
}

function ActiveOrdersTable({ orders, onView, onDeliver, isLoading }: ActiveOrdersTableProps) {
  const t = useTranslations('platformOrders')
  const tCommon = useTranslations('common')

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('platform')}</TableHead>
            <TableHead>{t('customerName')}</TableHead>
            <TableHead className="hidden md:table-cell">{t('customerAddress')}</TableHead>
            <TableHead className="text-right">{t('orderTotal')}</TableHead>
            <TableHead className="hidden sm:table-cell">{tCommon('date')}</TableHead>
            <TableHead className="text-right">{tCommon('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell onClick={() => onView(order)}>
                <Badge variant="outline" className="text-xs">
                  {PLATFORM_LABELS[order.platform ?? ''] ?? order.platform}
                </Badge>
              </TableCell>
              <TableCell className="font-medium" onClick={() => onView(order)}>
                {order.customer_name}
              </TableCell>
              <TableCell
                className="hidden md:table-cell text-sm text-muted-foreground max-w-48 truncate"
                onClick={() => onView(order)}
              >
                {order.customer_address ?? '—'}
              </TableCell>
              <TableCell className="text-right font-medium" onClick={() => onView(order)}>
                {Number(order.total_amount) > 0
                  ? `₺${Number(order.total_amount).toFixed(2)}`
                  : '—'}
              </TableCell>
              <TableCell
                className="hidden sm:table-cell text-sm text-muted-foreground"
                onClick={() => onView(order)}
              >
                {format(new Date(order.created_at), 'HH:mm', { locale: tr })}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => onView(order)}
                  >
                    {t('viewOrder')}
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onDeliver(order.id)}
                    disabled={isLoading}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('delivered')}
                  </Button>

                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Geçmiş Tablosu ───────────────────────────────────────────────────────────

interface HistoryTableProps {
  orders: Order[]
  onSelect: (order: Order) => void
}

function HistoryTable({ orders, onSelect }: HistoryTableProps) {
  const t = useTranslations('platformOrders')
  const tCommon = useTranslations('common')

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        {tCommon('noData')}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('platform')}</TableHead>
            <TableHead>{t('customerName')}</TableHead>
            <TableHead className="text-right">{t('orderTotal')}</TableHead>
            <TableHead>{tCommon('status')}</TableHead>
            <TableHead>{tCommon('date')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow
              key={order.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelect(order)}
            >
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {PLATFORM_LABELS[order.platform ?? ''] ?? order.platform}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{order.customer_name}</TableCell>
              <TableCell className="text-right">
                ₺{Number(order.total_amount).toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={order.status === 'completed' ? 'outline' : 'destructive'}
                  className="text-xs"
                >
                  {t(`status.${order.status}` as Parameters<typeof t>[0])}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(order.created_at), 'dd MMM HH:mm', { locale: tr })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
