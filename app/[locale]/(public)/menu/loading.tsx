import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Menu sayfasi loading state.
 * Anasayfa ile uyumlu: koyu yesil hero alani + krem rounded-top
 * skeleton listesi + ust navbar yer tutucu (locale degisiminde
 * beyaz ekran sicramayi onler).
 */
export default function MenuLoading() {
  return (
    <div className="bg-[#FAF8F2] min-h-screen">
      {/* Navbar yer tutucu — gercek PublicNavbar'in scroll'lu hali ile uyumlu */}
      <header className="fixed inset-x-0 top-0 z-[100] h-[76px] bg-[rgba(250,248,242,0.92)] backdrop-blur-xl border-b border-[#1B3C2A]/8 shadow-[0_4px_24px_-8px_rgba(27,60,42,0.08)]">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-8 px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="relative h-[38px] w-[38px] overflow-hidden rounded-[11px] border border-[#1B3C2A]/12">
              <Image
                src="/images/bolena_logo.png"
                alt="Bolena"
                fill
                priority
                sizes="38px"
                className="object-contain"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-heading text-[19px] font-extrabold tracking-tight text-[#1B3C2A] leading-none">
                Bolena
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-[0.26em] text-[#C4841A] leading-none">
                Glutensiz Cafe
              </span>
            </div>
          </div>
          {/* Linkler placeholder */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-16 rounded-md bg-[#1B3C2A]/8" />
            ))}
          </div>
          {/* Dil + hamburger placeholder */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-[72px] rounded-full bg-[#1B3C2A]/8" />
          </div>
        </div>
      </header>

      {/* Hero — koyu yesil, MenuHero ile uyumlu */}
      <div
        className="relative h-[440px] sm:h-[480px] bg-gradient-to-b from-[#11261B] to-[#1B3C2A] flex items-end justify-center pb-16 sm:pb-20 overflow-hidden"
        aria-hidden
      >
        {/* Subtle dekoratif altın glow */}
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[#C4841A]/[0.06] blur-3xl" />

        <div className="relative flex flex-col items-center gap-4 px-6 text-center">
          <Skeleton className="h-3 w-32 rounded bg-[#C4841A]/30" />
          <Skeleton className="h-10 sm:h-14 w-64 sm:w-80 rounded bg-[#FAF8F2]/15" />
          <Skeleton className="h-4 w-72 sm:w-96 rounded bg-[#FAF8F2]/10" />
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20 rounded-full bg-[#FAF8F2]/10" />
            ))}
          </div>
        </div>
      </div>

      {/* Icerik — krem rounded-top */}
      <div
        className="relative -mt-8 rounded-t-[32px] bg-[#FAF8F2] pt-4 pb-24"
        style={{ boxShadow: '0 -8px 32px rgba(17,38,27,0.08)' }}
      >
        {/* Kategori tabs */}
        <div className="sticky top-[76px] z-20 bg-[rgba(250,248,242,0.92)] backdrop-blur-md px-4 sm:px-8 py-3 mb-2">
          <div className="mx-auto flex max-w-[1200px] items-center gap-2">
            <Skeleton className="h-[38px] w-[38px] rounded-full bg-[#1B3C2A]/8" />
            <div className="flex flex-1 gap-3 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[42px] w-[110px] flex-shrink-0 rounded-full bg-[#1B3C2A]/8"
                />
              ))}
            </div>
            <Skeleton className="h-[38px] w-[38px] rounded-full bg-[#1B3C2A]/8" />
          </div>
        </div>

        {/* Kategori basligi */}
        <div className="mx-auto max-w-[1200px] px-6 pt-4 pb-3 text-center">
          <Skeleton className="mx-auto h-7 w-40 rounded bg-[#1B3C2A]/10" />
        </div>

        {/* Urun grid */}
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-3 px-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl bg-white shadow-sm border border-[#1B3C2A]/5">
              <Skeleton className="aspect-[4/3] w-full rounded-none bg-[#1B3C2A]/8" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4 bg-[#1B3C2A]/10" />
                <Skeleton className="h-3 w-full bg-[#1B3C2A]/6" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-6 w-16 bg-[#1B3C2A]/10" />
                  <Skeleton className="h-9 w-9 rounded-xl bg-[#1B3C2A]/10" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
