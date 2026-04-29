'use client'

import { useMemo } from 'react'
import { ShoppingBag, UtensilsCrossed } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { useQrSessionStore } from '@/lib/stores/qr-session.store'

export type QrTab = 'menu' | 'cart'

interface QrBottomNavProps {
  activeTab: QrTab
  onTabChange: (tab: QrTab) => void
}

export function QrBottomNav({ activeTab, onTabChange }: QrBottomNavProps) {
  const t = useTranslations('qr')
  const itemCount = useQrSessionStore((s) => s.itemCount())

  const tabs = useMemo<{ id: QrTab; label: string; icon: React.ReactNode }[]>(
    () => [
      {
        id: 'menu',
        label: t('navMenu'),
        icon: <UtensilsCrossed className="h-[19px] w-[19px]" strokeWidth={2} />,
      },
      {
        id: 'cart',
        label: t('navCart'),
        icon: (
          <div className="relative">
            <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={2} />
            {itemCount > 0 && (
              <motion.span
                key={itemCount}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute -top-2.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center leading-none px-1 shadow-md border-2 border-white"
              >
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-30 animate-ping" />
                <span className="relative z-10">{itemCount > 9 ? '9+' : itemCount}</span>
              </motion.span>
            )}
          </div>
        ),
      },
    ],
    [t, itemCount]
  )

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none safe-area-padding-bottom-compact">
      <div className="pointer-events-auto w-full max-w-6xl px-3 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(246,238,220,0.78))] p-1.5 backdrop-blur-2xl shadow-[0_22px_56px_-34px_rgba(15,32,23,0.8)]">
          <div className="grid grid-cols-2 gap-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={tab.id === 'cart' ? 'cart-tab-btn' : undefined}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex min-h-[54px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[18px] px-2 py-2 transition ${
                    isActive
                      ? 'text-[#faf7ef] shadow-[0_20px_40px_-28px_rgba(27,60,42,0.95)]'
                      : 'text-[#1B3C2A]/45 hover:bg-white/55'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-indicator"
                      className="absolute inset-0 rounded-[18px] bg-[linear-gradient(135deg,#234a36,#13281d)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors ${isActive ? 'text-[#faf7ef]' : 'text-[#1B3C2A]/45'}`}
                  >
                    {tab.icon}
                  </span>
                  <span
                    className={`relative z-10 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                      isActive ? 'text-[#faf7ef]' : 'text-[#1B3C2A]/45'
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
