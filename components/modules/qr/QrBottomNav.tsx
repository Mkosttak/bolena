'use client'

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

  const tabs: { id: QrTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'menu',
      label: t('navMenu'),
      icon: <UtensilsCrossed className="w-[22px] h-[22px]" strokeWidth={2} />,
    },
    {
      id: 'cart',
      label: t('navCart'),
      icon: (
        <div className="relative">
          <ShoppingBag className="w-[22px] h-[22px]" strokeWidth={2} />
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
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      <div className="pointer-events-auto w-full max-w-6xl px-3 sm:px-6 lg:px-8 pb-3">
        <div className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,240,224,0.78))] p-2 backdrop-blur-2xl shadow-[0_25px_65px_-35px_rgba(15,32,23,0.85)]">
          <div className="grid grid-cols-2 gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={tab.id === 'cart' ? 'cart-tab-btn' : undefined}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 overflow-hidden rounded-[22px] px-2 py-3 transition ${
                    isActive
                      ? 'text-[#faf7ef] shadow-[0_20px_40px_-28px_rgba(27,60,42,0.95)]'
                      : 'text-[#1B3C2A]/45 hover:bg-white/55'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-indicator"
                      className="absolute inset-0 rounded-[22px] bg-[linear-gradient(135deg,#234a36,#13281d)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span
                    className={`relative z-10 transition-colors ${isActive ? 'text-[#faf7ef]' : 'text-[#1B3C2A]/45'}`}
                  >
                    {tab.icon}
                  </span>
                  <span
                    className={`relative z-10 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
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
