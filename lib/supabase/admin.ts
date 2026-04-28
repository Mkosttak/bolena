import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Service role client — SADECE server-side kullan (Server Actions, Route Handlers)
 * Asla client bileşenlere import etme, asla NEXT_PUBLIC_ yapma
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
