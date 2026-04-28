'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth.store'
import type { Profile, ModuleName } from '@/types'

/**
 * Admin layout'a mount edilir — oturum açıksa profile + izinleri store'a yükler.
 */
export function AuthInitializer() {
  const { setProfile, setPermissions, setLoading, clearAuth } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    async function loadUserData() {
      setLoading(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { clearAuth(); return }

        // Profil yükle
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error || !profile) { clearAuth(); return }

        setProfile(profile as Profile)

        // Admin ise izinlere gerek yok
        if ((profile as Profile).role === 'admin') {
          setPermissions([])
          return
        }

        // Employee için modül izinlerini yükle
        const { data: perms } = await supabase
          .from('module_permissions')
          .select('module_name')
          .eq('user_id', user.id)
          .eq('can_access', true)

        setPermissions(
          (perms ?? []).map((p) => p.module_name as ModuleName)
        )
      } finally {
        setLoading(false)
      }
    }

    loadUserData()

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') clearAuth()
        if (event === 'SIGNED_IN') loadUserData()
      }
    )

    return () => subscription.unsubscribe()
  }, [setProfile, setPermissions, setLoading, clearAuth])

  return null
}
