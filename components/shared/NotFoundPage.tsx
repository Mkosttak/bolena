import Image from 'next/image'
import Link from 'next/link'
import { Home, UtensilsCrossed } from 'lucide-react'

interface NotFoundCopy {
  title: string
  subtitle: string
  accent: string
  primaryCta: string
  secondaryCta: string
}

interface NotFoundPageProps {
  copy: NotFoundCopy
  homeHref: string
  menuHref: string
}

export function NotFoundPage({ copy, homeHref, menuHref }: NotFoundPageProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#d8ebe0] px-4 py-8 text-[#174b39] sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(135deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 38%),
            linear-gradient(0deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2)),
            linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, min(32vw, 220px) min(32vw, 220px), min(32vw, 220px) min(32vw, 220px)',
          backgroundPosition: 'center, center, center, center',
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_42%)]" aria-hidden />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <section className="w-full text-center">
          <div className="relative mx-auto mb-8 flex h-44 w-44 items-center justify-center rounded-full border-[5px] border-white bg-[#fffaf3] shadow-[0_28px_60px_-26px_rgba(25,63,49,0.45)] sm:h-48 sm:w-48">
            <div className="absolute inset-3 rounded-full bg-[radial-gradient(circle_at_top,#ffffff_0%,#fff8ee_60%,#f3e7d7_100%)]" />
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              <Image
                src="/images/bolena_logo.png"
                alt="Bolena Cafe"
                fill
                className="object-contain"
                sizes="112px"
                priority
              />
            </div>
          </div>

          <p className="font-heading text-[4.8rem] font-black leading-none tracking-[-0.08em] text-[#c4841a] drop-shadow-[0_5px_0_rgba(255,255,255,0.55)] sm:text-[6.2rem]">
            404
          </p>

          <h1 className="mx-auto mt-5 max-w-4xl font-heading text-3xl font-black uppercase leading-[0.95] tracking-[0.02em] text-[#045938] sm:text-5xl lg:text-[4.2rem]">
            {copy.title}
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#365548] sm:text-[1.42rem] sm:leading-9">
            {copy.subtitle}
          </p>

          <p className="mx-auto mt-2 max-w-3xl text-lg font-extrabold leading-8 text-[#d27d18] sm:text-[1.42rem] sm:leading-9">
            {copy.accent}
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href={homeHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#045938] px-8 py-4 text-sm font-bold text-white shadow-[0_20px_40px_-24px_rgba(4,89,56,0.8)] transition hover:-translate-y-0.5 hover:bg-[#056744]"
            >
              <Home className="h-4 w-4" strokeWidth={2.4} />
              <span>{copy.primaryCta}</span>
            </Link>
            <Link
              href={menuHref}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#e5d1b5] bg-[#f7eddc] px-8 py-4 text-sm font-bold text-[#0c6040] shadow-[0_20px_40px_-28px_rgba(90,67,38,0.42)] transition hover:-translate-y-0.5 hover:bg-[#fbf2e4]"
            >
              <UtensilsCrossed className="h-4 w-4" strokeWidth={2.4} />
              <span>{copy.secondaryCta}</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
