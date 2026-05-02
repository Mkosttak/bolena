import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '../helpers/supabase-mock'

const mockServerClient = createSupabaseMock()
const mockAdminClient = {
  auth: {
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
      updateUserById: vi.fn(),
      listUsers: vi.fn(() => Promise.resolve({ data: { users: [] }, error: null })),
    },
  },
  from: vi.fn(() => mockServerClient.fromChain),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockServerClient.client),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => mockAdminClient),
}))

beforeEach(() => {
  mockServerClient.reset?.()
  vi.clearAllMocks()
})

const adminUser = { id: 'admin-uuid', email: 'a@b.c' }
const employeeProfile = { role: 'employee' }
const adminProfile = { role: 'admin' }

const validCreateInput = {
  email: 'new@user.com',
  password: 'StrongPass123!',
  fullName: 'New User',
  role: 'admin' as const,
  modules: [],
}

describe('users/actions: createUser — yetki kontrolü', () => {
  it('Login olmamış kullanıcı → Unauthorized', async () => {
    const { createUser } = await import('@/app/[locale]/admin/users/actions')
    mockServerClient.mock.auth.getUser.mockResolvedValueOnce({
      data: { user: null }, error: null,
    } as never)
    const result = await createUser(validCreateInput)
    expect(result).toEqual({ error: 'Unauthorized' })
  })

  it('Employee rolündeki user → Forbidden', async () => {
    const { createUser } = await import('@/app/[locale]/admin/users/actions')
    mockServerClient.mock.auth.getUser.mockResolvedValueOnce({
      data: { user: adminUser }, error: null,
    } as never)
    mockServerClient.setNextQueryResult({ data: employeeProfile, error: null })
    const result = await createUser(validCreateInput)
    expect(result).toEqual({ error: 'Forbidden' })
  })

  it('Admin yetkisi varsa adminClient.createUser çağrılır', async () => {
    const { createUser } = await import('@/app/[locale]/admin/users/actions')
    mockServerClient.mock.auth.getUser.mockResolvedValueOnce({
      data: { user: adminUser }, error: null,
    } as never)
    mockServerClient.setNextQueryResult({ data: adminProfile, error: null })
    mockAdminClient.auth.admin.createUser.mockResolvedValueOnce({
      data: { user: { id: 'new-user-id' } }, error: null,
    })
    const result = await createUser(validCreateInput)
    expect(mockAdminClient.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@user.com',
        email_confirm: true,
      }),
    )
    expect(result).toMatchObject({ success: true })
  })
})

describe('users/actions: createUser — input validation', () => {
  it('Geçersiz email → Zod fail', async () => {
    const { createUser } = await import('@/app/[locale]/admin/users/actions')
    mockServerClient.mock.auth.getUser.mockResolvedValueOnce({
      data: { user: adminUser }, error: null,
    } as never)
    mockServerClient.setNextQueryResult({ data: adminProfile, error: null })
    const result = await createUser({ ...validCreateInput, email: 'not-an-email' })
    expect(result).toHaveProperty('error')
  })

  it('Kısa parola → Zod fail', async () => {
    const { createUser } = await import('@/app/[locale]/admin/users/actions')
    mockServerClient.mock.auth.getUser.mockResolvedValueOnce({
      data: { user: adminUser }, error: null,
    } as never)
    mockServerClient.setNextQueryResult({ data: adminProfile, error: null })
    const result = await createUser({ ...validCreateInput, password: 'abc' })
    expect(result).toHaveProperty('error')
  })
})
