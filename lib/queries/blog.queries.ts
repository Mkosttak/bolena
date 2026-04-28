import { createClient } from '@/lib/supabase/client'
import type { BlogPost } from '@/types'

export const blogKeys = {
  all: ['blog'] as const,
  posts: () => [...blogKeys.all, 'posts'] as const,
  post: (slug: string) => [...blogKeys.posts(), slug] as const,
  adminPosts: () => [...blogKeys.all, 'admin-posts'] as const,
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

export async function fetchAllBlogPosts(): Promise<BlogPost[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as BlogPost[]
}
