import type { BlogPost } from '@/types'
import { BlogCard } from './BlogCard'

interface BlogListSectionProps {
  posts: BlogPost[]
  locale: string
  translations: {
    noPosts: string
    readMore: string
    by: string
    minRead: string
  }
}

export function BlogListSection({ posts, locale, translations }: BlogListSectionProps) {
  if (posts.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '5rem 1.5rem',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        color: 'rgba(27,60,42,0.4)',
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} style={{ margin: '0 auto 1rem' }}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <p>{translations.noPosts}</p>
      </div>
    )
  }

  return (
    <section style={{ maxWidth: 880, margin: '0 auto', padding: '1.5rem clamp(1.25rem, 5vw, 2.5rem) 3rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem',
      }}>
        {posts.map((post) => (
          <BlogCard
            key={post.id}
            post={post}
            locale={locale}
            translations={{
              readMore: translations.readMore,
              by: translations.by,
              minRead: translations.minRead,
            }}
          />
        ))}
      </div>
    </section>
  )
}
