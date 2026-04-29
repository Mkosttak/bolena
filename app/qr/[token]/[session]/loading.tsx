export default function QrSessionLoading() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#efe4cf]">
      {/* Arkaplan dekorasyon blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[-8%] h-64 w-64 rounded-full bg-[#c4841a]/16 blur-3xl" />
        <div className="absolute right-[-10%] top-[15%] h-72 w-72 rounded-full bg-[#1b3c2a]/14 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[20%] h-80 w-80 rounded-full bg-white/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-dvh max-h-dvh min-h-0 w-full max-w-6xl flex-col overflow-hidden px-3 sm:px-6 lg:px-8">
        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden min-w-0">
          <div className="absolute top-0 inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom,0px))] flex flex-col min-h-0 overflow-hidden">
            
            {/* Başlık skeleton */}
            <div className="flex items-center justify-between px-1 py-4 sm:py-5">
              <div className="h-8 w-36 rounded-2xl bg-black/8 animate-pulse" />
              <div className="h-7 w-24 rounded-xl bg-black/6 animate-pulse" />
            </div>

            {/* Kategori bar skeleton */}
            <div className="flex gap-2 overflow-hidden pb-3">
              {[80, 100, 72, 90, 64].map((w, i) => (
                <div
                  key={i}
                  className="h-9 shrink-0 rounded-2xl bg-white/60 animate-pulse"
                  style={{ width: w }}
                />
              ))}
            </div>

            {/* Ürün kartları skeleton */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/80 animate-pulse"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {/* Ürün görseli */}
                    <div className="aspect-[4/3] bg-[#1B3C2A]/8" />
                    {/* İçerik */}
                    <div className="flex flex-col gap-2 p-3">
                      <div className="h-4 w-3/4 rounded-full bg-[#1B3C2A]/10" />
                      <div className="h-3 w-1/2 rounded-full bg-[#1B3C2A]/6" />
                      <div className="mt-1 h-5 w-16 rounded-full bg-[#1B3C2A]/12" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Alt nav skeleton */}
        <div
          className="absolute bottom-0 inset-x-0 z-20 flex h-[calc(5.5rem+env(safe-area-inset-bottom,0px))] items-start justify-around gap-1 border-t border-white/40 bg-[#efe4cf]/80 px-3 pt-2 backdrop-blur-2xl"
        >
          {[1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 pt-1">
              <div className="h-7 w-7 rounded-xl bg-black/10 animate-pulse" />
              <div className="h-2.5 w-10 rounded-full bg-black/8 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
