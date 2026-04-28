export default function QrLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#FAF8F2] w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-10">
      <div className="pt-2.5 px-1 pb-2">
        <div className="rounded-2xl border border-[#1B3C2A]/10 bg-white/85 p-4 animate-pulse">
          <div className="h-10 w-10 mx-auto rounded-2xl bg-gray-200" />
          <div className="h-3 w-24 mx-auto mt-2 rounded bg-gray-200" />
          <div className="h-2 w-16 mx-auto mt-2 rounded bg-gray-200" />
        </div>
      </div>

      <div className="flex gap-2 py-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-20 shrink-0 rounded-full bg-gray-200/90 animate-pulse"
          />
        ))}
      </div>

      <div className="flex-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 pb-24">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
            <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
            <div className="p-3 space-y-2">
              <div className="h-4 w-3/4 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-gray-200 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 inset-x-0 flex justify-center pointer-events-none pb-3">
        <div className="w-full max-w-7xl px-3 sm:px-6 lg:px-10">
          <div className="rounded-2xl border border-gray-200/80 bg-white/95 h-14 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
