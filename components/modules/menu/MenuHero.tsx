'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface MenuHeroProps {
  locale: string
  title: string
  subtitle: string
  eyebrowText?: string
  badges?: string[]
}

export function MenuHero({ locale, title, subtitle, eyebrowText, badges }: MenuHeroProps) {
  const isTr = locale === 'tr'
  const defaultEyebrow = isTr ? 'Bolena Deneyimi' : 'The Bolena Experience'
  const defaultBadges = isTr
    ? ['%100 Glutensiz', 'Taze Malzeme', 'Günlük Hazırlık']
    : ['100% Gluten-Free', 'Fresh Ingredients', 'Made Daily']
  const resolvedEyebrow = eyebrowText ?? defaultEyebrow
  const resolvedBadges = badges ?? defaultBadges

  return (
    <>
      <style>{`
        .mhero {
          position: relative;
          padding-top: clamp(120px, 16vw, 180px);
          padding-bottom: clamp(6rem, 10vw, 10rem);
          overflow: hidden;
          background-color: #11261B;
        }

        .mhero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .mhero-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center 35%;
        }
        .mhero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, rgba(17,38,27,0.95) 0%, rgba(17,38,27,0.85) 45%, rgba(17,38,27,0.3) 100%);
          z-index: 1;
        }
        
        .mhero-bottom-fade {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(to top, #FAF8F2 0%, transparent 100%);
          z-index: 2;
        }

        .mhero-inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 0 clamp(1.5rem, 5vw, 3rem);
          position: relative;
          z-index: 3;
        }

        .mhero-shell {
          display: grid;
          gap: clamp(2rem, 5vw, 4rem);
          align-items: center;
        }
        @media (min-width: 980px) {
          .mhero-shell {
            grid-template-columns: 1fr 400px;
          }
        }

        .mhero-eyebrow {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #E5B25D;
          display: inline-flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .mhero-eyebrow::before {
          content: '';
          display: block;
          width: 2.5rem;
          height: 2px;
          background: currentColor;
          border-radius: 2px;
        }

        .mhero-title {
          font-family: 'Playfair Display', Georgia, serif;
          font-weight: 900;
          font-size: clamp(3.2rem, 8vw, 5.5rem);
          line-height: 1.05;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          margin: 0;
          text-shadow: 0 4px 24px rgba(0,0,0,0.2);
        }
        .mhero-title em {
          font-style: italic;
          color: #E5B25D;
        }

        .mhero-sub-wrap {
          margin-top: clamp(1.25rem, 3vw, 2rem);
          max-width: 32rem;
        }
        .mhero-sub {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: clamp(0.95rem, 1.5vw, 1.1rem);
          line-height: 1.6;
          color: rgba(255,255,255,0.85);
          margin: 0;
          text-shadow: 0 2px 12px rgba(0,0,0,0.2);
        }

        .mhero-panel {
          position: relative;
          border-radius: 28px;
          padding: 2.25rem;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(17,38,27,0.45);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow: 0 32px 64px rgba(0,0,0,0.3);
        }
        .mhero-panel-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
        }
        .mhero-panel-chip {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.7);
        }
        .mhero-panel-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E5B25D;
          box-shadow: 0 0 0 4px rgba(229,178,93,0.2);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(229,178,93,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(229,178,93,0); }
          100% { box-shadow: 0 0 0 0 rgba(229,178,93,0); }
        }

        .mhero-badges {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .mhero-badge-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .mhero-badge-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(229,178,93,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E5B25D;
          flex-shrink: 0;
        }
        .mhero-badge-text {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #FFFFFF;
        }

      `}</style>

      <section className="mhero">
        <div className="mhero-bg">
          <Image src="/images/menu/hero.png" alt="Bolena Cafe Menu" fill priority />
        </div>
        <div className="mhero-overlay" />
        <div className="mhero-bottom-fade" />
        
        <div className="mhero-inner">
          <div className="mhero-shell">
            <div className="mhero-main">
              <motion.div
                className="mhero-eyebrow"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {resolvedEyebrow}
              </motion.div>

              <motion.h1
                className="mhero-title"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              >
                {title.includes(' ') ? (
                  <>
                    {title.split(' ')[0]}{' '}
                    <em>{title.split(' ').slice(1).join(' ')}</em>
                  </>
                ) : (
                  <em>{title}</em>
                )}
              </motion.h1>

              <motion.div 
                className="mhero-sub-wrap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              >
                <p className="mhero-sub">{subtitle}</p>
              </motion.div>
            </div>

            <motion.aside
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            >
              <div className="mhero-panel">
                <div className="mhero-panel-top">
                  <span className="mhero-panel-chip">{resolvedEyebrow}</span>
                  <span className="mhero-panel-dot" />
                </div>
                
                <div className="mhero-badges">
                  {resolvedBadges.map((b) => (
                    <div key={b} className="mhero-badge-item">
                      <div className="mhero-badge-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <span className="mhero-badge-text">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          </div>
        </div>
      </section>
    </>
  )
}
