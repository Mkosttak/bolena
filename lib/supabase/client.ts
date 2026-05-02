import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL.trim(),
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY.trim()
  )
}
