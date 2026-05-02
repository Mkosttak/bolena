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

const validBlogInput = {
  slug: 'test-post',
  title_tr: 'Test başlık',
  title_en: 'Test title',
  content_tr: '<p>İçerik</p>',
  content_en: '<p>Content</p>',
  excerpt_tr: '',
  excerpt_en: '',
  cover_image_url: '',
  author_name: 'Author',
  published_at: null,
  is_published: false,
  tags: [],
  meta_title: '',
  meta_description: '',
  focus_keywords: [],
}

describe('blog/actions: createBlogPost', () => {
  it('Geçersiz input → Zod error döner', async () => {
    const { createBlogPost } = await import('@/app/[locale]/admin/blog/actions')
    const result = await createBlogPost({ ...validBlogInput, slug: '' })
    expect(result).toHaveProperty('error')
    expect(typeof (result as { error: string }).error).toBe('string')
  })

  it('Happy path: insert başarılı', async () => {
    const { createBlogPost } = await import('@/app/[locale]/admin/blog/actions')
    mockClient.setNextQueryResult({ data: { id: 'b1' }, error: null })
    const result = await createBlogPost(validBlogInput)
    expect(result).toEqual({ success: true })
    expect(mockClient.mock.from).toHaveBeenCalledWith('blog_posts')
  })

  it('İçerik HTML\'inde script tag\'i sanitize edilir (insert payload\'unda script yok)', async () => {
    const { createBlogPost } = await import('@/app/[locale]/admin/blog/actions')
    // insert().eq()? hayır — sadece .insert(payload). Terminal `then` (await chain).
    mockClient.queueResults({ then: [{ data: null, error: null }] })
    const result = await createBlogPost({
      ...validBlogInput,
      content_tr: '<p>Hi</p><script>alert(1)</script>',
    })
    if ('error' in result) {
      throw new Error(`createBlogPost beklenmedik hata: ${result.error}`)
    }
    const insertCalls = mockClient.fromChain.insert.mock.calls
    expect(insertCalls.length).toBeGreaterThan(0)
    const payload = insertCalls[0]?.[0] as Record<string, string>
    expect(payload.content_tr).not.toContain('<script>')
    expect(payload.content_tr).toContain('<p>Hi</p>')
  })
})

describe('blog/actions: deleteBlogPost', () => {
  it('Happy path: delete çağrılır', async () => {
    const { deleteBlogPost } = await import('@/app/[locale]/admin/blog/actions')
    mockClient.setNextQueryResult({ data: null, error: null })
    const result = await deleteBlogPost('blog-id')
    expect(result).toEqual({ success: true })
  })

  it('Hata varsa error döner', async () => {
    const { deleteBlogPost } = await import('@/app/[locale]/admin/blog/actions')
    mockClient.setNextQueryResult({ data: null, error: { message: 'fail' } })
    const result = await deleteBlogPost('blog-id')
    expect(result).toEqual({ error: 'fail' })
  })
})
