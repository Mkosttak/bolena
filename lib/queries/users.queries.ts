import { createClient } from '@/lib/supabase/client'
import { fetchUsersWithLastActive } from '@/app/[locale]/admin/users/actions'
import type { Profile } from '@/types'

export const usersKeys = {
  all: ['users'] as const,
  list: () => [...usersKeys.all, 'list'] as const,
  permissions: (userId: string) => [...usersKeys.all, 'permissions', userId] as const,
}

export async function fetchUsers(): Promise<Profile[]> {
  return fetchUsersWithLastActive()
}

export async function fetchUserPermissions(userId: string): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('module_permissions')
    .select('module_name')
    .eq('user_id', userId)
    .eq('can_access', true)

  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => p.module_name)
}
