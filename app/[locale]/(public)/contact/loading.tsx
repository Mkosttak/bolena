import { Skeleton } from '@/components/ui/skeleton'

export default function ContactLoading() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12 space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  )
}
