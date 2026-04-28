'use client'

import type { SVGProps } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircleMore, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { WHATSAPP_NUMBER, WHATSAPP_URL } from '@/lib/constants/social'

type WidgetPageKey = 'home' | 'menu' | 'contact' | 'blog'
const INTRO_VISIBLE_MS = 3200
const INTRO_PAUSE_MS = 1800

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

  const messages = useMemo(
    () => [
      t(`${pageKey}.message1`),
      t(`${pageKey}.message2`),
    ],
    [pageKey, t]
  )

  const prefill = t(`${pageKey}.prefill`)
  const href = `${WHATSAPP_URL}?text=${encodeURIComponent(prefill)}`

  const [messageIndex, setMessageIndex] = useState(0)
  const [bubbleVisible, setBubbleVisible] = useState(true)
  const [introDone, setIntroDone] = useState(false)
  const currentMessage = introDone ? messages[messageIndex] : t('welcome')
  const visibleDuration = introDone
    ? Math.min(16000, Math.max(9200, 6400 + currentMessage.length * 60))
    : INTRO_VISIBLE_MS
  const pauseDuration = introDone ? 5600 : INTRO_PAUSE_MS

  useEffect(() => {
    if (isHiddenRoute) return

    const introHideTimeout = setTimeout(() => setBubbleVisible(false), INTRO_VISIBLE_MS)
    const introDoneTimeout = setTimeout(() => {
      setIntroDone(true)
      setBubbleVisible(true)
    }, INTRO_VISIBLE_MS + INTRO_PAUSE_MS)

    return () => {
      clearTimeout(introHideTimeout)
      clearTimeout(introDoneTimeout)
    }
  }, [isHiddenRoute])

  useEffect(() => {
    if (!introDone) return

    const resetFrame = window.requestAnimationFrame(() => {
      setMessageIndex(0)
      setBubbleVisible(true)
    })

    return () => window.cancelAnimationFrame(resetFrame)
  }, [introDone, pageKey])

  useEffect(() => {
    if (isHiddenRoute || !introDone) return

    const hideTimeout = setTimeout(() => setBubbleVisible(false), visibleDuration)
    const nextMessageTimeout = setTimeout(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
      setBubbleVisible(true)
    }, visibleDuration + pauseDuration)

    return () => {
      clearTimeout(hideTimeout)
      clearTimeout(nextMessageTimeout)
    }
  }, [currentMessage, introDone, isHiddenRoute, messages.length, pauseDuration, visibleDuration])

  if (isHiddenRoute) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence mode="wait">
        {bubbleVisible ? (
          <motion.div
            key={`${pageKey}-${messageIndex}`}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto relative max-w-[260px] rounded-[24px] border border-[#173424]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,245,236,0.96))] px-4 py-3 text-[#173424] shadow-[0_18px_50px_-24px_rgba(16,38,27,0.34)] backdrop-blur"
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#173424]/6 text-[#c4841a]">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#173424]/48">
                  {t('badge')}
                </p>
                <motion.p
                  className="text-sm font-medium leading-6 text-[#173424]/88"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.085,
                        delayChildren: 0.16,
                      },
                    },
                  }}
                >
                  {currentMessage.split(' ').map((word, index) => (
                    <motion.span
                      key={`${word}-${index}`}
                      className="inline-block pr-[0.28rem]"
                      variants={{
                        hidden: { opacity: 0, y: 8, filter: 'blur(6px)' },
                        visible: {
                          opacity: 1,
                          y: 0,
                          filter: 'blur(0px)',
                          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                        },
                      }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </motion.p>
              </div>
            </div>
            <span className="absolute bottom-[-7px] right-7 h-4 w-4 rotate-45 rounded-[4px] border-b border-r border-[#173424]/10 bg-[#fbf8f1]" />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('ariaLabel')}
        className={cn(
          'pointer-events-auto group relative inline-flex h-16 w-16 items-center justify-center rounded-full',
          'bg-[linear-gradient(135deg,#25d366_0%,#1ea952_100%)] text-white shadow-[0_20px_45px_-18px_rgba(37,211,102,0.72)]',
          'transition-transform duration-300 hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25d366]/25'
        )}
        onMouseEnter={() => setBubbleVisible(true)}
        onFocus={() => setBubbleVisible(true)}
      >
        <span className="absolute inset-0 rounded-full bg-white/18 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute inset-[-6px] rounded-full border border-[#25d366]/30" />
        <span className="absolute -top-1.5 -right-1.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-white/60 bg-[#f7f1e5] px-1 text-[#173424] shadow-sm">
          <MessageCircleMore className="h-3.5 w-3.5" strokeWidth={2.2} />
        </span>
        <WhatsAppIcon className="relative h-8 w-8" />
        <span className="sr-only">{WHATSAPP_NUMBER}</span>
      </a>
    </div>
  )
}
