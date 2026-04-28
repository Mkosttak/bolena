'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useQrSessionStore } from '@/lib/stores/qr-session.store'
import { qrKeys } from '@/lib/queries/qr.queries'
import { QrBottomNav, type QrTab } from './QrBottomNav'
import { QrMenuTab } from './QrMenuTab'
import { QrCartTab } from './QrCartTab'
import { QrDraftPopup } from './QrDraftPopup'
import { QrSessionExpired } from './QrSessionExpired'
import type { FullOrder } from '@/lib/queries/orders.queries'
import type { Category, MenuCampaign, Product } from '@/types'

interface QrOrderScreenProps {
  token: string
  sessionToken: string
  tableId: string
  tableName: string
  initialOrderId: string
  qrEnabled: boolean
  initialCategories: Category[]
  initialProducts: Product[]
  initialCampaigns: MenuCampaign[]
  initialFullOrder: FullOrder | null
}

export function QrOrderScreen({
  token,
  sessionToken,
  tableName,
  initialOrderId,
  qrEnabled,
  initialCategories,
  initialProducts,
  initialCampaigns,
  initialFullOrder,
}: QrOrderScreenProps) {
  const t = useTranslations('qr')
  const [activeTab, setActiveTab] = useState<QrTab>('menu')
  const [draftPopupOpen, setDraftPopupOpen] = useState(false)
  const [isSessionExpired, setIsSessionExpired] = useState(false)
  const initSession = useQrSessionStore((s) => s.initSession)
  const hasLocalItems = useQrSessionStore((s) => s.items.length > 0)
  const queryClient = useQueryClient()
  const lastInsertCountRef = useRef(0)
  const isFirstLoadRef = useRef(true)
  const suppressNextInsertToastRef = useRef(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    initSession(token, sessionToken, initialOrderId)
  }, [token, sessionToken, initialOrderId, initSession])

  useLayoutEffect(() => {
    if (initialFullOrder) {
      queryClient.setQueryData(qrKeys.order(sessionToken), initialFullOrder)
    }
  }, [initialFullOrder, queryClient, sessionToken])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`qr-screen-${initialOrderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${initialOrderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: qrKeys.order(sessionToken) })

          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false
            return
          }

          if (suppressNextInsertToastRef.current) {
            suppressNextInsertToastRef.current = false
            return
          }

          lastInsertCountRef.current += 1
          toast(t('toastItemAddedTitle'), {
            description: t('toastItemAddedDesc'),
            duration: 4000,
            position: 'top-center',
            className: 'bg-black/90 text-white border-0 backdrop-blur-xl shadow-2xl rounded-2xl mx-auto top-4 flex p-4',
            descriptionClassName: 'text-gray-300'
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${initialOrderId}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string })?.status
          if (newStatus && newStatus !== 'active') {
            setIsSessionExpired(true)
          }
          queryClient.invalidateQueries({ queryKey: qrKeys.order(sessionToken) })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `order_id=eq.${initialOrderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: qrKeys.order(sessionToken) })
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setTimeout(() => {
            isFirstLoadRef.current = false
          }, 2000)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialOrderId, sessionToken, queryClient, t])

  const handleTabChange = (tab: QrTab) => {
    // Cart sekmesine geçerken iletilmemiş ürün varsa popup aç
    if (tab === 'cart' && hasLocalItems) {
      setDraftPopupOpen(true)
      return
    }
    setActiveTab(tab)
  }

  if (isSessionExpired) {
    return <QrSessionExpired tableName={tableName} />
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#efe4cf]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-8%] h-64 w-64 rounded-full bg-[#c4841a]/16 blur-3xl" />
        <div className="absolute right-[-10%] top-[15%] h-72 w-72 rounded-full bg-[#1b3c2a]/14 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[20%] h-80 w-80 rounded-full bg-white/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-dvh max-h-dvh min-h-0 w-full max-w-6xl flex-col overflow-hidden px-3 sm:px-6 lg:px-8">
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden min-w-0">
          <div
            className={`absolute top-0 inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] flex flex-col min-h-0 overflow-hidden transition-all duration-300 ease-out ${
              activeTab === 'menu' ? 'opacity-100 z-10 translate-y-0' : 'opacity-0 pointer-events-none z-0 translate-y-4'
            }`}
          >
            <QrMenuTab
              categories={initialCategories}
              products={initialProducts}
              campaigns={initialCampaigns}
              tableName={tableName}
              qrEnabled={qrEnabled}
              token={token}
              sessionToken={sessionToken}
              orderId={initialOrderId}
              onDirectOrderSuccess={() => {
                suppressNextInsertToastRef.current = true
              }}
            />
          </div>

          <div
            className={`absolute top-0 inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] flex flex-col min-h-0 overflow-hidden transition-all duration-300 ease-out ${
              activeTab === 'cart' ? 'opacity-100 z-10 translate-y-0' : 'opacity-0 pointer-events-none z-0 translate-y-4'
            }`}
          >
            <QrCartTab
              token={token}
              sessionToken={sessionToken}
              orderId={initialOrderId}
              qrEnabled={qrEnabled}
              onOpenDraft={() => setDraftPopupOpen(true)}
            />
          </div>
        </main>

        <QrBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>

      {/* Draft popup — cart sekmesine geçişte iletilmemiş ürün varsa */}
      <QrDraftPopup
        open={draftPopupOpen}
        token={token}
        sessionToken={sessionToken}
        orderId={initialOrderId}
        qrEnabled={qrEnabled}
        onSent={() => {
          setDraftPopupOpen(false)
          setActiveTab('cart')
        }}
        onDismiss={() => {
          setDraftPopupOpen(false)
          setActiveTab('cart')
        }}
      />
    </div>
  )
}
