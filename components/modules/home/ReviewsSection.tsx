'use client'

'use no memo'

import { useTranslations } from 'next-intl'
import { Reveal } from '@/components/shared/Reveal'

function Stars() {
  return (
    <div style={{ display: 'flex', gap: '2px', marginBottom: '0.875rem' }} aria-label="5 yıldız">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="#C4841A" aria-hidden="true">
          <path d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625.59-3.44L2 4.635l3.455-.505L7 1z" />
        </svg>
      ))}
    </div>
  )
}

export function ReviewsSection() {
  const t = useTranslations('home')

  const reviews = [
    { author: t('review1Author'), text: t('review1Text') },
    { author: t('review2Author'), text: t('review2Text') },
    { author: t('review3Author'), text: t('review3Text') },
  ]

  return (
    <>
      <style>{`
        .reviews-section {
          background: #FAF8F2;
          border-top: 1px solid rgba(27,60,42,0.08);
          padding: clamp(4rem, 8vw, 7rem) clamp(1.25rem, 5vw, 3rem);
        }
        .reviews-inner { max-width: 1200px; margin: 0 auto; }
        .reviews-header { margin-bottom: clamp(2.5rem, 5vw, 4rem); }
        .reviews-eyebrow {
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
        .reviews-eyebrow::before {
          content: '';
          display: block;
          width: 1.5rem;
          height: 1px;
          background: currentColor;
        }
        .reviews-heading {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(2rem, 4vw, 3.25rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: #1B3C2A;
        }
        .reviews-list { display: flex; flex-direction: column; }
        .review-item {
          padding: clamp(1.5rem, 3vw, 2.5rem) 0;
          border-bottom: 1px solid rgba(27,60,42,0.08);
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
          align-items: start;
        }
        .review-item:first-child { border-top: 1px solid rgba(27,60,42,0.08); }
        @media (min-width: 700px) {
          .reviews-list {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            background: rgba(27,60,42,0.08);
          }
          .review-item {
            background: #FAF8F2;
            padding: clamp(1.5rem, 3vw, 2.5rem);
            border: none;
            display: flex;
            flex-direction: column;
          }
          .review-item:first-child { border-top: none; }
        }
        .review-quote {
          font-family: 'Playfair Display', Georgia, serif;
          font-style: italic;
          font-size: clamp(0.9375rem, 1.5vw, 1.0625rem);
          line-height: 1.6;
          color: #1B3C2A;
          margin-bottom: 1.25rem;
          flex: 1;
        }
        .review-author {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .review-author-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 700;
          color: #1B3C2A;
        }
        .review-verified {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 600;
          color: rgba(27,60,42,0.4);
          letter-spacing: 0.05em;
        }
      `}</style>

      <section className="reviews-section">
        <div className="reviews-inner">
          <Reveal className="reviews-header">
            <p className="reviews-eyebrow">{t('reviewsEyebrow')}</p>
            <h2 className="reviews-heading">{t('reviewsHeading')}</h2>
          </Reveal>

          <div className="reviews-list" role="list">
            {reviews.map((review, i) => (
              <Reveal key={review.author} delay={i * 0.1}>
                <article className="review-item" role="listitem">
                  <Stars />
                  <blockquote className="review-quote">&ldquo;{review.text}&rdquo;</blockquote>
                  <div className="review-author">
                    <span className="review-author-name">{review.author}</span>
                    <span className="review-verified">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="#4ade80" aria-hidden="true">
                        <path d="M5 0a5 5 0 100 10A5 5 0 005 0zm2.35 3.5L4.7 6.85 2.65 4.8a.5.5 0 00-.7.7l2.4 2.4a.5.5 0 00.7 0l3-3.65a.5.5 0 00-.7-.75z" />
                      </svg>
                      ✓
                    </span>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
