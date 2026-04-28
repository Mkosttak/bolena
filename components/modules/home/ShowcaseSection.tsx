'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/shared/Reveal'

interface ShowcaseSectionProps {
  locale: string
}

export function ShowcaseSection({ locale }: ShowcaseSectionProps) {
  const t = useTranslations('home')

  const categories = [
    t('showcaseCat1'),
    t('showcaseCat2'),
    t('showcaseCat3'),
    t('showcaseCat4'),
    t('showcaseCat5'),
    t('showcaseCat6'),
  ]

  const images = [
    '/images/menu/placeholder-1.png',
    '/images/menu/placeholder-2.png',
    '/images/menu/placeholder-1.png',
    '/images/menu/placeholder-2.png',
    '/images/menu/placeholder-1.png',
    '/images/menu/placeholder-2.png',
  ]

  return (
    <>
      <style>{`
        .showcase-section {
          background: #FAF8F2;
          padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem);
        }
        .showcase-inner { max-width: 1200px; margin: 0 auto; }
        .showcase-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.5rem;
          margin-bottom: clamp(2rem, 4vw, 3.5rem);
        }
        .showcase-eyebrow {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: #C4841A;
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.75rem;
        }
        .showcase-eyebrow::before {
          content: '';
          display: block;
          width: 1.5rem;
          height: 1px;
          background: currentColor;
        }
        .showcase-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(2rem, 4vw, 3.25rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: #1B3C2A;
          margin-bottom: 0.5rem;
        }
        .showcase-subtitle {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9375rem;
          color: rgba(27,60,42,0.55);
          max-width: 28rem;
        }
        .showcase-cta-link {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          color: #1B3C2A;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          border-bottom: 1px solid rgba(27,60,42,0.3);
          padding-bottom: 2px;
          transition: border-color 0.2s;
          white-space: nowrap;
        }
        .showcase-cta-link:hover { border-color: #1B3C2A; }
        .showcase-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1px;
          background: rgba(27,60,42,0.1);
        }
        @media (min-width: 700px) {
          .showcase-grid { grid-template-columns: repeat(3, 1fr); }
        }
        .showcase-card {
          position: relative;
          aspect-ratio: 3/4;
          overflow: hidden;
          background: #1B3C2A;
          cursor: pointer;
          display: block;
          text-decoration: none;
        }
        .showcase-card-img {
          transition: transform 0.5s ease;
        }
        .showcase-card:hover .showcase-card-img {
          transform: scale(1.06);
        }
        .showcase-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(27,60,42,0.85) 0%, rgba(27,60,42,0.1) 60%);
          z-index: 1;
        }
        .showcase-card-label {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1.25rem;
          z-index: 2;
        }
        .showcase-card-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 700;
          font-size: clamp(1rem, 2vw, 1.25rem);
          color: #FAF8F2;
          display: block;
        }
        .showcase-card-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #C4841A;
          transition: width 0.4s ease;
          z-index: 3;
        }
        .showcase-card:hover .showcase-card-bar { width: 100%; }
      `}</style>

      <section className="showcase-section">
        <div className="showcase-inner">
          <Reveal className="showcase-header">
            <div>
              <p className="showcase-eyebrow">{t('showcaseEyebrow')}</p>
              <h2 className="showcase-heading">{t('showcaseHeading')}</h2>
              <p className="showcase-subtitle">{t('showcaseSubtitle')}</p>
            </div>
            <Link href={`/${locale}/menu`} className="showcase-cta-link">
              {t('showcaseCta')} →
            </Link>
          </Reveal>

          <div className="showcase-grid">
            {categories.map((cat, i) => (
              <Link
                key={cat}
                href={`/${locale}/menu`}
                className="showcase-card"
                aria-label={cat}
              >
                <Image
                  src={images[i]}
                  alt={cat}
                  fill
                  sizes="(max-width: 700px) 50vw, 33vw"
                  className="showcase-card-img"
                  style={{ objectFit: 'cover' }}
                />
                <div className="showcase-card-overlay" aria-hidden="true" />
                <div className="showcase-card-label">
                  <span className="showcase-card-name">{cat}</span>
                </div>
                <div className="showcase-card-bar" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
