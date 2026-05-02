import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSupabaseMock } from '../helpers/supabase-mock'

const mockClient = createSupabaseMock()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => mockClient.client),
}))

beforeEach(() => {
  mockClient.reset?.()
  vi.clearAllMocks()
})

const validCategory = {
  name_tr: 'Kahveler',
  name_en: 'Coffees',
  sort_order: 1,
  is_active: true,
}

describe('menu/actions: createCategory', () => {
  it('happy path: kategori insert', async () => {
    const { createCategory } = await import('@/app/[locale]/admin/menu/actions')
    mockClient.setNextQueryResult({ data: null, error: null })
    const result = await createCategory(validCategory)
    expect(result).toEqual({ success: true })
    expect(mockClient.mock.from).toHaveBeenCalledWith('categories')
  })

  it('Boş name_tr → Zod fail', async () => {
    const { createCategory } = await import('@/app/[locale]/admin/menu/actions')
    const result = await createCategory({ ...validCategory, name_tr: '' })
    expect(result).toHaveProperty('error')
  })
})

describe('menu/actions: deleteCategory', () => {
  it('Kategoride ürün varsa silmez', async () => {
    const { deleteCategory } = await import('@/app/[locale]/admin/menu/actions')
    mockClient.fromChain.limit.mockReturnValueOnce(
      Promise.resolve({ data: [{ id: 'p1' }], error: null }) as never,
    )
    const result = await deleteCategory('cat-id')
    expect(result).toHaveProperty('error')
    expect((result as { error: string }).error).toMatch(/ürün|product/i)
  })

  it('Boş kategori silinir', async () => {
    const { deleteCategory } = await import('@/app/[locale]/admin/menu/actions')
    mockClient.fromChain.limit.mockReturnValueOnce(
      Promise.resolve({ data: [], error: null }) as never,
    )
    mockClient.setNextQueryResult({ data: null, error: null })
    const result = await deleteCategory('cat-id')
    expect(result).toEqual({ success: true })
  })
})

describe('menu/actions: updateCategory', () => {
  it('happy path: update çağrılır', async () => {
    const { updateCategory } = await import('@/app/[locale]/admin/menu/actions')
    mockClient.setNextQueryResult({ data: null, error: null })
    const result = await updateCategory('cat-id', validCategory)
    expect(result).toEqual({ success: true })
    expect(mockClient.fromChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ name_tr: 'Kahveler' }),
    )
  })
})
