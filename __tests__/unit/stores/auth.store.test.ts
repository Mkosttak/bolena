import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { Profile } from '@/types'

const adminProfile: Profile = {
  id: 'admin-1',
  email: 'admin@bolena.com',
  full_name: 'Admin User',
  role: 'admin',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const employeeProfile: Profile = {
  id: 'employee-1',
  email: 'emp@bolena.com',
  full_name: 'Çalışan User',
  role: 'employee',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth()
  })

  describe('hasPermission — admin', () => {
    it('admin rolü tüm modüllere erişebilir', () => {
      useAuthStore.getState().setProfile(adminProfile)
      const { hasPermission } = useAuthStore.getState()

      expect(hasPermission('users')).toBe(true)
      expect(hasPermission('menu')).toBe(true)
      expect(hasPermission('tables')).toBe(true)
      expect(hasPermission('reservations')).toBe(true)
      expect(hasPermission('platform-orders')).toBe(true)
      expect(hasPermission('working-hours')).toBe(true)
      expect(hasPermission('reports')).toBe(true)
      expect(hasPermission('dashboard')).toBe(true)
    })

    it('admin için izin listesi boş olsa bile erişim var', () => {
      useAuthStore.getState().setProfile(adminProfile)
      useAuthStore.getState().setPermissions([])
      expect(useAuthStore.getState().hasPermission('menu')).toBe(true)
    })
  })

  describe('hasPermission — employee', () => {
    it('employee sadece izinli modüllere erişebilir', () => {
      useAuthStore.getState().setProfile(employeeProfile)
      useAuthStore.getState().setPermissions(['tables', 'reservations'])

      expect(useAuthStore.getState().hasPermission('tables')).toBe(true)
      expect(useAuthStore.getState().hasPermission('reservations')).toBe(true)
      expect(useAuthStore.getState().hasPermission('menu')).toBe(false)
      expect(useAuthStore.getState().hasPermission('users')).toBe(false)
    })

    it('employee izin listesi boşsa hiçbir modüle erişemez', () => {
      useAuthStore.getState().setProfile(employeeProfile)
      useAuthStore.getState().setPermissions([])

      expect(useAuthStore.getState().hasPermission('tables')).toBe(false)
      expect(useAuthStore.getState().hasPermission('menu')).toBe(false)
    })
  })

  describe('clearAuth', () => {
    it('clearAuth profili ve izinleri sıfırlar', () => {
      useAuthStore.getState().setProfile(adminProfile)
      useAuthStore.getState().setPermissions(['menu'])

      useAuthStore.getState().clearAuth()

      const { profile, permissions, isLoading } = useAuthStore.getState()
      expect(profile).toBeNull()
      expect(permissions).toEqual([])
      expect(isLoading).toBe(false)
    })
  })

  describe('profil yok', () => {
    it('profil yüklenmemişse hiçbir modüle erişim yok', () => {
      expect(useAuthStore.getState().hasPermission('menu')).toBe(false)
      expect(useAuthStore.getState().hasPermission('tables')).toBe(false)
    })
  })

  describe('setLoading', () => {
    it('isLoading doğru set edilir', () => {
      useAuthStore.getState().setLoading(true)
      expect(useAuthStore.getState().isLoading).toBe(true)
      useAuthStore.getState().setLoading(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })
})
