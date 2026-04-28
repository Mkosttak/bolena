'use client'

import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/shared/Reveal'

const TRUST_ITEMS = [
  { num: '01', icon: '✓' },
  { num: '02', icon: '⊕' },
  { num: '03', icon: '◈' },
  { num: '04', icon: '❋' },
] as const

export function TrustSection() {
  const t = useTranslations('home')

  const items = [
    { ...TRUST_ITEMS[0], title: t('trust1Title'), desc: t('trust1Desc') },
    { ...TRUST_ITEMS[1], title: t('trust2Title'), desc: t('trust2Desc') },
    { ...TRUST_ITEMS[2], title: t('trust3Title'), desc: t('trust3Desc') },
    { ...TRUST_ITEMS[3], title: t('trust4Title'), desc: t('trust4Desc') },
  ]

  return (
    <>
      <style>{`
        .trust-section {
          background: #FAF8F2;
          padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem);
        }
        .trust-inner { max-width: 1200px; margin: 0 auto; }
        .trust-header { margin-bottom: clamp(2.5rem, 5vw, 4rem); }
        .trust-eyebrow {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #C4841A;
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }
        .trust-eyebrow::before {
          content: '';
          display: block;
          width: 1.5rem;
          height: 1px;
          background: currentColor;
        }
        .trust-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(2rem, 4vw, 3.5rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: #1B3C2A;
        }
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: rgba(27,60,42,0.08);
        }
        @media (min-width: 900px) {
          .trust-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .trust-card {
          background: #FAF8F2;
          padding: clamp(1.5rem, 3vw, 2.5rem);
          position: relative;
          overflow: hidden;
        }
        .trust-card-num {
          position: absolute;
          top: -0.25rem;
          right: 0.5rem;
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(4rem, 8vw, 7rem);
          color: rgba(27,60,42,0.04);
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }
        .trust-card-icon {
          font-size: 1.25rem;
          color: #C4841A;
          margin-bottom: 1rem;
          display: block;
          line-height: 1;
        }
        .trust-card-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(0.875rem, 1.5vw, 1rem);
          font-weight: 700;
          color: #1B3C2A;
          margin-bottom: 0.625rem;
          line-height: 1.3;
        }
        .trust-card-desc {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          line-height: 1.65;
          color: rgba(27,60,42,0.6);
        }
        .trust-card-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(196,132,26,0);
          transition: background 0.3s;
        }
        .trust-card:hover .trust-card-bar {
          background: rgba(196,132,26,0.4);
        }
      `}</style>

      <section className="trust-section">
        <div className="trust-inner">
          <Reveal className="trust-header">
            <p className="trust-eyebrow">{t('trustEyebrow')}</p>
            <h2 className="trust-heading">{t('trustHeading')}</h2>
          </Reveal>

          <div className="trust-grid" role="list">
            {items.map((item, i) => (
              <Reveal key={item.num} delay={i * 0.1}>
                <article className="trust-card" role="listitem">
                  <span className="trust-card-num" aria-hidden="true">{item.num}</span>
                  <span className="trust-card-icon" aria-hidden="true">{item.icon}</span>
                  <h3 className="trust-card-title">{item.title}</h3>
                  <p className="trust-card-desc">{item.desc}</p>
                  <div className="trust-card-bar" aria-hidden="true" />
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
