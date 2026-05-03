'use client'

// NOT: Client component — sanitize-html DOMPurify'i browser-side calistirir
// (server-side `jsdom` peer dependency sorunu icin). Render edilen icerik
// sabit (ISR), hydration mismatch yok.

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { format } from 'date-fns'
import { tr as trLocale, enUS } from 'date-fns/locale'
import type { Route } from 'next'
import type { BlogPost } from '@/types'
import { sanitizeBlogContent } from '@/lib/utils/sanitize-html'

interface BlogDetailContentProps {
  post: BlogPost
  locale: string
  translations: {
    backToBlog: string
    by: string
    minRead: string
    tags: string
  }
}

export function BlogDetailContent({ post, locale, translations }: BlogDetailContentProps) {
  const title = locale === 'en' && post.title_en ? post.title_en : post.title_tr
  const content = locale === 'en' && post.content_en ? post.content_en : post.content_tr
  const dateLocale = locale === 'en' ? enUS : trLocale
  // Sanitize'ı memoize — content stabil, gereksiz re-sanitize yok
  const sanitizedContent = useMemo(() => sanitizeBlogContent(content), [content])

  return (
    <article style={{ maxWidth: 800, margin: '0 auto', padding: '2rem clamp(1.25rem, 5vw, 2.5rem) 4rem' }}>
      {/* Back */}
      <Link
        href={`/${locale}/blog` as Route}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: 'rgba(27,60,42,0.5)',
          textDecoration: 'none',
          marginBottom: '2rem',
          transition: 'color 0.2s',
        }}
        className="hover:text-primary"
      >
        ← {translations.backToBlog}
      </Link>

      {post.cover_image_url ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: '1.75rem',
            border: '1px solid rgba(27,60,42,0.08)',
            boxShadow: '0 4px 24px rgba(27,60,42,0.08)',
            background: '#F0EDE4',
          }}
        >
          <Image
            src={post.cover_image_url}
            alt={title}
            fill
            priority
            sizes="(max-width: 840px) 100vw, 800px"
            className="object-cover"
          />
        </div>
      ) : null}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                background: 'rgba(196,132,26,0.1)',
                color: '#C4841A',
                borderRadius: 20,
                padding: '3px 12px',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                letterSpacing: '0.04em',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Headline */}
      <h1 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: 'clamp(1.875rem, 4vw, 2.625rem)',
        fontWeight: 800,
        color: '#1B3C2A',
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
        margin: '0 0 1rem',
      }}>
        {title}
      </h1>

      {/* Meta */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 13,
        color: 'rgba(27,60,42,0.5)',
        marginBottom: '2rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontWeight: 600 }}>{translations.by} {post.author_name}</span>
        {post.published_at && (
          <>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
            <span>{format(new Date(post.published_at), 'd MMMM yyyy', { locale: dateLocale })}</span>
          </>
        )}
        {post.reading_time_minutes && (
          <>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
            <span>{post.reading_time_minutes} {translations.minRead}</span>
          </>
        )}
      </div>

      {/* Content */}
      <div
        className="blog-content prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      <style>{`
        .blog-content {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: rgba(27,60,42,0.85);
          line-height: 1.8;
        }
        .blog-content h2 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.625rem;
          font-weight: 700;
          color: #1B3C2A;
          margin: 2.5rem 0 1rem;
          letter-spacing: -0.01em;
        }
        .blog-content h3 {
          font-family: 'Playfair Display', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1B3C2A;
          margin: 2rem 0 0.75rem;
        }
        .blog-content p {
          margin: 0 0 1.25rem;
          font-size: 1.0625rem;
        }
        .blog-content img {
          max-width: 100%;
          border-radius: 12px;
          margin: 1.5rem 0;
        }
        .blog-content a {
          color: #C4841A;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .blog-content a:hover {
          color: #1B3C2A;
        }
        .blog-content ul, .blog-content ol {
          padding-left: 1.5rem;
          margin: 0 0 1.25rem;
        }
        .blog-content li {
          margin-bottom: 0.375rem;
          font-size: 1.0625rem;
        }
        .blog-content blockquote {
          border-left: 3px solid #C4841A;
          padding: 0.5rem 0 0.5rem 1.25rem;
          margin: 1.75rem 0;
          color: rgba(27,60,42,0.6);
          font-style: italic;
          font-size: 1.0625rem;
        }
        .blog-content hr {
          border: none;
          border-top: 1px solid rgba(27,60,42,0.1);
          margin: 2.5rem 0;
        }
        .blog-content strong {
          color: #1B3C2A;
          font-weight: 700;
        }
      `}</style>
    </article>
  )
}
