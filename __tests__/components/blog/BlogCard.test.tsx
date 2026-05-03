import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlogCard } from '@/components/modules/blog/BlogCard'
import { SITE_LOGO_SRC } from '@/lib/site-brand'
import type { BlogPost } from '@/types'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}))

function makePost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    id: 'post-1',
    slug: 'test-blog-yazisi',
    title_tr: 'Test Blog Yazısı',
    title_en: 'Test Blog Post',
    content_tr: '<p>İçerik</p>',
    content_en: '<p>Content</p>',
    excerpt_tr: 'Kısa özet',
    excerpt_en: 'Short excerpt',
    cover_image_url: null,
    author_name: 'Test Yazar',
    published_at: '2026-04-11',
    is_published: true,
    reading_time_minutes: 3,
    tags: ['glutensiz', 'tarif'],
    meta_title: null,
    meta_description: null,
    focus_keywords: [],
    created_at: '2026-04-11T10:00:00Z',
    updated_at: '2026-04-11T10:00:00Z',
    ...overrides,
  }
}

const translations = {
  readMore: 'Devamını Oku',
  by: 'Yazar:',
  minRead: 'dk okuma',
}

describe('BlogCard', () => {
  it('Türkçe başlığı doğru render eder', () => {
    render(<BlogCard post={makePost()} locale="tr" translations={translations} />)
    expect(screen.getByText('Test Blog Yazısı')).toBeInTheDocument()
  })

  it('İngilizce başlığı locale="en" iken render eder', () => {
    render(<BlogCard post={makePost()} locale="en" translations={translations} />)
    expect(screen.getByText('Test Blog Post')).toBeInTheDocument()
  })

  it('İngilizce başlık yoksa TR başlığa düşer', () => {
    render(<BlogCard post={makePost({ title_en: null })} locale="en" translations={translations} />)
    expect(screen.getByText('Test Blog Yazısı')).toBeInTheDocument()
  })

  it('yazar adını render eder', () => {
    render(<BlogCard post={makePost()} locale="tr" translations={translations} />)
    expect(screen.getByText(/Test Yazar/)).toBeInTheDocument()
  })

  it('okuma süresini render eder', () => {
    render(<BlogCard post={makePost()} locale="tr" translations={translations} />)
    expect(screen.getByText(/3/)).toBeInTheDocument()
    expect(screen.getByText(/dk okuma/)).toBeInTheDocument()
  })

  it('"Devamını Oku" linkini render eder', () => {
    render(<BlogCard post={makePost()} locale="tr" translations={translations} />)
    expect(screen.getByText(/Devamını Oku/)).toBeInTheDocument()
  })

  it('linkin doğru href değerini içerdiğini doğrular', () => {
    render(<BlogCard post={makePost()} locale="tr" translations={translations} />)
    const links = screen.getAllByRole('link')
    const blogLink = links.find((l) => l.getAttribute('href')?.includes('test-blog-yazisi'))
    expect(blogLink).toBeDefined()
    expect(blogLink?.getAttribute('href')).toBe('/tr/blog/test-blog-yazisi')
  })

  it('etiketleri render eder', () => {
    render(<BlogCard post={makePost()} locale="tr" translations={translations} />)
    expect(screen.getByText('glutensiz')).toBeInTheDocument()
    expect(screen.getByText('tarif')).toBeInTheDocument()
  })

  it('cover_image_url varsa görsel render eder', () => {
    render(
      <BlogCard
        post={makePost({ cover_image_url: 'https://example.com/img.jpg' })}
        locale="tr"
        translations={translations}
      />
    )
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg')
    expect(img).toHaveAttribute('alt', 'Test Blog Yazısı')
  })

  it('cover_image_url yoksa liste kartında site logosunu gösterir', () => {
    render(
      <BlogCard post={makePost({ cover_image_url: null })} locale="tr" translations={translations} />
    )
    const img = screen.getByRole('img', { name: 'Test Blog Yazısı' })
    expect(img).toHaveAttribute('src', SITE_LOGO_SRC)
  })

  it('özet yoksa excerpt alanı render edilmez', () => {
    render(
      <BlogCard
        post={makePost({ excerpt_tr: null, excerpt_en: null })}
        locale="tr"
        translations={translations}
      />
    )
    expect(screen.queryByText('Kısa özet')).not.toBeInTheDocument()
  })
})
