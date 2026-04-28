import { describe, it, expect } from 'vitest'
import { blogSchema } from '@/lib/validations/blog.schema'

const validPost = {
  slug: 'glutensiz-ekmek-tarifi',
  title_tr: 'Glutensiz Ekmek Tarifi',
  content_tr: '<p>Harika bir tarif.</p>',
  author_name: 'Ayşe Yılmaz',
}

describe('blogSchema', () => {
  it('geçerli blog yazısı verisini kabul eder', () => {
    const result = blogSchema.safeParse(validPost)
    expect(result.success).toBe(true)
  })

  it('boş başlık reddeder', () => {
    const result = blogSchema.safeParse({ ...validPost, title_tr: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('title_tr')
    }
  })

  it('boş içerik reddeder', () => {
    const result = blogSchema.safeParse({ ...validPost, content_tr: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('content_tr')
    }
  })

  it('geçersiz slug formatını reddeder (büyük harf)', () => {
    const result = blogSchema.safeParse({ ...validPost, slug: 'Glutensiz-Ekmek' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('slug')
    }
  })

  it('geçersiz slug formatını reddeder (boşluk)', () => {
    const result = blogSchema.safeParse({ ...validPost, slug: 'glutensiz ekmek' })
    expect(result.success).toBe(false)
  })

  it('geçerli slug kabul eder (rakam ve tire)', () => {
    const result = blogSchema.safeParse({ ...validPost, slug: 'tarif-001-ekmek' })
    expect(result.success).toBe(true)
  })

  it('boş yazar adını reddeder', () => {
    const result = blogSchema.safeParse({ ...validPost, author_name: '' })
    expect(result.success).toBe(false)
  })

  it('300 karakterden uzun özeti reddeder', () => {
    const result = blogSchema.safeParse({ ...validPost, excerpt_tr: 'a'.repeat(301) })
    expect(result.success).toBe(false)
  })

  it('tam 300 karakterlik özeti kabul eder', () => {
    const result = blogSchema.safeParse({ ...validPost, excerpt_tr: 'a'.repeat(300) })
    expect(result.success).toBe(true)
  })

  it('60 karakterden uzun meta başlığını reddeder', () => {
    const result = blogSchema.safeParse({ ...validPost, meta_title: 'a'.repeat(61) })
    expect(result.success).toBe(false)
  })

  it('160 karakterden uzun meta açıklamasını reddeder', () => {
    const result = blogSchema.safeParse({ ...validPost, meta_description: 'a'.repeat(161) })
    expect(result.success).toBe(false)
  })

  it('is_published varsayılan değeri false olarak atar', () => {
    const result = blogSchema.safeParse(validPost)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_published).toBe(false)
    }
  })

  it('tags varsayılan değeri boş dizi olarak atar', () => {
    const result = blogSchema.safeParse(validPost)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual([])
    }
  })

  it('focus_keywords varsayılan değeri boş dizi olarak atar', () => {
    const result = blogSchema.safeParse(validPost)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.focus_keywords).toEqual([])
    }
  })

  it('tags dizisi ile birlikte kabul eder', () => {
    const result = blogSchema.safeParse({
      ...validPost,
      tags: ['glutensiz', 'tarif', 'sağlıklı'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toHaveLength(3)
    }
  })

  it('focus_keywords dizisi ile birlikte kabul eder', () => {
    const result = blogSchema.safeParse({
      ...validPost,
      focus_keywords: ['glutensiz ekmek', 'çölyak tarif'],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.focus_keywords).toHaveLength(2)
    }
  })

  it('İngilizce alanlar opsiyonel — null/undefined kabul eder', () => {
    const result = blogSchema.safeParse({
      ...validPost,
      title_en: null,
      content_en: null,
      excerpt_en: null,
    })
    expect(result.success).toBe(true)
  })

  it('tam verili geçerli blog yazısını kabul eder', () => {
    const result = blogSchema.safeParse({
      slug: 'tam-blog-yazisi',
      title_tr: 'Tam Blog Yazısı',
      title_en: 'Full Blog Post',
      content_tr: '<p>TR içerik.</p>',
      content_en: '<p>EN content.</p>',
      excerpt_tr: 'Kısa özet',
      excerpt_en: 'Short excerpt',
      cover_image_url: 'https://example.com/image.jpg',
      author_name: 'Test Yazar',
      published_at: '2026-04-11',
      is_published: true,
      tags: ['glutensiz'],
      meta_title: 'SEO Başlığı',
      meta_description: 'SEO açıklaması',
      focus_keywords: ['glutensiz', 'çölyak'],
    })
    expect(result.success).toBe(true)
  })
})
