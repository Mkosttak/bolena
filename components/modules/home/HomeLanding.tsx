'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, ShieldCheck, ChefHat, Leaf, MapPin, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/shared/Reveal'
import { cn } from '@/lib/utils'

interface HomeLandingProps {
  locale: string
  openNow: boolean
  todayHoursLabel: string | null
}

/* ── Google star SVG ─────────────────────────────────────── */
function StarFull() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#FBBC04" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

/* ── Google G logo ───────────────────────────────────────── */
function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function HomeLanding({ locale, openNow, todayHoursLabel }: HomeLandingProps) {
  const t = useTranslations('home')
  const heroRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroImgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const heroContentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0])

  const features = [
    { icon: ShieldCheck, title: t('assuranceCard1Title'), desc: t('assuranceCard1Desc') },
    { icon: ChefHat, title: t('assuranceCard2Title'), desc: t('assuranceCard2Desc') },
    { icon: Leaf, title: t('assuranceCard3Title'), desc: t('assuranceCard3Desc') },
  ]

  const menuCards = [
    {
      key: 'menu1',
      image: '/images/menu/breakfast.png',
      title: t('menuCard1Title'),
      desc: t('menuCard1Desc'),
      tag: t('menuCard1Tag'),
      alt: t('menuCard1Alt'),
    },
    {
      key: 'menu2',
      image: '/images/menu/healthy.png',
      title: t('menuCard2Title'),
      desc: t('menuCard2Desc'),
      tag: t('menuCard2Tag'),
      alt: t('menuCard2Alt'),
    },
    {
      key: 'menu3',
      image: '/images/menu/fastfood.png',
      title: t('menuCard3Title'),
      desc: t('menuCard3Desc'),
      tag: t('menuCard3Tag'),
      alt: t('menuCard3Alt'),
    },
    {
      key: 'menu4',
      image: '/images/menu/waffle.png',
      title: t('menuCard4Title'),
      desc: t('menuCard4Desc'),
      tag: t('menuCard4Tag'),
      alt: t('menuCard4Alt'),
    },
  ]

  const tickerItems = [
    t('tickerItem1'),
    t('tickerItem2'),
    t('tickerItem3'),
    t('tickerItem4'),
    t('tickerItem5'),
  ]

  const platforms = [
    {
      key: 'phone',
      name: t('orderCallLabel'),
      cta: t('orderCallCta'),
      accent: '#D5AD5C',
      gradFrom: '#1A3524',
      gradTo: '#13291B',
      borderColor: 'rgba(255,255,255,0.1)',
      href: `tel:${t('orderCallNumber').replace(/\s/g, '')}`,
      isPhone: true,
      tagline: t('orderCallNumber'),
    },
    {
      key: 'p1',
      name: t('platform1Name'),
      cta: t('platform1Cta'),
      accent: '#1A3524',
      gradFrom: '#FFFFFF',
      gradTo: '#F9F7F0',
      borderColor: 'rgba(26,53,36,0.08)',
      href: 'https://www.yemeksepeti.com/restaurant/bkpm/bolena-glutensiz-cafe',
      logo: '/images/menu/yemeksepeti.jpg',
    },
    {
      key: 'p2',
      name: t('platform2Name'),
      cta: t('platform2Cta'),
      accent: '#1A3524',
      gradFrom: '#FFFFFF',
      gradTo: '#F9F7F0',
      borderColor: 'rgba(26,53,36,0.08)',
      href: 'https://getir.com/yemek/restoran/bolena-glutensiz-cafe-cankaya-yasamkent-mah-cankaya-ankara/',
      logo: '/images/menu/getir-yemek.png',
    },
    {
      key: 'p4',
      name: t('platform4Name'),
      cta: t('platform4Cta'),
      accent: '#1A3524',
      gradFrom: '#FFFFFF',
      gradTo: '#F9F7F0',
      borderColor: 'rgba(26,53,36,0.08)',
      href: 'https://www.migros.com.tr/yemek/bolena-glutensiz-cafe-cankaya-yasamkent-mah-st-2bc7d',
      logo: '/images/menu/migros-yemek.png',
    },
    {
      key: 'p3',
      name: t('platform3Name'),
      cta: t('platform3Cta'),
      accent: '#1A3524',
      gradFrom: '#FFFFFF',
      gradTo: '#F9F7F0',
      borderColor: 'rgba(26,53,36,0.08)',
      href: '',
      logo: '/images/menu/trendyol-yemek.png',
      noLink: true,
    },
  ]

  const reviews = [
    { author: t('review1Author'), role: t('review1Role'), text: t('review1Text'), stars: 5 },
    { author: t('review2Author'), role: t('review2Role'), text: t('review2Text'), stars: 5 },
    { author: t('review3Author'), role: t('review3Role'), text: t('review3Text'), stars: 5 },
  ]

  /* suppress unused-var lint if openNow / todayHoursLabel removed from UI */
  void openNow
  void todayHoursLabel

  return (
    <div className="overflow-x-hidden" style={{ background: '#FDFCF8', color: '#1C1C1A' }}>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative flex flex-col justify-end overflow-hidden"
        style={{ minHeight: '100svh', background: '#FDFCF8' }}
      >
        <motion.div
          style={{ 
            y: heroImgY, 
            position: 'absolute', 
            inset: 0, 
            scale: 1.2, // Increased scale to ensure coverage during parallax
            width: '100%',
            height: '100%' 
          }}
          className="bg-[#FDFCF8]"
        >
          <Image
            src="/images/menu/hero_v5.png"
            alt={t('heroImageAlt')}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>

        {/* Daha güçlü gradient overlay — başlık ve alt metnin okunabilirliği için */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.65) 100%)',
          }}
        />

        <motion.div
          style={{ opacity: heroContentOpacity, position: 'relative', zIndex: 10 }}
        >
          <div
            className="w-full mx-auto"
            style={{
              maxWidth: 1200,
              padding: 'clamp(2rem,5vw,4rem) clamp(1.25rem,5vw,3rem)',
              paddingTop: '8rem',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <motion.h1
                initial={{ y: '105%' }}
                animate={{ y: 0 }}
                transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                className="font-heading"
                style={{
                  fontSize: 'clamp(2.85rem, 9.5vw, 7.5rem)',
                  fontWeight: 800,
                  lineHeight: 0.93,
                  letterSpacing: '-0.04em',
                  color: '#FDFCF8',
                  margin: 0,
                  textShadow: '0 2px 24px rgba(0,0,0,0.35)',
                }}
              >
                {t('heroTitle')}
                <br />
                <span
                  style={{
                    color: '#E8C684',
                    textShadow: '0 2px 18px rgba(0,0,0,0.45)',
                  }}
                >
                  {t('heroTitleAccent')}
                </span>
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-0 sm:justify-between mt-7"
              style={{ paddingBottom: 'clamp(2rem,5vh,3.5rem)' }}
            >
              <p
                className="font-sans"
                style={{
                  fontSize: 'clamp(0.95rem,1.9vw,1.0625rem)',
                  lineHeight: 1.7,
                  color: 'rgba(253,252,248,0.92)',
                  maxWidth: 440,
                  fontWeight: 400,
                  textShadow: '0 1px 12px rgba(0,0,0,0.4)',
                }}
              >
                {t('heroSubtitle')}
              </p>

              <div className="flex gap-3 flex-wrap sm:flex-shrink-0">
                <Link
                  href={`/${locale}/menu`}
                  className="inline-flex items-center gap-2 rounded-full font-sans transition-all duration-200 hover:scale-105 hover:shadow-[0_8px_28px_-6px_rgba(0,0,0,0.45)]"
                  style={{
                    background: '#FDFCF8',
                    color: '#1C1C1A',
                    padding: '0.95rem 1.75rem',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                  }}
                >
                  {t('heroPrimaryCta')}
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── TICKER ───────────────────────────────────────────── */}
      <div className="overflow-hidden" style={{ background: '#254a33', padding: '0.875rem 0' }}>
        <style>{`
          @keyframes hl-ticker {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .hl-ticker-track {
            display: flex;
            width: max-content;
            animation: hl-ticker 28s linear infinite;
          }
          .hl-ticker-track:hover { animation-play-state: paused; }
        `}</style>
        <div className="hl-ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-3.5 font-sans whitespace-nowrap"
              style={{
                padding: '0 2rem',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'rgba(253,252,248,0.42)',
              }}
            >
              {item}
              <span
                className="flex-shrink-0 rounded-full"
                style={{ width: 5, height: 5, background: '#C4841A' }}
              />
            </span>
          ))}
        </div>
      </div>

      {/* ─── BRAND STATEMENT + FEATURES ──────────────────────── */}
      <section
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: 'clamp(4rem,9vh,7rem) clamp(1.25rem,5vw,3rem)',
        }}
      >
        <Reveal>
          <p
            className="font-sans"
            style={{
              fontSize: 'clamp(11.5px, 1.2vw, 13.5px)',
              fontWeight: 800,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: '#C4841A',
              marginBottom: '1.25rem',
            }}
          >
            {t('signatureEyebrow')}
          </p>
          <h2
            className="font-heading"
            style={{
              fontSize: 'clamp(1.85rem,4.5vw,3.85rem)',
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: '#1C1C1A',
              maxWidth: 1000,
            }}
          >
            {t('signatureTitle')}
          </h2>
        </Reveal>

        <div
          className="mt-14 sm:mt-16 grid grid-cols-1 sm:grid-cols-3"
          style={{ borderTop: '1px solid rgba(28,28,26,0.1)' }}
        >
          {features.map((feat, i) => {
            const Icon = feat.icon
            return (
              <Reveal key={feat.title} delay={i * 0.09}>
                <div
                  className={cn(
                    'flex flex-col gap-4 sm:gap-5',
                    // Mobile: center align + simetrik padding
                    // Desktop (sm+): sola yasli, sutunlar arasi border-r
                    'items-center text-center sm:items-start sm:text-left',
                    'px-4 sm:px-0',
                    i < 2 ? 'sm:border-r border-black/10' : '',
                  )}
                  style={{
                    padding: 'clamp(1.5rem,3.5vh,2.5rem) 0',
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: 'rgba(26,53,36,0.07)',
                      color: '#1A3524',
                    }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="w-full max-w-md sm:max-w-none">
                    <p
                      className="font-sans"
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#1C1C1A',
                        marginBottom: '0.625rem',
                      }}
                    >
                      {feat.title}
                    </p>
                    <p
                      className="font-sans"
                      style={{ fontSize: 14, lineHeight: 1.78, color: 'rgba(28,28,26,0.55)' }}
                    >
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ─── ONLINE ORDER ─────────────────────────────────────── */}
      <section style={{ background: '#F5EFE0', padding: 'clamp(4rem,9vh,7rem) clamp(1.25rem,5vw,3rem)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Header row */}
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6" style={{ marginBottom: 'clamp(2.5rem,5vh,3.5rem)' }}>
              <div>
                <p
                  className="font-sans"
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: '#C4841A',
                    marginBottom: '0.75rem',
                  }}
                >
                  {t('orderEyebrow')}
                </p>
                <h2
                  className="font-heading"
                  style={{
                    fontSize: 'clamp(1.75rem,4vw,3rem)',
                    fontWeight: 700,
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    color: '#1C1C1A',
                    maxWidth: 560,
                    marginBottom: '0.75rem',
                  }}
                >
                  {t('orderTitle')}
                </h2>
                <p
                  className="font-sans"
                  style={{
                    fontSize: 'clamp(0.875rem,1.8vw,1rem)',
                    lineHeight: 1.72,
                    color: 'rgba(28,28,26,0.58)',
                    maxWidth: 520,
                    marginBottom: 0,
                  }}
                >
                  {t('orderSubtitle')}
                </p>
              </div>
            </div>
          </Reveal>

          {/* Platform cards — mobil 2 sütun, tablet 3, desktop 5 */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4"
            style={{
              maxWidth: 1400,
              margin: '0 auto',
            }}
          >
            {platforms.map((p, i) => {
              const CardContent = (
                <div
                  className="group flex flex-col rounded-2xl transition-all duration-300 hover:-translate-y-1.5 h-full p-4 sm:p-5 lg:p-6"
                  style={{
                    background: `linear-gradient(145deg, ${p.gradFrom} 0%, ${p.gradTo} 100%)`,
                    border: `1px solid ${p.borderColor}`,
                    boxShadow: p.isPhone
                      ? '0 10px 30px rgba(26,53,36,0.2)'
                      : `0 4px 20px ${p.borderColor}`,
                    minHeight: 160,
                    cursor: p.noLink ? 'default' : 'pointer',
                  }}
                >
                  {/* Brand logo / initial badge */}
                  <div className="flex items-start justify-between mb-auto">
                    <div
                      className="relative overflow-hidden inline-flex items-center justify-center rounded-xl font-sans h-11 w-11 sm:h-12 sm:w-12 lg:h-[52px] lg:w-[52px]"
                      style={{
                        background: p.isPhone ? 'rgba(255,255,255,0.1)' : '#fff',
                        color: p.accent,
                        fontWeight: 900,
                        boxShadow: p.isPhone ? 'none' : `0 2px 10px ${p.borderColor}`,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {p.isPhone ? (
                        <Phone className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: p.accent }} strokeWidth={1.5} />
                      ) : p.logo ? (
                        <Image
                          src={p.logo}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 44px, 52px"
                          className="object-contain p-1.5"
                        />
                      ) : null}
                    </div>
                    <ArrowUpRight
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-30 group-hover:opacity-80 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0"
                      style={{ color: p.accent }}
                      strokeWidth={2.5}
                    />
                  </div>

                  <div className="mt-3 sm:mt-4">
                    <p
                      className="font-heading text-sm sm:text-base lg:text-[1.1rem]"
                      style={{
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: p.isPhone ? '#FDFCF8' : '#1C1C1A',
                        marginBottom: '0.25rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {p.name}
                    </p>
                    {p.isPhone && (
                      <p
                        className="font-sans hidden md:block"
                        style={{ fontSize: 13, color: 'rgba(253,252,248,0.5)', marginBottom: '0.75rem', lineHeight: 1.4 }}
                      >
                        {p.tagline}
                      </p>
                    )}
                    <span
                      className="inline-flex items-center gap-1 font-sans transition-all duration-200 text-[9px] sm:text-[10px] lg:text-[10.5px]"
                      style={{
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: p.accent,
                      }}
                    >
                      {p.cta}
                      <ArrowUpRight className="w-2.5 h-2.5" strokeWidth={3} />
                    </span>
                  </div>
                </div>
              )

              // Migros (p4) mobilde gizli — 2x2 grid daha temiz dursun
              const hideOnMobile = p.key === 'p4'

              return (
                <Reveal
                  key={p.key}
                  delay={i * 0.07}
                  className={hideOnMobile ? 'hidden sm:block' : undefined}
                >
                  {p.noLink ? (
                    <div className="h-full">{CardContent}</div>
                  ) : (
                    <a
                      href={p.href}
                      target={p.isPhone ? undefined : "_blank"}
                      rel={p.isPhone ? undefined : "noopener noreferrer"}
                      style={{ textDecoration: 'none' }}
                      className="h-full block"
                    >
                      {CardContent}
                    </a>
                  )}
                </Reveal>
              )
            })}
          </div>


        </div>
      </section>

      {/* ─── MENU SHOWCASE ────────────────────────────────────── */}
      <section style={{ background: '#FDFCF8', padding: 'clamp(4rem,9vh,7rem) clamp(1.25rem,5vw,3rem)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div
              className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
              style={{ marginBottom: 'clamp(2rem,5vh,3.5rem)' }}
            >
              <div>
                <p
                  className="font-sans"
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: '#C4841A',
                    marginBottom: '0.6rem',
                  }}
                >
                  {t('menuEyebrow')}
                </p>
                <h2
                  className="font-heading"
                  style={{
                    fontSize: 'clamp(1.75rem,4.5vw,3rem)',
                    fontWeight: 700,
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    color: '#1C1C1A',
                    maxWidth: 500,
                    margin: 0,
                  }}
                >
                  {t('menuTitle')}
                </h2>
              </div>
              <Link
                href={`/${locale}/menu`}
                className="inline-flex items-center gap-2 rounded-full font-sans transition-all duration-200 hover:opacity-88 self-start sm:self-end flex-shrink-0"
                style={{
                  background: '#1A3524',
                  color: '#FDFCF8',
                  padding: '0.75rem 1.5rem',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                {t('menuCta')}
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {menuCards.map((card, i) => (
              <Reveal key={card.key} delay={i * 0.1}>
                <Link
                  href={`/${locale}/menu`}
                  className="group block relative overflow-hidden"
                  style={{
                    borderRadius: 16,
                    minHeight: 'clamp(110px, 18vw, 220px)',
                    textDecoration: 'none',
                    background: '#1A3524',
                  }}
                >
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to bottom, rgba(0,0,0,0) 18%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.88) 100%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 flex flex-col justify-between"
                    style={{ padding: 'clamp(0.65rem, 1.8vw, 1.25rem)' }}
                  >
                    <span
                      className="font-sans self-start rounded-full border border-white/15 backdrop-blur-md"
                      style={{
                        background: 'rgba(0,0,0,0.38)',
                        padding: '0.22rem 0.65rem',
                        fontSize: 'clamp(8px, 1.2vw, 10px)',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'rgba(253,252,248,0.88)',
                      }}
                    >
                      {card.tag}
                    </span>
                    <div>
                      <h3
                        className="font-heading"
                        style={{
                          fontSize: 'clamp(1rem, 2.8vw, 1.9rem)',
                          fontWeight: 700,
                          lineHeight: 1.1,
                          letterSpacing: '-0.02em',
                          color: '#FDFCF8',
                          marginBottom: '0.35rem',
                          textShadow: '0 2px 12px rgba(0,0,0,0.45)',
                        }}
                      >
                        {card.title}
                      </h3>
                      <p
                        className="font-sans hidden sm:block"
                        style={{
                          fontSize: 'clamp(11px, 1.3vw, 13px)',
                          lineHeight: 1.6,
                          color: 'rgba(253,252,248,0.92)',
                          maxWidth: 320,
                          marginBottom: '0.875rem',
                          textShadow: '0 1px 6px rgba(0,0,0,0.55)',
                        }}
                      >
                        {card.desc}
                      </p>
                      <span
                        className="inline-flex items-center gap-1.5 font-sans transition-all duration-200 group-hover:gap-2"
                        style={{
                          fontSize: 'clamp(9px, 1.2vw, 10.5px)',
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'rgba(253,252,248,0.72)',
                        }}
                      >
                        {t('menuCardCta')}
                        <ArrowUpRight
                          className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          strokeWidth={3}
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GOOGLE REVIEWS ───────────────────────────────────── */}
      <section style={{ background: '#1A3524', padding: 'clamp(4rem,9vh,7rem) clamp(1.25rem,5vw,3rem)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header row */}
          <Reveal>
            <div
              className="flex flex-row items-start justify-between sm:items-end gap-3 sm:gap-6"
              style={{ marginBottom: 'clamp(2.5rem,5vh,3.5rem)' }}
            >
              <div>

                <h2
                  className="font-heading"
                  style={{
                    fontSize: 'clamp(1.75rem,4vw,3rem)',
                    fontWeight: 700,
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    color: '#FDFCF8',
                    margin: 0,
                  }}
                >
                  {t('reviewsTitle')}
                </h2>
              </div>

              {/* Rating badge */}
              <style>{`
                @media (max-width: 639px) {
                  .home-rating-badge { padding: 0.5rem 0.75rem !important; gap: 0.5rem !important; border-radius: 0.875rem !important; }
                  .home-rating-badge .home-rating-num { font-size: 1.35rem !important; }
                  .home-rating-badge svg { width: 12px !important; height: 12px !important; }
                  .home-rating-badge .home-rating-stars { gap: 1px !important; margin-bottom: 0 !important; }
                }
              `}</style>
              <div
                className="home-rating-badge flex items-center gap-3 flex-shrink-0 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '1rem 1.5rem',
                  alignSelf: 'flex-start',
                }}
              >
                <span
                  className="home-rating-num font-heading"
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: '#FDFCF8',
                    letterSpacing: '-0.04em',
                  }}
                >
                  {t('reviewsRating')}
                </span>
                <div>
                  <div className="home-rating-stars flex gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <StarFull key={idx} />
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </Reveal>

          {/* Review cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {reviews.map((review, i) => (
              <Reveal key={review.author} delay={i * 0.09}>
                <div
                  className="flex flex-col gap-4 rounded-2xl h-full"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: 'clamp(1.25rem,3vw,1.75rem)',
                  }}
                >
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.stars }).map((_, idx) => (
                      <StarFull key={idx} />
                    ))}
                  </div>
                  {/* Review text */}
                  <p
                    className="font-sans flex-1"
                    style={{
                      fontSize: 14.5,
                      lineHeight: 1.72,
                      color: 'rgba(253,252,248,0.78)',
                      fontStyle: 'italic',
                    }}
                  >
                    &ldquo;{review.text}&rdquo;
                  </p>
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div
                      className="inline-flex items-center justify-center rounded-full flex-shrink-0 font-sans"
                      style={{
                        width: 38,
                        height: 38,
                        background: 'rgba(196,132,26,0.22)',
                        color: '#D5AD5C',
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    >
                      {review.author.charAt(0)}
                    </div>
                    <div>
                      <p
                        className="font-sans"
                        style={{ fontSize: 13, fontWeight: 700, color: '#FDFCF8', lineHeight: 1.2 }}
                      >
                        {review.author}
                      </p>
                      <p
                        className="font-sans"
                        style={{ fontSize: 11, color: 'rgba(253,252,248,0.4)', marginTop: 2 }}
                      >
                        {review.role}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <GoogleLogo />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* CTA */}
          <Reveal delay={0.25}>
            <div className="mt-8 text-center">
              <a
                href="https://www.google.com/maps/place/Bolena+Glutensiz+Cafe/@39.8703126,32.6618315,17z/data=!4m8!3m7!1s0x14d33f002ef2e931:0x56146f1ed06acfd8!8m2!3d39.8703126!4d32.6644064!9m1!1b1!16s%2Fg%2F11yc3qsx9w?entry=ttu&g_ep=EgoyMDI2MDQyNy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full font-sans transition-all duration-200 hover:bg-white/15"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(253,252,248,0.82)',
                  padding: '0.75rem 1.75rem',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                {t('reviewsCta')}
                <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CLOSING CTA ──────────────────────────────────────── */}
      <section style={{ padding: 'clamp(4rem,9vh,7rem) clamp(1.25rem,5vw,3rem)', background: '#FDFCF8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div
              className="relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #1A3524 0%, #0F2218 100%)',
                borderRadius: 28,
                padding: 'clamp(2.5rem,6vw,4.5rem)',
              }}
            >
              <div
                className="pointer-events-none absolute rounded-full"
                style={{
                  top: -100,
                  right: -80,
                  width: 340,
                  height: 340,
                  background: 'rgba(196,132,26,0.14)',
                  filter: 'blur(80px)',
                }}
              />
              <div
                className="pointer-events-none absolute rounded-full"
                style={{
                  bottom: -80,
                  left: -60,
                  width: 260,
                  height: 260,
                  background: 'rgba(196,132,26,0.08)',
                  filter: 'blur(60px)',
                }}
              />

              <div className="relative flex flex-col lg:flex-row lg:items-end gap-8 lg:gap-16">
                <div className="flex-1">
                  <div
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 font-sans mb-5"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      padding: '0.35rem 0.9rem',
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'rgba(253,252,248,0.5)',
                    }}
                  >
                    <MapPin className="w-3 h-3" style={{ color: '#C4841A' }} strokeWidth={2} />
                    {t('ctaEyebrow')}
                  </div>
                  <h2
                    className="font-heading"
                    style={{
                      fontSize: 'clamp(2rem,5vw,3.75rem)',
                      fontWeight: 700,
                      lineHeight: 1.08,
                      letterSpacing: '-0.035em',
                      color: '#FDFCF8',
                      maxWidth: 560,
                      marginBottom: '1rem',
                    }}
                  >
                    {t('ctaTitle')}
                  </h2>
                  <p
                    className="font-sans"
                    style={{
                      fontSize: 'clamp(0.875rem,1.8vw,1rem)',
                      lineHeight: 1.78,
                      color: 'rgba(253,252,248,0.52)',
                      maxWidth: 460,
                    }}
                  >
                    {t('ctaText')}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:flex-shrink-0">
                  <Link
                    href={`/${locale}/contact`}
                    className="inline-flex items-center justify-center gap-2 rounded-full font-sans transition-all duration-200 hover:scale-105"
                    style={{
                      background: '#FDFCF8',
                      color: '#1C1C1A',
                      padding: '0.875rem 1.75rem',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                    }}
                  >
                    {t('ctaPrimary')}
                    <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                  </Link>
                  <Link
                    href={`/${locale}/menu`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 font-sans transition-all duration-200 hover:bg-white/10"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      color: 'rgba(253,252,248,0.82)',
                      padding: '0.875rem 1.75rem',
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                    }}
                  >
                    {t('ctaSecondary')}
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
