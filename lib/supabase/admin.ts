import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/database.types'

/**
 * Service role client — SADECE server-side kullan (Server Actions, Route Handlers).
 * 'server-only' import client component'lerden import edildiğinde build patlar.
 */
export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL.trim(),
    env.SUPABASE_SERVICE_ROLE_KEY.trim(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
