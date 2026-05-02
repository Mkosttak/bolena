import { Skeleton } from '@/components/ui/skeleton'

export default function MenuLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      <Skeleton className="h-12 w-64 mb-8" />
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-8 w-40" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-32 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
