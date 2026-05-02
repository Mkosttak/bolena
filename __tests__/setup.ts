import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// 'server-only' marker — test ortamında no-op (gerçek prod'da Next bunu enforce eder)
vi.mock('server-only', () => ({}))

// Auth guards — default tüm testlerde admin olarak geçer.
// Test gerçek auth davranışını test etmek istiyorsa bu mock'u override edebilir.
vi.mock('@/lib/auth/guards', () => ({
  requireAuth: vi.fn(async () => ({
    supabase: {} as unknown,
    userId: 'test-admin-id',
    role: 'admin' as const,
  })),
  requireAdmin: vi.fn(async () => ({
    supabase: {} as unknown,
    userId: 'test-admin-id',
    role: 'admin' as const,
  })),
  requireModuleAccess: vi.fn(async () => ({
    supabase: {} as unknown,
    userId: 'test-admin-id',
    role: 'admin' as const,
  })),
}))

// Her testten sonra DOM temizle
afterEach(() => {
  cleanup()
})

// Supabase env mock
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.SKIP_ENV_VALIDATION = 'true'

// localStorage / sessionStorage in-memory mock (Zustand persist için)
class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() { return this.data.size }
  clear() { this.data.clear() }
  getItem(key: string) { return this.data.get(key) ?? null }
  setItem(key: string, value: string) { this.data.set(key, String(value)) }
  removeItem(key: string) { this.data.delete(key) }
  key(i: number) { return Array.from(this.data.keys())[i] ?? null }
}

if (typeof globalThis.localStorage === 'undefined' ||
    typeof globalThis.localStorage.setItem !== 'function') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    writable: true,
  })
}
if (typeof globalThis.sessionStorage === 'undefined' ||
    typeof globalThis.sessionStorage.setItem !== 'function') {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: new MemoryStorage(),
    writable: true,
  })
}
