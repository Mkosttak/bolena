'use client'

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface ReportSectionProps {
  id: string
  icon: LucideIcon
  title: string
  description: string
  children: ReactNode
}

export function ReportSection({ id, icon: Icon, title, description, children }: ReportSectionProps) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/18 dark:ring-1 dark:ring-primary/25">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  )
}
