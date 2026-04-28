'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TableCardActionsProps {
  tableId: string
  locale: string
}

export function TableCardActions({ tableId, locale }: TableCardActionsProps) {
  const t = useTranslations('orders')

  return (
    <Link
      href={`/${locale}/admin/tables/${tableId}?payment=true`}
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-auto block"
    >
      <Button
        size="sm"
        variant="secondary"
        className="h-8 w-full rounded-xl shadow-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all duration-300 flex items-center justify-center gap-2 group/btn"
      >
        <Banknote size={14} className="group-hover/btn:rotate-12 transition-transform duration-300" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{t('payment')}</span>
      </Button>
    </Link>
  )
}
