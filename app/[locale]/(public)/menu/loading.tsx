import { Skeleton } from '@/components/ui/skeleton'

export default function MenuLoading() {
  return (
    <div className="bg-[#FAF8F2] min-h-screen">
      <div className="h-[480px] bg-[#11261B]" aria-hidden />

      <div
        className="relative -mt-8 rounded-t-[32px] bg-[#FAF8F2] pt-2 pb-24"
        style={{ boxShadow: '0 -8px 32px rgba(17,38,27,0.08)' }}
      >
        <div className="flex gap-3 overflow-hidden px-6 py-3 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[42px] w-[110px] flex-shrink-0 rounded-full" />
          ))}
        </div>

        <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-2 px-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl bg-white">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex items-center justify-between pt-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
