'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import type { Route } from 'next'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { cn } from '@/lib/utils'

interface PublicNavbarProps {
  locale: string
  menuLabel: string
  contactLabel: string
  blogLabel?: string
}

export function PublicNavbar({ locale, menuLabel, contactLabel, blogLabel }: PublicNavbarProps) {
  const pathname = usePathname()
  const isHome = !pathname.includes('/menu') && !pathname.includes('/contact') && !pathname.includes('/blog')
  const isMenu = pathname.includes('/menu')
  const isContact = pathname.includes('/contact')
  const isBlog = pathname.includes('/blog')

  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 40))

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const links = [
    { href: `/${locale}` as Route, label: locale === 'tr' ? 'Ana Sayfa' : 'Home', active: isHome },
    { href: `/${locale}/menu` as Route, label: menuLabel, active: isMenu },
    { href: `/${locale}/blog` as Route, label: blogLabel ?? 'Blog', active: isBlog },
    { href: `/${locale}/contact` as Route, label: contactLabel, active: isContact },
  ]

  return (
    <>
      <style>{`
        .pnav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
        }
        .pnav.menu-mode {
          position: absolute;
        }
        .pnav.scrolled {
          background: rgba(250, 248, 242, 0.94);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(27, 60, 42, 0.1);
          box-shadow: 0 1px 24px rgba(0,0,0,0.06);
        }
        .pnav.top {
          background: transparent;
          border-bottom: 1px solid transparent;
        }
        .pnav.menu-mode.scrolled {
          /* When absolute, we don't necessarily need the scrolled style, but we can keep it transparent 
             if we want, or let it have the background. Since it's absolute, if they scroll 40px it will 
             just change background while scrolling away. Let's make menu-mode always transparent at top */
          background: transparent;
          border-bottom-color: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .pnav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 clamp(1.25rem, 4vw, 2.5rem);
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }
        .pnav-brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .pnav-brand-logo {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          overflow: hidden;
          position: relative;
          border: 1px solid rgba(27,60,42,0.12);
        }
        .pnav-brand-name {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #1B3C2A;
          line-height: 1;
          transition: color 0.3s;
        }
        .pnav-brand-sub {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #C4841A;
          margin-top: 1px;
          line-height: 1;
        }
        .pnav.top .pnav-brand-name, .pnav.menu-mode .pnav-brand-name { color: #FAF8F2; }
        .pnav.top .pnav-brand-sub, .pnav.menu-mode .pnav-brand-sub { color: rgba(250,248,242,0.7); }

        .pnav-links {
          display: none;
          align-items: center;
          gap: 0;
          list-style: none;
          margin: 0; padding: 0;
        }
        @media (min-width: 640px) { .pnav-links { display: flex; } }

        .pnav-link {
          position: relative;
          padding: 0.375rem 0.875rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: rgba(27,60,42,0.55);
          text-decoration: none;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .pnav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0.875rem;
          right: 0.875rem;
          height: 1.5px;
          background: #1B3C2A;
          transform: scaleX(0);
          transform-origin: center;
          transition: transform 0.25s ease;
        }
        .pnav-link:hover { color: #1B3C2A; }
        .pnav-link:hover::after { transform: scaleX(0.6); }
        .pnav-link.active { color: #1B3C2A; font-weight: 700; }
        .pnav-link.active::after { transform: scaleX(1); }

        .pnav.top .pnav-link, .pnav.menu-mode .pnav-link { color: rgba(250,248,242,0.6); }
        .pnav.top .pnav-link:hover, .pnav.menu-mode .pnav-link:hover { color: #FAF8F2; }
        .pnav.top .pnav-link.active, .pnav.menu-mode .pnav-link.active { color: #FAF8F2; }
        .pnav.top .pnav-link::after, .pnav.menu-mode .pnav-link::after { background: #FAF8F2; }

        .pnav-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }
        .pnav-hamburger {
          display: flex;
          flex-direction: column;
          gap: 5px;
          align-items: flex-end;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .pnav-hamburger span {
          display: block;
          height: 1.5px;
          border-radius: 2px;
          background: #1B3C2A;
          transition: width 0.2s, background 0.3s;
        }
        .pnav-hamburger span:nth-child(1) { width: 22px; }
        .pnav-hamburger span:nth-child(2) { width: 16px; }
        .pnav-hamburger span:nth-child(3) { width: 22px; }
        .pnav-hamburger:hover span { width: 22px; }
        .pnav.top .pnav-hamburger span, .pnav.menu-mode .pnav-hamburger span { background: #FAF8F2; }

        @media (min-width: 640px) {
          .pnav-hamburger { display: none; }
        }

        /* Mobile panel */
        .mobile-panel-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          pointer-events: none;
        }
        .mobile-panel-overlay.open { pointer-events: all; }
        .mobile-panel-bg {
          position: absolute;
          inset: 0;
          background: rgba(27,60,42,0.4);
          backdrop-filter: blur(4px);
        }
        .mobile-panel {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(85vw, 340px);
          background: #FAF8F2;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: -8px 0 40px rgba(0,0,0,0.15);
        }
        .mobile-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid rgba(27,60,42,0.08);
        }
        .mobile-panel-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(27,60,42,0.15);
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #1B3C2A;
          transition: background 0.15s;
        }
        .mobile-panel-close:hover { background: rgba(27,60,42,0.06); }

        .mobile-panel-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 2rem 1.5rem;
          gap: 0;
        }
        .mobile-panel-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.125rem 0;
          border-bottom: 1px solid rgba(27,60,42,0.07);
          text-decoration: none;
          color: rgba(27,60,42,0.45);
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          transition: color 0.2s;
        }
        .mobile-panel-link:last-child { border-bottom: none; }
        .mobile-panel-link:hover, .mobile-panel-link.active { color: #1B3C2A; }
        .mobile-panel-link.active .mobile-link-dot { opacity: 1; }
        .mobile-link-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #C4841A;
          flex-shrink: 0;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .mobile-panel-footer {
          padding: 1.5rem;
          border-top: 1px solid rgba(27,60,42,0.08);
        }
        .mobile-panel-tagline {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: rgba(27,60,42,0.35);
          margin-bottom: 0.25rem;
        }
        .mobile-panel-addr {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          color: rgba(27,60,42,0.25);
        }
      `}</style>

      {/* ── Main Nav Bar ── */}
      <header
        className={cn(
          'pnav',
          isMenu && 'menu-mode',
          isHome && !scrolled ? 'top' : 'scrolled'
        )}
      >
        <div className="pnav-inner">
          {/* Brand */}
          <Link href={`/${locale}` as Route} className="pnav-brand" onClick={() => setMobileOpen(false)}>
            <div className="pnav-brand-logo">
              <Image
                src="/images/bolena_logo.png"
                alt="Bolena"
                fill
                className="object-contain"
                priority
                sizes="36px"
              />
            </div>
            <div>
              <div className="pnav-brand-name">Bolena</div>
              <div className="pnav-brand-sub">{locale === 'tr' ? 'Glutensiz Cafe' : 'Gluten-Free Cafe'}</div>
            </div>
          </Link>

          {/* Desktop links */}
          <nav>
            <ul className="pnav-links">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={cn('pnav-link', l.active && 'active')}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: language + hamburger */}
          <div className="pnav-right">
            <LanguageSwitcher />
            <button
              className="pnav-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label={locale === 'tr' ? 'Menüyü Aç' : 'Open Menu'}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Panel ── */}
      <AnimatePresence>
        {mobileOpen && (
          <div className={cn('mobile-panel-overlay', mobileOpen && 'open')}>
            <motion.div
              className="mobile-panel-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="mobile-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            >
              <div className="mobile-panel-head">
                <Link href={`/${locale}` as Route} onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none' }}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 800, color: '#1B3C2A', letterSpacing: '-0.02em' }}>Bolena</div>
                </Link>
                <button className="mobile-panel-close" onClick={() => setMobileOpen(false)} aria-label={locale === 'tr' ? 'Kapat' : 'Close'}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="mobile-panel-nav">
                {links.map((l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.07 }}
                  >
                    <Link
                      href={l.href}
                      className={cn('mobile-panel-link', l.active && 'active')}
                      onClick={() => setMobileOpen(false)}
                    >
                      {l.label}
                      <span className="mobile-link-dot" />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mobile-panel-footer">
                <p className="mobile-panel-tagline">{locale === 'tr' ? '%100 Glutensiz Mutfak' : '100% Gluten-Free Kitchen'}</p>
                <p className="mobile-panel-addr">Yaşamkent, Ankara</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
