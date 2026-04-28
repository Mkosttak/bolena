'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'

function Numeral({ target, suffix }: { target: number; suffix: string }) {
  const [value, setValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    const duration = 1400
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(ease * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [isInView, target])

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  )
}

export function StatsSection() {
  const t = useTranslations('home')

  const stats = [
    { value: Number(t('statsValue1')), suffix: t('statsSuffix1'), label: t('statsLabel1') },
    { value: Number(t('statsValue2')), suffix: t('statsSuffix2'), label: t('statsLabel2') },
    { value: Number(t('statsValue3')), suffix: t('statsSuffix3'), label: t('statsLabel3') },
    { value: Number(t('statsValue4')), suffix: t('statsSuffix4'), label: t('statsLabel4') },
  ]

  return (
    <>
      <style>{`
        .stats-section {
          background: rgba(196,132,26,0.07);
          border-top: 1px solid rgba(196,132,26,0.15);
          border-bottom: 1px solid rgba(196,132,26,0.15);
          padding: clamp(3rem, 6vw, 5rem) clamp(1.25rem, 5vw, 3rem);
        }
        .stats-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem 1.5rem;
        }
        @media (min-width: 700px) {
          .stats-inner { grid-template-columns: repeat(4, 1fr); }
        }
        .stat-item { text-align: center; }
        .stat-number {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          line-height: 1;
          color: #1B3C2A;
          letter-spacing: -0.03em;
          display: block;
          margin-bottom: 0.5rem;
        }
        .stat-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.8125rem;
          font-weight: 600;
          color: rgba(27,60,42,0.55);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>

      <section className="stats-section">
        <div className="stats-inner">
          {stats.map((stat, i) => (
            <div key={i} className="stat-item">
              <span className="stat-number">
                <Numeral target={stat.value} suffix={stat.suffix} />
              </span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
