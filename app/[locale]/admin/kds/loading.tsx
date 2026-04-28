import { Skeleton } from '@/components/ui/skeleton'

export default function KdsLoading() {
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar skeleton */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-7 w-24" />
      </div>

      {/* Columns skeleton */}
      <div className="flex-1 flex gap-0 divide-x divide-border overflow-hidden">
        {[1, 2, 3].map((col) => (
          <div key={col} className="flex-1 p-4 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
}
