'use client'

import { create } from 'zustand'
import type { Profile, ModuleName } from '@/types'

interface AuthState {
  profile: Profile | null
  permissions: ModuleName[]
  isLoading: boolean
  // Actions
  setProfile: (profile: Profile) => void
  setPermissions: (permissions: ModuleName[]) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
  hasPermission: (module: ModuleName) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  permissions: [],
  isLoading: true,

  setProfile: (profile) => set({ profile }),
  setPermissions: (permissions) => set({ permissions }),
  setLoading: (isLoading) => set({ isLoading }),

  clearAuth: () =>
    set({ profile: null, permissions: [], isLoading: false }),

  hasPermission: (module: ModuleName) => {
    const { profile, permissions } = get()
    if (!profile) return false
    if (profile.role === 'admin') return true
    return permissions.includes(module)
  },
}))
