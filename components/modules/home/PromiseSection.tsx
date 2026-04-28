'use client'

import { useTranslations } from 'next-intl'
import { GrainOverlay } from '@/components/shared/GrainOverlay'
import { Reveal } from '@/components/shared/Reveal'

export function PromiseSection() {
  const t = useTranslations('home')

  return (
    <>
      <style>{`
        .promise-section {
          background: #1B3C2A;
          position: relative;
          overflow: hidden;
          padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem);
        }
        .promise-orb {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70%;
          max-width: 700px;
          aspect-ratio: 1;
          background: radial-gradient(circle, rgba(196,132,26,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .promise-inner {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 2;
        }
        .promise-eyebrow {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(196,132,26,0.7);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .promise-eyebrow::before,
        .promise-eyebrow::after {
          content: '';
          display: block;
          width: 2rem;
          height: 1px;
          background: currentColor;
          opacity: 0.6;
        }
        .promise-quote {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-style: italic;
          font-size: clamp(1.5rem, 4vw, 3rem);
          line-height: 1.3;
          color: #FAF8F2;
          margin-bottom: 2rem;
        }
        .promise-attribution {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(196,132,26,0.7);
        }
      `}</style>

      <section className="promise-section">
        <GrainOverlay />
        <div className="promise-orb" aria-hidden="true" />
        <div className="promise-inner">
          <Reveal>
            <p className="promise-eyebrow">{t('promiseEyebrow')}</p>
          </Reveal>
          <Reveal delay={0.15}>
            <blockquote className="promise-quote">{t('promiseText')}</blockquote>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="promise-attribution">— {t('promiseAttribution')}</p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
