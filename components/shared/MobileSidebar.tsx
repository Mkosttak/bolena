'use client'

import * as React from 'react'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SidebarContent } from './SidebarContent'
import { Button } from '@/components/ui/button'
import type { ModuleName } from '@/types'
import { useTranslations } from 'next-intl'

interface MobileSidebarProps {
  locale: string
  role: 'admin' | 'employee'
  fullName: string
  allowedModules: ModuleName[]
}

export function MobileSidebar({ locale, role, fullName, allowedModules }: MobileSidebarProps) {
  const [open, setOpen] = React.useState(false)
  const t = useTranslations('nav')

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        }
      />
      <SheetContent side="left" className="p-0 w-72 border-r-0">
        <SheetHeader className="sr-only">
          <SheetTitle>{t('adminPanel')}</SheetTitle>
        </SheetHeader>
        <SidebarContent
          locale={locale}
          role={role}
          fullName={fullName}
          allowedModules={allowedModules}
          onItemClick={() => setOpen(false)}
          isCollapsed={false}
          onToggle={() => {}}
        />
      </SheetContent>
    </Sheet>
  )
}
