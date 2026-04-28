import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { tr as trLocale, enUS } from 'date-fns/locale'
import type { Route } from 'next'
import { SITE_LOGO_SRC } from '@/lib/site-brand'
import type { BlogPost } from '@/types'

interface BlogCardProps {
  post: BlogPost
  locale: string
  translations: {
    readMore: string
    by: string
    minRead: string
  }
}

export function BlogCard({ post, locale, translations }: BlogCardProps) {
  const title = locale === 'en' && post.title_en ? post.title_en : post.title_tr
  const excerpt = locale === 'en' && post.excerpt_en ? post.excerpt_en : post.excerpt_tr
  const dateLocale = locale === 'en' ? enUS : trLocale
  const href = `/${locale}/blog/${post.slug}` as Route

  return (
    <article
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(27,60,42,0.08)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      className="group hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Cover image */}
      <Link href={href} tabIndex={-1}>
        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#F0EDE4', overflow: 'hidden' }}>
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <Image
              src={SITE_LOGO_SRC}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain p-[14%]"
            />
          )}
          {/* Tags overlay */}
          {post.tags.length > 0 && (
            <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: 'rgba(27,60,42,0.75)',
                    color: '#FAF8F2',
                    borderRadius: 20,
                    padding: '2px 10px',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    backdropFilter: 'blur(6px)',
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Content */}
      <div style={{ padding: '1.25rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {/* Meta */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 12,
          color: 'rgba(27,60,42,0.45)',
        }}>
          {post.published_at && (
            <span>{format(new Date(post.published_at), 'd MMM yyyy', { locale: dateLocale })}</span>
          )}
          {post.reading_time_minutes && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
              <span>{post.reading_time_minutes} {translations.minRead}</span>
            </>
          )}
        </div>

        {/* Title */}
        <Link href={href} style={{ textDecoration: 'none' }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.125rem',
            fontWeight: 700,
            color: '#1B3C2A',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            margin: 0,
          }}
            className="group-hover:text-primary transition-colors line-clamp-2"
          >
            {title}
          </h2>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 13.5,
            color: 'rgba(27,60,42,0.6)',
            lineHeight: 1.6,
            margin: 0,
          }}
            className="line-clamp-3"
          >
            {excerpt}
          </p>
        )}

        {/* Footer */}
        <div style={{ marginTop: 'auto', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(27,60,42,0.45)',
          }}>
            {translations.by} {post.author_name}
          </span>
          <Link
            href={href}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: '#C4841A',
              textDecoration: 'none',
              letterSpacing: '0.04em',
            }}
          >
            {translations.readMore} →
          </Link>
        </div>
      </div>
    </article>
  )
}
