import { Skeleton } from '@/components/ui/skeleton'

export default function BlogLoading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <Skeleton className="h-10 w-48 mb-8" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
