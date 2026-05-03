'use server'

import { createClient } from '@/lib/supabase/server'
import { requireModuleAccess } from '@/lib/auth/guards'
import { blogSchema } from '@/lib/validations/blog.schema'
import type { BlogInput } from '@/lib/validations/blog.schema'
// Server-safe regex-based sanitize (jsdom-free, Vercel runtime'da guvenli).
// BlogDetailContent (client) render'da DOMPurify ile ikinci katman uygular.
import { sanitizeBlogContentServer as sanitizeBlogContent } from '@/lib/utils/sanitize-html-server'

function calcReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export async function createBlogPost(input: BlogInput) {
  const auth = await requireModuleAccess('blog')
  if ('error' in auth) return { error: auth.error }

  const parsed = blogSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }

  const supabase = await createClient()
  const cleanContentTr = sanitizeBlogContent(parsed.data.content_tr)
  const cleanContentEn = parsed.data.content_en ? sanitizeBlogContent(parsed.data.content_en) : null
  const readingTime = calcReadingTime(cleanContentTr)

  const { error } = await supabase.from('blog_posts').insert({
    slug: parsed.data.slug,
    title_tr: parsed.data.title_tr,
    title_en: parsed.data.title_en ?? null,
    content_tr: cleanContentTr,
    content_en: cleanContentEn,
    excerpt_tr: parsed.data.excerpt_tr ?? null,
    excerpt_en: parsed.data.excerpt_en ?? null,
    cover_image_url: parsed.data.cover_image_url ?? null,
    author_name: parsed.data.author_name,
    published_at: parsed.data.published_at ?? null,
    is_published: parsed.data.is_published,
    reading_time_minutes: readingTime,
    tags: parsed.data.tags,
    meta_title: parsed.data.meta_title ?? null,
    meta_description: parsed.data.meta_description ?? null,
    focus_keywords: parsed.data.focus_keywords,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateBlogPost(id: string, input: BlogInput) {
  const auth = await requireModuleAccess('blog')
  if ('error' in auth) return { error: auth.error }

  const parsed = blogSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Geçersiz veri' }

  const supabase = await createClient()
  const cleanContentTr = sanitizeBlogContent(parsed.data.content_tr)
  const cleanContentEn = parsed.data.content_en ? sanitizeBlogContent(parsed.data.content_en) : null
  const readingTime = calcReadingTime(cleanContentTr)

  const { error } = await supabase
    .from('blog_posts')
    .update({
      slug: parsed.data.slug,
      title_tr: parsed.data.title_tr,
      title_en: parsed.data.title_en ?? null,
      content_tr: cleanContentTr,
      content_en: cleanContentEn,
      excerpt_tr: parsed.data.excerpt_tr ?? null,
      excerpt_en: parsed.data.excerpt_en ?? null,
      cover_image_url: parsed.data.cover_image_url ?? null,
      author_name: parsed.data.author_name,
      published_at: parsed.data.published_at ?? null,
      is_published: parsed.data.is_published,
      reading_time_minutes: readingTime,
      tags: parsed.data.tags,
      meta_title: parsed.data.meta_title ?? null,
      meta_description: parsed.data.meta_description ?? null,
      focus_keywords: parsed.data.focus_keywords,
    })
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteBlogPost(id: string) {
  const auth = await requireModuleAccess('blog')
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleBlogPublished(id: string, isPublished: boolean) {
  const auth = await requireModuleAccess('blog')
  if ('error' in auth) return { error: auth.error }

  const supabase = await createClient()
  const updateData: { is_published: boolean; published_at?: string } = { is_published: isPublished }
  if (isPublished) {
    const { data } = await supabase.from('blog_posts').select('published_at').eq('id', id).single()
    if (!data?.published_at) {
      updateData.published_at = new Date().toISOString().slice(0, 10)
    }
  }
  const { error } = await supabase.from('blog_posts').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
