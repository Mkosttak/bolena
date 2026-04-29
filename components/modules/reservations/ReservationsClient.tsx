'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Plus, TableIcon, UserX, X, ShoppingBag, CreditCard } from 'lucide-react'

import {
  reservationsKeys,
  fetchReservations,
  type ReservationWithOrder,
} from '@/lib/queries/reservations.queries'
import { tablesKeys, fetchTablesWithOrder } from '@/lib/queries/tables.queries'
import { updateReservationStatus } from '@/app/[locale]/admin/reservations/actions'
import type { Order, OrderType } from '@/types'

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ReservationModal } from '@/components/modules/reservations/ReservationModal'
import { ReservationOrderScreen } from '@/components/modules/reservations/ReservationOrderScreen'
import { AssignTableModal } from '@/components/modules/reservations/AssignTableModal'


// Rezervasyon/gel-al için sıralama skoru
function reservationSortKey(r: ReservationWithOrder): number {
  if (r.reservation_date) {
    const time = r.reservation_time ?? '00:00'
    return new Date(`${r.reservation_date}T${time}`).getTime()
  }
  return new Date(r.created_at).getTime()
}


export function ReservationsClient() {
  const t = useTranslations('reservations')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [reservationModalOpen, setReservationModalOpen] = useState(false)
  const [defaultType, setDefaultType] = useState<'reservation' | 'takeaway'>('reservation')
  const [editingReservation, setEditingReservation] = useState<ReservationWithOrder | null>(null)
  const [assignTableReservationId, setAssignTableReservationId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'reservation' | 'takeaway'>('all')
  const [orderScreen, setOrderScreen] = useState<{
    reservationId: string
    customerName: string
    orderId: string
    initialOrder: Order
    autoOpenAddModal?: boolean
    autoOpenPaymentModal?: boolean
    readOnly?: boolean
  } | null>(null)

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    type: 'cancelled' | 'no_show' | null
    id: string | null
  }>({
    isOpen: false,
    type: null,
    id: null,
  })

  /** Sipariş ekranındayken tables sorgusu unmount olur; prefetchQuery her zaman ağdan çeker. */
  async function openAssignTableModal(reservationId: string) {
    try {
      await queryClient.prefetchQuery({
        queryKey: tablesKeys.list(),
        queryFn: fetchTablesWithOrder,
      })
    } catch {
      /* Modal açılınca useQuery yine dener */
    }
    setAssignTableReservationId(reservationId)
  }

  const { data: rawActiveReservations = [], isLoading: activeLoading } = useQuery({
    queryKey: reservationsKeys.list('active'),
    queryFn: () => fetchReservations('active'),
    refetchInterval: 30_000,
  })

  const { data: allReservations = [], isLoading: allLoading } = useQuery({
    queryKey: reservationsKeys.list(),
    queryFn: () => fetchReservations(),
  })

  const { data: tables = [] } = useQuery({
    queryKey: tablesKeys.list(),
    queryFn: fetchTablesWithOrder,
  })

  const tableMap = new Map(tables.map((t) => [t.id, t.name]))


  // Filtreleme ve Gruplama
  // Bağlı siparişi ödenmiş/tamamlanmış olan rezervasyonları aktif listeden çıkar
  const filteredActive = rawActiveReservations
    .filter((r) => {
      if (r.orders && (r.orders.status === 'completed' || r.orders.payment_status === 'paid')) {
        return false
      }
      return typeFilter === 'all' || r.type === typeFilter
    })
    .sort((a, b) => reservationSortKey(a) - reservationSortKey(b))

  const todayReservations = filteredActive.filter((r) => r.reservation_date && isToday(parseISO(r.reservation_date)))
  const tomorrowReservations = filteredActive.filter((r) => r.reservation_date && isTomorrow(parseISO(r.reservation_date)))
  const otherReservations = filteredActive.filter((r) => {
    if (!r.reservation_date) return true
    const d = parseISO(r.reservation_date)
    return !isToday(d) && !isTomorrow(d)
  })


  const statusMutation = useMutation({
    mutationFn: ({
      reservationId,
      status,
    }: {
      reservationId: string
      status: 'cancelled' | 'no_show' | 'completed'
    }) => updateReservationStatus(reservationId, status),
    onMutate: async ({ reservationId, status }) => {
      await queryClient.cancelQueries({ queryKey: reservationsKeys.all })

      const prevActive = queryClient.getQueryData<ReservationWithOrder[]>(
        reservationsKeys.list('active')
      )
      const prevAll = queryClient.getQueryData<ReservationWithOrder[]>(
        reservationsKeys.list()
      )

      const updater = (old: ReservationWithOrder[] | undefined) =>
        old?.map((r) =>
          r.id === reservationId ? { ...r, status } : r
        ) ?? []

      queryClient.setQueryData(reservationsKeys.list('active'), updater)
      queryClient.setQueryData(reservationsKeys.list(), updater)

      return { prevActive, prevAll }
    },
    onError: (_err, _vars, context) => {
      if (context?.prevActive !== undefined) {
        queryClient.setQueryData(reservationsKeys.list('active'), context.prevActive)
      }
      if (context?.prevAll !== undefined) {
        queryClient.setQueryData(reservationsKeys.list(), context.prevAll)
      }
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
        return
      }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
    },
  })

  function openReservationModal(type: 'reservation' | 'takeaway') {
    setDefaultType(type)
    setEditingReservation(null)
    setReservationModalOpen(true)
  }

  function openOrderScreen(
    reservation: ReservationWithOrder,
    opts: { autoOpenPaymentModal?: boolean } = {}
  ) {
    if (!reservation.order_id || !reservation.orders) return
    const order = reservation.orders as unknown as Order
    setOrderScreen({
      reservationId: reservation.id,
      customerName: reservation.customer_name,
      orderId: reservation.order_id,
      initialOrder: order,
      autoOpenAddModal: false,
      autoOpenPaymentModal: opts.autoOpenPaymentModal ?? false,
    })
  }

  function handleCreated(
    reservationId: string,
    orderId: string,
    customerName: string,
    type: 'reservation' | 'takeaway'
  ) {
    queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
    const now = new Date().toISOString()
    const initialOrder: Order = {
      id: orderId,
      type: type as OrderType,
      status: 'active',
      table_id: null,
      customer_name: customerName,
      customer_phone: null,
      customer_address: null,
      platform: null,
      notes: null,
      subtotal: 0,
      discount_amount: 0,
      discount_type: null,
      total_amount: 0,
      payment_status: 'pending',
      created_at: now,
      updated_at: now,
      completed_at: null,
    }
    setOrderScreen({
      reservationId,
      customerName,
      orderId,
      initialOrder,
      autoOpenAddModal: true,
      autoOpenPaymentModal: false,
    })
  }

  if (orderScreen) {
    return (
      <ReservationOrderScreen
        reservationId={orderScreen.reservationId}
        customerName={orderScreen.customerName}
        orderId={orderScreen.orderId}
        initialOrder={orderScreen.initialOrder}
        autoOpenAddModal={orderScreen.autoOpenAddModal}
        autoOpenPaymentModal={orderScreen.autoOpenPaymentModal}
        readOnly={orderScreen.readOnly}
        onClose={() => {
          setOrderScreen(null)
          queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
        }}
      />
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openReservationModal('takeaway')} className="flex-1 sm:flex-none">
            <ShoppingBag className="h-4 w-4 mr-2" />
            {t('addTakeaway')}
          </Button>
          <Button onClick={() => openReservationModal('reservation')} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            {t('addReservation')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Aktif ({filteredActive.length})</TabsTrigger>
          <TabsTrigger value="all">Tümü</TabsTrigger>
        </TabsList>

        {/* Aktif Rezervasyonlar */}
        <TabsContent value="active" className="mt-4 space-y-8">
          <div className="flex items-center bg-muted/40 p-1 rounded-xl w-fit gap-1">
            <Button 
              size="sm" 
              variant="ghost"
              className={`h-7 px-4 rounded-lg text-xs font-bold transition-all duration-200
                ${typeFilter === 'all' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setTypeFilter('all')}
            >
              {tCommon('all')}
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className={`h-7 px-4 rounded-lg text-xs font-bold transition-all duration-200
                ${typeFilter === 'reservation' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setTypeFilter('reservation')}
            >
              {t('typePending')}
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              className={`h-7 px-4 rounded-lg text-xs font-bold transition-all duration-200
                ${typeFilter === 'takeaway' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setTypeFilter('takeaway')}
            >
              {t('typeTakeaway')}
            </Button>
          </div>


          {activeLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : filteredActive.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('noActiveReservations')}
            </div>
          ) : (
            <>
              {todayReservations.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {t('today')} ({todayReservations.length})
                  </h2>
                  <ReservationTable
                    reservations={todayReservations}
                    tableMap={tableMap}
                    onAssignTable={openAssignTableModal}
                    onNoShow={(id) => setConfirmState({ isOpen: true, type: 'no_show', id })}
                    onCancel={(id) => setConfirmState({ isOpen: true, type: 'cancelled', id })}
                    onViewOrder={(r) => openOrderScreen(r)}
                    onPayment={(r) => openOrderScreen(r, { autoOpenPaymentModal: true })}
                    onEdit={(r) => {
                      setEditingReservation(r)
                      setReservationModalOpen(true)
                    }}
                    isLoading={statusMutation.isPending}
                  />

                </div>
              )}

              {tomorrowReservations.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                    {t('tomorrow')} ({tomorrowReservations.length})
                  </h2>
                  <ReservationTable
                    reservations={tomorrowReservations}
                    tableMap={tableMap}
                    onAssignTable={openAssignTableModal}
                    onNoShow={(id) => setConfirmState({ isOpen: true, type: 'no_show', id })}
                    onCancel={(id) => setConfirmState({ isOpen: true, type: 'cancelled', id })}
                    onViewOrder={(r) => openOrderScreen(r)}
                    onPayment={(r) => openOrderScreen(r, { autoOpenPaymentModal: true })}
                    onEdit={(r) => {
                      setEditingReservation(r)
                      setReservationModalOpen(true)
                    }}
                    isLoading={statusMutation.isPending}
                  />

                </div>
              )}

              {otherReservations.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                    {t('others')} ({otherReservations.length})
                  </h2>
                  <ReservationTable
                    reservations={otherReservations}
                    tableMap={tableMap}
                    onAssignTable={openAssignTableModal}
                    onNoShow={(id) => setConfirmState({ isOpen: true, type: 'no_show', id })}
                    onCancel={(id) => setConfirmState({ isOpen: true, type: 'cancelled', id })}
                    onViewOrder={(r) => openOrderScreen(r)}
                    onPayment={(r) => openOrderScreen(r, { autoOpenPaymentModal: true })}
                    onEdit={(r) => {
                      setEditingReservation(r)
                      setReservationModalOpen(true)
                    }}
                    isLoading={statusMutation.isPending}
                  />

                </div>
              )}
            </>
          )}
        </TabsContent>


        {/* Tüm Rezervasyonlar */}
        <TabsContent value="all" className="mt-4">
          {allLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <ReservationTable
              reservations={allReservations}
              tableMap={tableMap}
              onAssignTable={openAssignTableModal}
              onNoShow={(id) => setConfirmState({ isOpen: true, type: 'no_show', id })}
              onCancel={(id) => setConfirmState({ isOpen: true, type: 'cancelled', id })}
              onViewOrder={(r) => {
                if (!r.order_id || !r.orders) return
                const order = r.orders as unknown as Order
                setOrderScreen({
                  reservationId: r.id,
                  customerName: r.customer_name,
                  orderId: r.order_id,
                  initialOrder: order,
                  autoOpenAddModal: false,
                  autoOpenPaymentModal: false,
                  readOnly: true,
                })
              }}
              onPayment={(r) => openOrderScreen(r, { autoOpenPaymentModal: true })}
              onEdit={(r) => {
                setEditingReservation(r)
                setReservationModalOpen(true)
              }}
              isLoading={statusMutation.isPending}
            />

          )}
        </TabsContent>

      </Tabs>

      {/* Rezervasyon Oluştur/Düzenle Modal */}
      <ReservationModal
        open={reservationModalOpen}
        onClose={() => {
          setReservationModalOpen(false)
          setEditingReservation(null)
        }}
        reservation={editingReservation}
        defaultType={defaultType}
        onCreated={handleCreated}
      />

      {/* Masaya Ata Modal */}
      {assignTableReservationId && (
        <AssignTableModal
          open={!!assignTableReservationId}
          onClose={() => setAssignTableReservationId(null)}
          reservationId={assignTableReservationId}
        />
      )}

      {/* Onay Dialog */}
      <Dialog 
        open={confirmState.isOpen} 
        onOpenChange={(open) => !open && setConfirmState(prev => ({ ...prev, isOpen: false }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmState.type === 'no_show' ? t('noShow') : t('cancel')}
            </DialogTitle>
            <DialogDescription>
              {confirmState.type === 'no_show' ? t('confirmNoShow') : t('confirmCancel')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setConfirmState({ isOpen: false, type: null, id: null })}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmState.id && confirmState.type) {
                  statusMutation.mutate({ 
                    reservationId: confirmState.id, 
                    status: confirmState.type 
                  })
                }
                setConfirmState({ isOpen: false, type: null, id: null })
              }}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? tCommon('loading') : tCommon('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


// ─── Alt bileşen: Tablo ───────────────────────────────────────────────────────

interface ReservationTableProps {
  reservations: ReservationWithOrder[]
  tableMap: Map<string, string>
  onAssignTable: (id: string) => void | Promise<void>
  onNoShow: (id: string) => void
  onCancel: (id: string) => void
  onViewOrder: (r: ReservationWithOrder) => void
  onPayment: (r: ReservationWithOrder) => void
  onEdit: (r: ReservationWithOrder) => void
  isLoading: boolean
}

function ReservationTable({
  reservations,
  tableMap,
  onAssignTable,
  onNoShow,
  onCancel,
  onViewOrder,
  onPayment,
  onEdit,
  isLoading,
}: ReservationTableProps) {

  const t = useTranslations('reservations')
  const tCommon = useTranslations('common')

  const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'default',
    seated: 'secondary',
    completed: 'outline',
    cancelled: 'destructive',
    no_show: 'destructive',
  }

  if (reservations.length === 0) {
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
            <TableHead>{t('customerName')}</TableHead>
            <TableHead>{t('customerPhone')}</TableHead>
            <TableHead>{t('type')}</TableHead>
            <TableHead>{t('reservationDate')}</TableHead>
            <TableHead>{tCommon('status')}</TableHead>
            <TableHead className="text-right">{t('orderTotal')}</TableHead>
            <TableHead className="text-right">{tCommon('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((r) => {
            const isActive = r.status === 'pending' || r.status === 'seated'
            const orderTotal = r.orders ? Number(r.orders.total_amount) : 0
            const tableName = r.table_id ? tableMap.get(r.table_id) : null

            // Tarih/saat bilgisini formatla
            let dateDisplay = '—'
            if (r.reservation_date) {
              const d = parseISO(r.reservation_date)
              const timeStr = r.reservation_time ? ` ${r.reservation_time.slice(0, 5)}` : ''
              dateDisplay = format(d, 'dd MMM', { locale: tr }) + timeStr
            }

            return (
              <TableRow
                key={r.id}
                className={`hover:bg-muted/50 transition-colors ${r.order_id ? 'cursor-pointer' : ''}`}
                onClick={() => r.order_id && onViewOrder(r)}
              >
                <TableCell className="font-bold text-sm">
                  {r.customer_name}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums text-xs">
                  {r.customer_phone ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter">
                    {r.type === 'takeaway' ? t('typeTakeaway') : t('typePending')}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs font-medium">{dateDisplay}</TableCell>
                <TableCell>
                  <Badge 
                    variant={STATUS_VARIANT[r.status] ?? 'outline'} 
                    className={`text-[10px] font-bold uppercase tracking-tighter
                      ${r.status === 'seated' ? 'bg-green-50 text-green-700 border-green-200' : ''}`}
                  >
                    {r.status === 'seated' && tableName 
                      ? `${tableName}` 
                      : t(`status.${r.status}` as Parameters<typeof t>[0])}
                  </Badge>
                </TableCell>

                <TableCell className="text-right text-sm font-medium">
                  {orderTotal > 0 ? `${orderTotal.toFixed(2)} ₺` : '—'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    {/* Ödeme Al — direkt ödeme modalına git */}
                    {r.order_id && isActive && orderTotal > 0 && (
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        onClick={() => onPayment(r)}
                        disabled={isLoading}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        {t('payment')}
                      </Button>
                    )}

                    {/* Sipariş Detayı / Ürün ekle */}
                    {r.order_id && isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => onViewOrder(r)}
                        disabled={isLoading}
                      >
                        {t('viewOrder')}
                      </Button>
                    )}

                    {/* Masaya Ata */}
                    {isActive && r.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => onAssignTable(r.id)}
                        disabled={isLoading}
                      >
                        <TableIcon className="h-3 w-3 mr-1" />
                        {t('assignTable')}
                      </Button>
                    )}

                    {/* Düzenle */}
                    {isActive && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100"
                        onClick={() => onEdit(r)}
                        disabled={isLoading}
                      >
                        {tCommon('edit')}
                      </Button>
                    )}

                    {/* Gelmedi */}
                    {isActive && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-100"
                        onClick={() => onNoShow(r.id)}
                        disabled={isLoading}
                      >
                        <UserX className="h-3 w-3 mr-1" />
                        {t('noShow')}
                      </Button>
                    )}

                    {/* İptal */}
                    {isActive && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[10px] font-bold bg-red-50 text-red-700 hover:bg-red-100 border-red-100"
                        onClick={() => onCancel(r.id)}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t('cancel')}
                      </Button>
                    )}

                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
