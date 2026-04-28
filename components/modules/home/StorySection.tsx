'use client'

import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/shared/Reveal'

export function StorySection() {
  const t = useTranslations('home')

  const processes = [
    t('storyProcess1'),
    t('storyProcess2'),
    t('storyProcess3'),
    t('storyProcess4'),
  ]

  return (
    <>
      <style>{`
        .story-section {
          background: #FAF8F2;
          border-top: 1px solid rgba(27,60,42,0.08);
          padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem);
        }
        .story-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: clamp(2.5rem, 5vw, 5rem);
        }
        @media (min-width: 900px) {
          .story-inner { grid-template-columns: 1fr 1fr; align-items: start; }
        }
        .story-eyebrow {
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
        .story-eyebrow::before {
          content: '';
          display: block;
          width: 1.5rem;
          height: 1px;
          background: currentColor;
        }
        .story-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(2rem, 4vw, 3.25rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: #1B3C2A;
          margin-bottom: 1.25rem;
        }
        .story-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(0.9375rem, 1.5vw, 1.0625rem);
          line-height: 1.75;
          color: rgba(27,60,42,0.65);
        }
        .story-process-title {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(27,60,42,0.5);
          margin-bottom: 1.5rem;
        }
        .story-process-list {
          display: flex;
          flex-direction: column;
          border-left: 2px solid rgba(196,132,26,0.25);
          padding-left: 1.5rem;
          gap: 1.25rem;
        }
        .story-process-item {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
        }
        .story-process-num {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: 1.25rem;
          color: #C4841A;
          line-height: 1.2;
          flex-shrink: 0;
          min-width: 1.5rem;
        }
        .story-process-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1B3C2A;
          line-height: 1.4;
          padding-top: 0.15rem;
        }
      `}</style>

      <section className="story-section">
        <div className="story-inner">
          <Reveal>
            <p className="story-eyebrow">{t('storyEyebrow')}</p>
            <h2 className="story-heading">{t('storyHeading')}</h2>
            <p className="story-text">{t('storyText')}</p>
          </Reveal>

          <Reveal delay={0.15}>
            <p className="story-process-title">{t('storyProcessTitle')}</p>
            <ol className="story-process-list">
              {processes.map((step, i) => (
                <li key={i} className="story-process-item">
                  <span className="story-process-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="story-process-label">{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>
    </>
  )
}
