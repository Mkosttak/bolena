'use client'

import { useAuthStore } from '@/lib/stores/auth.store'
import type { ModuleName } from '@/types'

export function usePermission(module: ModuleName): boolean {
  return useAuthStore((state) => state.hasPermission(module))
}

export function useRequirePermission(module: ModuleName): {
  hasAccess: boolean
  isLoading: boolean
} {
  const hasAccess = useAuthStore((state) => state.hasPermission(module))
  const isLoading = useAuthStore((state) => state.isLoading)
  return { hasAccess, isLoading }
}
