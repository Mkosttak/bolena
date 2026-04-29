'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createUserSchema, setPasswordSchema } from '@/lib/validations/user.schema'
import { MODULES } from '@/types'
import type { CreateUserInput, SetPasswordInput } from '@/lib/validations/user.schema'
import type { Profile } from '@/types'

export async function fetchUsersWithLastActive(): Promise<Profile[]> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const [profilesResult, authResult] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ])

  if (profilesResult.error) throw new Error(profilesResult.error.message)

  const lastSignInMap = new Map<string, string | null>()
  for (const u of authResult.data?.users ?? []) {
    lastSignInMap.set(u.id, u.last_sign_in_at ?? null)
  }

  return (profilesResult.data as Profile[]).map((p) => ({
    ...p,
    last_sign_in_at: lastSignInMap.get(p.id) ?? null,
  }))
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' as const }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { error: 'Forbidden' as const }

  return { supabase, user }
}

export async function createUser(input: CreateUserInput) {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const parsed = createUserSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const adminClient = createAdminClient()

  const { data, error } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    user_metadata: {
      full_name: parsed.data.fullName,
      role: parsed.data.role,
    },
    email_confirm: true,
  })

  if (error) return { error: error.message }

  // handle_new_user trigger profili otomatik oluşturur.
  // employee için module_permissions: form'dan gelen seçili modüller true, geri kalanlar false
  if (parsed.data.role === 'employee' && data.user) {
    const selectedModules = parsed.data.modules ?? []
    await auth.supabase.from('module_permissions').insert(
      MODULES.map((module) => ({
        user_id: data.user.id,
        module_name: module,
        can_access: selectedModules.includes(module),
      }))
    )
  }

  return { success: true, userId: data.user.id }
}

export async function toggleUserStatus(userId: string, currentIsActive: boolean) {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const { error } = await auth.supabase
    .from('profiles')
    .update({ is_active: !currentIsActive })
    .eq('id', userId)

  if (error) return { error: error.message }
  return { success: true }
}

export async function sendPasswordReset(email: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const { error } = await auth.supabase.auth.resetPasswordForEmail(email)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'employee') {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const adminClient = createAdminClient()

  // Supabase Auth metadata güncelle
  const { error: authError } = await adminClient.auth.admin.updateUserById(userId, {
    user_metadata: { role: newRole },
  })
  if (authError) return { error: authError.message }

  // profiles tablosunu güncelle
  const { error: profileError } = await auth.supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
  if (profileError) return { error: profileError.message }

  // Employee'ye geçişte module_permissions yoksa sıfır ile oluştur
  if (newRole === 'employee') {
    const { data: existing } = await auth.supabase
      .from('module_permissions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (!existing?.length) {
      await auth.supabase.from('module_permissions').insert(
        MODULES.map((module) => ({
          user_id: userId,
          module_name: module,
          can_access: false,
        }))
      )
    }
  }

  return { success: true }
}

export async function updateUserProfile(
  userId: string,
  fields: { fullName?: string; email?: string; role?: 'admin' | 'employee' }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const adminClient = createAdminClient()

  // Auth metadata güncelle (email + full_name + role)
  const authUpdate: Record<string, unknown> = {}
  if (fields.email) authUpdate.email = fields.email
  if (fields.fullName || fields.role) {
    authUpdate.user_metadata = {
      ...(fields.fullName ? { full_name: fields.fullName } : {}),
      ...(fields.role ? { role: fields.role } : {}),
    }
  }

  if (Object.keys(authUpdate).length > 0) {
    const { error } = await adminClient.auth.admin.updateUserById(userId, authUpdate)
    if (error) return { error: error.message }
  }

  // profiles tablosunu güncelle
  const profileUpdate: { full_name?: string; email?: string; role?: string } = {}
  if (fields.fullName) profileUpdate.full_name = fields.fullName
  if (fields.email) profileUpdate.email = fields.email
  if (fields.role) profileUpdate.role = fields.role

  if (Object.keys(profileUpdate).length > 0) {
    const { error } = await auth.supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId)
    if (error) return { error: error.message }
  }

  // Employee'ye geçişte module_permissions yoksa oluştur
  if (fields.role === 'employee') {
    const { data: existing } = await auth.supabase
      .from('module_permissions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    if (!existing?.length) {
      await auth.supabase.from('module_permissions').insert(
        MODULES.map((module) => ({ user_id: userId, module_name: module, can_access: false }))
      )
    }
  }

  return { success: true }
}

export async function setUserPassword(input: SetPasswordInput) {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const parsed = setPasswordSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.updateUserById(parsed.data.userId, {
    password: parsed.data.password,
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteUser(userId: string) {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  // Önce kendi kendini silmeye çalışıyor mu kontrol et
  if (auth.user.id === userId) return { error: 'Kendi hesabınızı silemezsiniz' }

  const adminClient = createAdminClient()

  // module_permissions ve profiles cascade delete ile silinir (DB foreign key)
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateUserPermissions(userId: string, selectedModules: string[]) {
  const auth = await requireAdmin()
  if ('error' in auth) return { error: auth.error }

  const { error } = await auth.supabase.from('module_permissions').upsert(
    MODULES.map((module) => ({
      user_id: userId,
      module_name: module,
      can_access: selectedModules.includes(module),
    })),
    { onConflict: 'user_id,module_name' }
  )

  if (error) return { error: error.message }
  return { success: true }
}
