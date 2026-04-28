import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] lg:min-h-screen p-4 md:p-5 lg:p-6 max-w-[1600px] mx-auto space-y-5 md:space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4 sm:pb-5">
        <Skeleton className="h-8 w-40 md:h-9 md:w-48 rounded-lg" />
        <Skeleton className="h-10 w-full sm:w-44 rounded-lg shrink-0" />
      </header>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-[11.5rem] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
