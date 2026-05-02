import { createClient } from '@/lib/supabase/client'
import type { BlogPost } from '@/types'

export const BLOG_ADMIN_PAGE_SIZE = 15

export const blogKeys = {
  all: ['blog'] as const,
  posts: () => [...blogKeys.all, 'posts'] as const,
  post: (slug: string) => [...blogKeys.posts(), slug] as const,
  adminPosts: (page?: number) => [...blogKeys.all, 'admin-posts', page ?? 0] as const,
}

export async function fetchPublishedBlogPosts(): Promise<BlogPost[]> {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .lte('published_at', today)
    .order('published_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as BlogPost[]
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data as BlogPost | null
}

export interface BlogAdminResult {
  posts: BlogPost[]
  total: number
  page: number
  pageSize: number
}

export async function fetchAllBlogPosts(page = 0): Promise<BlogAdminResult> {
  const supabase = createClient()
  const from = page * BLOG_ADMIN_PAGE_SIZE
  const to = from + BLOG_ADMIN_PAGE_SIZE - 1

  const { data, error, count } = await supabase
    .from('blog_posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw new Error(error.message)
  return {
    posts: (data ?? []) as BlogPost[],
    total: count ?? 0,
    page,
    pageSize: BLOG_ADMIN_PAGE_SIZE,
  }
}
