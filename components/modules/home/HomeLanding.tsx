'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, ShieldCheck, ChefHat, Leaf, MapPin, Phone } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/shared/Reveal'

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
      image: '/images/menu/placeholder-2.png',
      title: t('menuCard1Title'),
      desc: t('menuCard1Desc'),
      tag: t('menuCard1Tag'),
      alt: t('menuCard1Alt'),
    },
    {
      key: 'menu2',
      image: '/images/menu/placeholder-1.png',
      title: t('menuCard2Title'),
      desc: t('menuCard2Desc'),
      tag: t('menuCard2Tag'),
      alt: t('menuCard2Alt'),
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
      key: 'p1',
      name: t('platform1Name'),
      cta: t('platform1Cta'),
      accent: '#E10600',
      gradFrom: '#FFF0F0',
      gradTo: '#FFE0E0',
      borderColor: 'rgba(225,6,0,0.15)',
      href: 'https://www.yemeksepeti.com',
      initial: 'Y',
      tagline: 'En hızlı teslimat',
    },
    {
      key: 'p2',
      name: t('platform2Name'),
      cta: t('platform2Cta'),
      accent: '#5D3EBC',
      gradFrom: '#F3F0FF',
      gradTo: '#E8E2FF',
      borderColor: 'rgba(93,62,188,0.15)',
      href: 'https://getir.com',
      initial: 'G',
      tagline: 'Anında kapıda',
    },
    {
      key: 'p3',
      name: t('platform3Name'),
      cta: t('platform3Cta'),
      accent: '#F27A1A',
      gradFrom: '#FFF5EC',
      gradTo: '#FFE8D0',
      borderColor: 'rgba(242,122,26,0.15)',
      href: 'https://www.trendyol.com/yemek',
      initial: 'T',
      tagline: 'Avantajlı fiyatlar',
    },
    {
      key: 'p4',
      name: t('platform4Name'),
      cta: t('platform4Cta'),
      accent: '#E3000B',
      gradFrom: '#FFF0F1',
      gradTo: '#FFE0E2',
      borderColor: 'rgba(227,0,11,0.15)',
      href: 'https://www.migroskurye.com',
      initial: 'M',
      tagline: 'Migros güvencesiyle',
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
        style={{ minHeight: '100svh' }}
      >
        <motion.div
          style={{ y: heroImgY, position: 'absolute', inset: 0, scale: 1.1 }}
        >
          <Image
            src="/images/menu/hero.png"
            alt={t('heroImageAlt')}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(160deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.85) 100%)',
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
                }}
              >
                {t('heroTitle')}
                <br />
                <span style={{ color: '#D5AD5C' }}>{t('heroTitleAccent')}</span>
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
                  fontSize: 'clamp(0.875rem,1.8vw,1rem)',
                  lineHeight: 1.72,
                  color: 'rgba(253,252,248,0.62)',
                  maxWidth: 380,
                }}
              >
                {t('heroSubtitle')}
              </p>

              <div className="flex gap-3 flex-wrap sm:flex-shrink-0">
                <Link
                  href={`/${locale}/menu`}
                  className="inline-flex items-center gap-2 rounded-full font-sans transition-all duration-200 hover:scale-105"
                  style={{
                    background: '#FDFCF8',
                    color: '#1C1C1A',
                    padding: '0.8rem 1.5rem',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                  }}
                >
                  {t('heroPrimaryCta')}
                  <ArrowUpRight className="w-4 h-4" strokeWidth={2.5} />
                </Link>
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex items-center gap-2 rounded-full font-sans border border-white/22 backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                  style={{
                    background: 'rgba(255,255,255,0.09)',
                    color: 'rgba(253,252,248,0.9)',
                    padding: '0.8rem 1.5rem',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                  }}
                >
                  {t('heroSecondaryCta')}
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ─── TICKER ───────────────────────────────────────────── */}
      <div className="overflow-hidden" style={{ background: '#1A3524', padding: '0.875rem 0' }}>
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
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.26em',
              textTransform: 'uppercase',
              color: '#C4841A',
              marginBottom: '1.1rem',
            }}
          >
            {t('signatureEyebrow')}
          </p>
          <h2
            className="font-heading"
            style={{
              fontSize: 'clamp(1.85rem,4.5vw,3.5rem)',
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: '#1C1C1A',
              maxWidth: 700,
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
                  className="flex flex-col gap-5"
                  style={{
                    padding: 'clamp(1.75rem,4vh,2.5rem) 0',
                    paddingRight: i < 2 ? 'clamp(1.5rem,4vw,2.5rem)' : 0,
                    paddingLeft: i > 0 ? 'clamp(1.5rem,4vw,2.5rem)' : 0,
                    borderBottom: '1px solid rgba(28,28,26,0.1)',
                    borderRight: i < 2 ? '1px solid rgba(28,28,26,0.1)' : 'none',
                  }}
                >
                  <div
                    className="inline-flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      width: 44,
                      height: 44,
                      background: 'rgba(26,53,36,0.07)',
                      color: '#1A3524',
                      alignSelf: 'flex-start',
                    }}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
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

              {/* Phone CTA — visible on sm+ next to header */}
              <a
                href={`tel:${t('orderCallNumber').replace(/\s/g, '')}`}
                className="group hidden sm:inline-flex items-center gap-3 rounded-2xl flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: '#1A3524',
                  padding: '1rem 1.5rem',
                  textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 2px 16px rgba(26,53,36,0.18)',
                }}
              >
                <div
                  className="inline-flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.1)', color: '#D5AD5C' }}
                >
                  <Phone className="w-4 h-4" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-heading" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FDFCF8', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                    {t('orderCallLabel')}
                  </p>
                  <p className="font-sans" style={{ fontSize: 12, color: 'rgba(253,252,248,0.52)', lineHeight: 1 }}>
                    {t('orderCallNumber')}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 ml-1 text-amber-400 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
              </a>
            </div>
          </Reveal>

          {/* Platform cards grid */}
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}
          >
            {platforms.map((p, i) => (
              <Reveal key={p.key} delay={i * 0.07}>
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col rounded-2xl transition-all duration-300 hover:-translate-y-1.5"
                  style={{
                    background: `linear-gradient(145deg, ${p.gradFrom} 0%, ${p.gradTo} 100%)`,
                    border: `1px solid ${p.borderColor}`,
                    padding: 'clamp(1.25rem,3vw,1.75rem)',
                    textDecoration: 'none',
                    boxShadow: `0 4px 20px ${p.borderColor}`,
                    minHeight: 170,
                  }}
                >
                  {/* Brand initial badge */}
                  <div className="flex items-start justify-between mb-auto">
                    <div
                      className="inline-flex items-center justify-center rounded-xl font-sans"
                      style={{
                        width: 52,
                        height: 52,
                        background: '#fff',
                        color: p.accent,
                        fontSize: 22,
                        fontWeight: 900,
                        boxShadow: `0 2px 10px ${p.borderColor}`,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {p.initial}
                    </div>
                    <ArrowUpRight
                      className="w-4 h-4 opacity-30 group-hover:opacity-80 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 flex-shrink-0"
                      style={{ color: p.accent }}
                      strokeWidth={2.5}
                    />
                  </div>

                  <div style={{ marginTop: '1.1rem' }}>
                    <p
                      className="font-heading"
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: '#1C1C1A',
                        marginBottom: '0.2rem',
                        lineHeight: 1.2,
                      }}
                    >
                      {p.name}
                    </p>
                    <p
                      className="font-sans"
                      style={{ fontSize: 12, color: 'rgba(28,28,26,0.42)', marginBottom: '0.75rem', lineHeight: 1.4 }}
                    >
                      {p.tagline}
                    </p>
                    <span
                      className="inline-flex items-center gap-1 font-sans transition-all duration-200"
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: p.accent,
                      }}
                    >
                      {p.cta}
                      <ArrowUpRight className="w-3 h-3" strokeWidth={3} />
                    </span>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>

          {/* Phone CTA — mobile only (full width) */}
          <Reveal delay={0.32}>
            <a
              href={`tel:${t('orderCallNumber').replace(/\s/g, '')}`}
              className="group flex sm:hidden items-center gap-4 rounded-2xl mt-4 transition-all duration-200 hover:shadow-lg"
              style={{
                background: '#1A3524',
                padding: 'clamp(1.1rem,3vw,1.5rem)',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 2px 16px rgba(26,53,36,0.22)',
              }}
            >
              <div
                className="inline-flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)', color: '#D5AD5C' }}
              >
                <Phone className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <p className="font-heading" style={{ fontSize: '1rem', fontWeight: 700, color: '#FDFCF8', marginBottom: '0.2rem', letterSpacing: '-0.01em' }}>
                  {t('orderCallLabel')}
                </p>
                <p className="font-sans" style={{ fontSize: 13, color: 'rgba(253,252,248,0.5)' }}>
                  {t('orderCallNumber')}
                </p>
              </div>
              <span
                className="inline-flex items-center gap-1 font-sans flex-shrink-0"
                style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D5AD5C' }}
              >
                {t('orderCallCta')}
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </span>
            </a>
          </Reveal>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {menuCards.map((card, i) => (
              <Reveal key={card.key} delay={i * 0.1}>
                <Link
                  href={`/${locale}/menu`}
                  className="group block relative overflow-hidden"
                  style={{
                    borderRadius: 28,
                    minHeight: 'clamp(340px,48vw,520px)',
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
                        'linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.72) 100%)',
                    }}
                  />
                  <div
                    className="absolute inset-0 flex flex-col justify-between"
                    style={{ padding: 'clamp(1.25rem,3vw,2rem)' }}
                  >
                    <span
                      className="font-sans self-start rounded-full border border-white/15 backdrop-blur-md"
                      style={{
                        background: 'rgba(0,0,0,0.38)',
                        padding: '0.28rem 0.75rem',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.18em',
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
                          fontSize: 'clamp(1.4rem,3.5vw,2.1rem)',
                          fontWeight: 700,
                          lineHeight: 1.15,
                          letterSpacing: '-0.025em',
                          color: '#FDFCF8',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {card.title}
                      </h3>
                      <p
                        className="font-sans"
                        style={{
                          fontSize: 13.5,
                          lineHeight: 1.65,
                          color: 'rgba(253,252,248,0.6)',
                          maxWidth: 320,
                          marginBottom: '1rem',
                        }}
                      >
                        {card.desc}
                      </p>
                      <span
                        className="inline-flex items-center gap-2 font-sans transition-all duration-200 group-hover:gap-2.5"
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: 'rgba(253,252,248,0.72)',
                        }}
                      >
                        {t('menuCardCta')}
                        <ArrowUpRight
                          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          strokeWidth={2.5}
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
              className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
              style={{ marginBottom: 'clamp(2.5rem,5vh,3.5rem)' }}
            >
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <GoogleLogo />
                  <p
                    className="font-sans"
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                      color: 'rgba(253,252,248,0.45)',
                    }}
                  >
                    {t('reviewsEyebrow')}
                  </p>
                </div>
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
              <div
                className="flex items-center gap-3 flex-shrink-0 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '1rem 1.5rem',
                  alignSelf: 'flex-start',
                }}
              >
                <span
                  className="font-heading"
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
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <StarFull key={idx} />
                    ))}
                  </div>
                  <p
                    className="font-sans"
                    style={{ fontSize: 11, color: 'rgba(253,252,248,0.45)', lineHeight: 1 }}
                  >
                    {t('reviewsCount')} {t('reviewsSource')}
                  </p>
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
                href="https://maps.google.com/?q=Bolena+Cafe+Yaşamkent+Ankara"
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
