'use client'

import type { SVGProps } from 'react'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircleMore, Sparkles, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '@/lib/constants/social'

type WidgetPageKey = 'home' | 'menu' | 'contact' | 'blog'

const DELAY_MS = 15000 // 15 seconds
const TYPING_MS = 3000  // 3 seconds typing effect
const DISMISS_KEY = 'bolena_wa_bubble_dismissed_v2'

function WhatsAppIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .16 5.33.16 11.9c0 2.1.55 4.15 1.59 5.97L0 24l6.3-1.65a11.86 11.86 0 0 0 5.77 1.47h.01c6.57 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.46-8.44Zm-8.45 18.33h-.01a9.9 9.9 0 0 1-5.04-1.37l-.36-.21-3.74.98 1-3.65-.23-.38a9.88 9.88 0 0 1-1.52-5.27c0-5.46 4.44-9.9 9.91-9.9 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 7 9.9 9.9 0 0 1-9.89 9.9Zm5.43-7.42c-.3-.15-1.77-.87-2.04-.98-.27-.1-.46-.15-.66.15s-.76.98-.93 1.18c-.17.2-.34.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.34.44-.51.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.51-.08-.15-.67-1.62-.92-2.22-.24-.57-.48-.49-.66-.5h-.56c-.2 0-.51.08-.78.37-.27.3-1.03 1-1.03 2.42 0 1.42 1.05 2.79 1.19 2.98.15.2 2.05 3.13 4.97 4.4.7.3 1.25.49 1.67.62.7.22 1.33.19 1.83.12.56-.08 1.77-.72 2.02-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.2-.56-.34Z" />
    </svg>
  )
}

function getPageKey(pathname: string): WidgetPageKey {
  if (pathname.includes('/menu')) return 'menu'
  if (pathname.includes('/contact')) return 'contact'
  if (pathname.includes('/blog')) return 'blog'
  return 'home'
}

export function WhatsAppFloatingButton() {
  const pathname = usePathname()
  const t = useTranslations('whatsappWidget')
  const pageKey = getPageKey(pathname)
  const isHiddenRoute = pageKey === 'blog'

  const [isVisible, setIsVisible] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [wasDismissed, setWasDismissed] = useState(() => {
    if (typeof window === 'undefined') return true
    return !!localStorage.getItem(DISMISS_KEY)
  })

  // Randomly pick one of the 3 greetings — stable, initialised once on mount
  const [randomIndex] = useState(() => Math.floor(Math.random() * 3) + 1)
  const selectedMessageKey = `${pageKey}.greeting${randomIndex}`

  const messageText = t(selectedMessageKey)
  const prefill = t(`${pageKey}.prefill`)
  const href = `${WHATSAPP_URL}?text=${encodeURIComponent(prefill)}`


  // Show logic
  useEffect(() => {
    if (isHiddenRoute || wasDismissed) return

    const showTimeout = setTimeout(() => {
      setIsVisible(true)
      setIsTyping(true)

      // Turn off typing after delay
      const typingTimeout = setTimeout(() => {
        setIsTyping(false)
      }, TYPING_MS)

      return () => clearTimeout(typingTimeout)
    }, DELAY_MS)

    return () => clearTimeout(showTimeout)
  }, [isHiddenRoute, wasDismissed])

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsVisible(false)
    setWasDismissed(true)
    localStorage.setItem(DISMISS_KEY, 'true')
  }

  if (isHiddenRoute) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isVisible && !wasDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, y: 10, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-auto relative mb-2 w-full max-w-[280px] sm:max-w-[320px]"
          >
            <div 
              className={cn(
                "relative overflow-hidden rounded-[24px] border border-[#173424]/10 bg-white/95 p-4 shadow-[0_20px_50px_rgba(26,53,36,0.15)] backdrop-blur-xl sm:p-5",
                "before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.4),rgba(255,255,255,0))]"
              )}
            >
              {/* Close Button */}
              <button
                onClick={handleDismiss}
                className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[#173424]/5 text-[#173424]/40 transition-all hover:bg-[#173424]/10 hover:text-[#173424] sm:right-4 sm:top-4"
                aria-label={t('close')}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3 sm:gap-4">
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#173424] text-[#D5AD5C] sm:h-11 sm:w-11">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
                </div>

                <div className="flex-1 pt-0.5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#173424]/40">
                    Bolena Destek
                  </p>
                  
                  <div className="min-h-[40px]">
                    {isTyping ? (
                      <div className="flex items-center gap-1.5 pt-2">
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
                          className="h-1.5 w-1.5 rounded-full bg-[#173424]/40"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                          className="h-1.5 w-1.5 rounded-full bg-[#173424]/40"
                        />
                        <motion.div
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }}
                          className="h-1.5 w-1.5 rounded-full bg-[#173424]/40"
                        />
                      </div>
                    ) : (
                      <motion.p
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[13px] font-medium leading-[1.6] text-[#173424] sm:text-sm"
                      >
                        {messageText}
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pointer triangle */}
            <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 border-b border-r border-[#173424]/10 bg-white/95" />
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('ariaLabel')}
        className={cn(
          'pointer-events-auto group relative inline-flex h-14 w-14 items-center justify-center rounded-full sm:h-16 sm:w-16',
          'bg-[linear-gradient(135deg,#25d366_0%,#1ea952_100%)] text-white shadow-[0_15px_35px_-12px_rgba(37,211,102,0.6)]',
          'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_-18px_rgba(37,211,102,0.8)]'
        )}
      >
        <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute inset-[-6px] rounded-full border border-[#25d366]/20" />
        
        {/* Unread badge icon */}
        {!wasDismissed && !isVisible && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 sm:h-5 sm:w-5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500 sm:h-5 sm:w-5" />
          </span>
        )}

        <WhatsAppIcon className="relative h-7 w-7 sm:h-8 sm:w-8" />
        <span className="sr-only">{WHATSAPP_NUMBER}</span>
      </a>
    </div>
  )
}

