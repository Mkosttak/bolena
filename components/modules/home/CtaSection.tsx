'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/shared/Reveal'

interface CtaSectionProps {
  locale: string
}

export function CtaSection({ locale }: CtaSectionProps) {
  const t = useTranslations('home')

  return (
    <>
      <style>{`
        .cta-section {
          background: #C4841A;
          position: relative;
          overflow: hidden;
          padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem);
        }
        .cta-bg-text {
          position: absolute;
          right: -2%;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(8rem, 20vw, 18rem);
          line-height: 1;
          color: rgba(27,60,42,0.07);
          pointer-events: none;
          user-select: none;
          white-space: nowrap;
        }
        .cta-inner {
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .cta-eyebrow {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(27,60,42,0.65);
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 1rem;
        }
        .cta-eyebrow::before {
          content: '';
          display: block;
          width: 1.5rem;
          height: 1px;
          background: currentColor;
        }
        .cta-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(2.5rem, 7vw, 6rem);
          line-height: 0.95;
          letter-spacing: -0.03em;
          color: #1B3C2A;
          margin-bottom: 1.25rem;
        }
        .cta-subtext {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(0.9375rem, 1.5vw, 1.0625rem);
          color: rgba(27,60,42,0.6);
          max-width: 28rem;
          line-height: 1.65;
          margin-bottom: 2.5rem;
        }
        .cta-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .cta-btn-primary {
          display: inline-flex;
          align-items: center;
          background: #1B3C2A;
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
        .cta-btn-primary:hover { background: #0F2218; transform: translateY(-1px); }
        .cta-btn-secondary {
          display: inline-flex;
          align-items: center;
          color: #1B3C2A;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          border: 1.5px solid rgba(27,60,42,0.4);
          padding: 0.875rem 1.75rem;
          border-radius: 4px;
          text-decoration: none;
          transition: border-color 0.2s, transform 0.15s;
        }
        .cta-btn-secondary:hover { border-color: #1B3C2A; transform: translateY(-1px); }
      `}</style>

      <section className="cta-section">
        <span className="cta-bg-text" aria-hidden="true">Bolena</span>
        <div className="cta-inner">
          <Reveal>
            <p className="cta-eyebrow">{t('ctaEyebrow')}</p>
            <h2 className="cta-heading">{t('ctaHeading')}</h2>
            <p className="cta-subtext">{t('ctaSubtext')}</p>
            <div className="cta-actions">
              <Link href={`/${locale}/contact`} className="cta-btn-primary">
                {t('ctaPrimary')}
              </Link>
              <Link href={`/${locale}/menu`} className="cta-btn-secondary">
                {t('ctaSecondary')}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
