'use client'

import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Table } from '@/types'
import { cn } from '@/lib/utils'

import { TableCardHeader } from './card/TableCardHeader'
import { TableCardStatus } from './card/TableCardStatus'
import { TableCardFinancials } from './card/TableCardFinancials'
import { TableCardActions } from './card/TableCardActions'

interface TableCardProps {
  table: Table
  locale: string
}

export function TableCard({ table, locale }: TableCardProps) {
  const router = useRouter()
  const activeOrder = table.activeOrder
  const hasActiveOrder = activeOrder != null && activeOrder.items_count > 0
  
  const totalAmount = Number(activeOrder?.total_amount || 0)
  const paidAmount = Number(activeOrder?.paid_amount || 0)
  const remainingAmount = Math.max(0, totalAmount - paidAmount)

  const handleCardClick = () => {
    router.push(`/${locale}/admin/tables/${table.id}`)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative h-full"
    >
      <div
        role="link"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
        className={cn(
          'cursor-pointer h-full rounded-2xl outline-none transition-all duration-300 ease-out',
          'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'hover:shadow-md active:scale-[0.99]',
          hasActiveOrder
            ? 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20'
            : 'bg-card hover:bg-muted/50 border-border/60'
        )}
      >
        <div className="relative h-full flex flex-col p-4 border rounded-2xl transition-colors duration-300">
          <div className="flex flex-col gap-3">
            {/* Header & Status */}
            <div className="flex items-start justify-between gap-3">
              <TableCardHeader 
                name={table.name}
                categoryName={table.table_categories?.name}
                isQrOrder={activeOrder?.is_qr_order}
                orderCreatedAt={activeOrder?.created_at}
                locale={locale}
              />
              <TableCardStatus hasActiveOrder={hasActiveOrder} />
            </div>

            {/* Content for active orders */}
            <AnimatePresence mode="wait">
              {hasActiveOrder && (
                <motion.div
                  key="active-content"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex flex-col gap-4 mt-1"
                >
                  <TableCardFinancials 
                    totalAmount={totalAmount}
                    paidAmount={paidAmount}
                    remainingAmount={remainingAmount}
                  />
                  <TableCardActions tableId={table.id} locale={locale} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
