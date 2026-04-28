'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { reservationsKeys } from '@/lib/queries/reservations.queries'
import { tablesKeys, fetchTablesWithOrder } from '@/lib/queries/tables.queries'
import { assignReservationToTable } from '@/app/[locale]/admin/reservations/actions'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface AssignTableModalProps {
  open: boolean
  onClose: () => void
  reservationId: string
}

export function AssignTableModal({
  open,
  onClose,
  reservationId,
}: AssignTableModalProps) {
  const t = useTranslations('reservations')
  const tTables = useTranslations('tables')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)

  const { data: tables = [], isLoading } = useQuery({
    queryKey: tablesKeys.list(),
    queryFn: fetchTablesWithOrder,
    enabled: open,
    refetchOnMount: 'always',
    staleTime: 0,
  })

  const mutation = useMutation({
    mutationFn: () => assignReservationToTable(reservationId, selectedTableId!),
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: reservationsKeys.all })
      queryClient.invalidateQueries({ queryKey: tablesKeys.all })
      setSelectedTableId(null)
      onClose()
    },
  })

  function handleClose() {
    setSelectedTableId(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{t('assignTable')}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : tables.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground italic text-sm">
              {tTables('noTables')}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {tables.map((tbl) => {
                const isOccupied = tbl.activeOrder != null
                const isSelected = selectedTableId === tbl.id

                return (
                  <Button
                    key={tbl.id}
                    type="button"
                    variant={isSelected ? 'default' : isOccupied ? 'secondary' : 'outline'}
                    className={[
                      'h-auto py-3 flex flex-col items-center gap-1 border-2 transition-all',
                      isOccupied
                        ? 'border-muted/20 bg-muted/10 opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'border-primary'
                        : 'border-muted-foreground/10 hover:border-primary/40',
                    ].join(' ')}
                    onClick={() => !isOccupied && setSelectedTableId(tbl.id)}
                    disabled={isOccupied || mutation.isPending}
                  >
                    <span className="font-bold text-sm">{tbl.name}</span>
                    {isOccupied ? (
                      <Badge
                        variant="default"
                        className="text-[10px] py-0 px-1 font-bold uppercase bg-amber-500 hover:bg-amber-600 border-none"
                      >
                        {tTables('hasOrder')}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 px-1 font-bold uppercase opacity-60"
                      >
                        {tTables('noOrder')}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-0 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
            className="flex-1"
          >
            {tCommon('cancel')}
          </Button>
          <Button
            className="flex-1"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !selectedTableId}
          >
            {mutation.isPending ? tCommon('loading') : tCommon('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
