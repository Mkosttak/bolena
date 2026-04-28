'use client'

import * as React from 'react'
import { SidebarContent } from './SidebarContent'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { ModuleName } from '@/types'

interface SidebarProps {
  locale: string
  role: 'admin' | 'employee'
  fullName: string
  allowedModules: ModuleName[]
}

export function Sidebar({ locale, role, fullName, allowedModules }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
    setIsMounted(true)
  }, [])

  const handleToggle = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  if (!isMounted) {
    return (
      <aside className="hidden lg:flex w-60 sticky top-0 h-screen border-r bg-sidebar backdrop-blur-xl flex-col" />
    )
  }

  return (
    <motion.aside 
      initial={false}
      animate={{ 
        width: isCollapsed ? 80 : 240, // w-20 to w-60
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        mass: 1 
      }}
      className={cn(
        "hidden lg:flex sticky top-0 h-screen border-r bg-sidebar backdrop-blur-xl flex-col z-40 outline-none"
      )}
    >
      <SidebarContent 
        locale={locale}
        role={role}
        fullName={fullName}
        allowedModules={allowedModules}
        isCollapsed={isCollapsed}
        onToggle={handleToggle}
      />
    </motion.aside>
  )
}




