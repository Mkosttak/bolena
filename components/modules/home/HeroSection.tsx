'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface HeroSectionProps {
  locale: string
  openNow: boolean
  todayHoursLabel: string | null
}

export function HeroSection({ locale, openNow, todayHoursLabel }: HeroSectionProps) {
  const t = useTranslations('home')
  const imageRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: imageRef, offset: ['start start', 'end start'] })
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12])

  return (
    <>
      <style>{`
        .hero-root {
          display: grid;
          grid-template-columns: 55% 45%;
          min-height: 100svh;
          position: relative;
        }
        @media (max-width: 900px) {
          .hero-root {
            grid-template-columns: 1fr;
            grid-template-rows: auto 50svh;
          }
        }
        .hero-left {
          background: #1B3C2A;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: clamp(5rem, 12vw, 9rem) clamp(1.5rem, 5vw, 4rem) clamp(2.5rem, 5vw, 4rem);
          overflow: hidden;
          z-index: 0;
        }
        .hero-orb {
          position: absolute;
          top: -15%;
          right: -5%;
          width: 60%;
          aspect-ratio: 1;
          background: radial-gradient(circle, rgba(196,132,26,0.12) 0%, transparent 65%);
          pointer-events: none;
        }
        .hero-eyebrow {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(196,132,26,0.8);
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1.5rem;
        }
        .hero-eyebrow::before {
          content: '';
          display: block;
          width: 1.5rem;
          height: 1px;
          background: currentColor;
        }
        .hero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(3.5rem, 8vw, 7rem);
          line-height: 0.92;
          letter-spacing: -0.03em;
          color: #FAF8F2;
          margin-bottom: 1.5rem;
        }
        .hero-title-accent {
          display: block;
          color: #C4841A;
          font-style: italic;
        }
        .hero-subtitle {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          line-height: 1.7;
          color: rgba(250,248,242,0.55);
          max-width: 30rem;
          margin-bottom: 2.5rem;
        }
        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
        }
        .hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #C4841A;
          color: #FAF8F2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 0.875rem 1.75rem;
          border-radius: 4px;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .hero-btn-primary:hover { background: #a36c14; transform: translateY(-1px); }
        .hero-btn-secondary {
          display: inline-flex;
          align-items: center;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          color: rgba(250,248,242,0.7);
          border: 1px solid rgba(250,248,242,0.25);
          padding: 0.875rem 1.75rem;
          border-radius: 4px;
          text-decoration: none;
          transition: border-color 0.2s, color 0.2s, transform 0.15s;
        }
        .hero-btn-secondary:hover {
          border-color: rgba(250,248,242,0.6);
          color: #FAF8F2;
          transform: translateY(-1px);
        }
        .hero-badge {
          margin-top: 2rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(250,248,242,0.45);
        }
        .hero-badge-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .hero-badge-dot.open {
          background: #4ade80;
          box-shadow: 0 0 0 3px rgba(74,222,128,0.2);
          animation: pulse-open 2s infinite;
        }
        .hero-badge-dot.closed {
          background: #f87171;
        }
        @keyframes pulse-open {
          0%, 100% { box-shadow: 0 0 0 3px rgba(74,222,128,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(74,222,128,0.08); }
        }
        .hero-right {
          position: relative;
          overflow: hidden;
        }
        @media (max-width: 900px) {
          .hero-right { order: -1; min-height: 50svh; }
        }
      `}</style>

      <section className="hero-root" id="hero">
        <div className="hero-left">
          <div className="hero-orb" aria-hidden="true" />

          <motion.div
            className="hero-eyebrow"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {t('heroEyebrow')}
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            {t('heroTitle')}
            <span className="hero-title-accent">{t('heroTitleAccent')}</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {t('heroSubtitle')}
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <Link href={`/${locale}/menu`} className="hero-btn-primary">
              {t('heroCta')}
            </Link>
            <Link href={`/${locale}/contact`} className="hero-btn-secondary">
              {t('heroCtaSecondary')}
            </Link>
          </motion.div>

          <motion.div
            className="hero-badge"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <span className={`hero-badge-dot ${openNow ? 'open' : 'closed'}`} />
            <span>
              {openNow ? t('openNow') : t('closedNow')}
              {todayHoursLabel && openNow && ` · ${todayHoursLabel}`}
            </span>
          </motion.div>
        </div>

        <div className="hero-right" ref={imageRef}>
          <motion.div style={{ scale: imageScale, width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
            <Image
              src="/images/menu/hero.png"
              alt="Bolena Cafe"
              fill
              sizes="(max-width: 900px) 100vw, 45vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              priority
              loading="eager"
            />
          </motion.div>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to right, rgba(27,60,42,0.3) 0%, transparent 40%)',
              zIndex: 1,
            }}
          />
        </div>
      </section>
    </>
  )
}
