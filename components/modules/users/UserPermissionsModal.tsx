'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { usersKeys, fetchUserPermissions } from '@/lib/queries/users.queries'
import { updateUserPermissions } from '@/app/[locale]/admin/users/actions'
import { MODULES } from '@/types'
import type { ModuleName, Profile } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

interface UserPermissionsModalProps {
  user: Profile | null
  onClose: () => void
}

// Modül adını i18n key'e çevirir — `MODULES` ile birebir
const MODULE_LABEL_KEYS = {
  users: 'nav.users',
  menu: 'nav.menu',
  tables: 'nav.tables',
  reservations: 'nav.reservations',
  'platform-orders': 'nav.platformOrders',
  'working-hours': 'nav.workingHours',
  reports: 'nav.reports',
  dashboard: 'nav.dashboard',
  kds: 'nav.kds',
  'site-settings': 'nav.siteSettings',
  blog: 'nav.blog',
} satisfies Record<ModuleName, string>

export function UserPermissionsModal({ user, onClose }: UserPermissionsModalProps) {
  const t = useTranslations()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const { data: currentPerms, isLoading: isLoadingPerms } = useQuery({
    queryKey: usersKeys.permissions(user?.id ?? ''),
    queryFn: () => fetchUserPermissions(user!.id),
    enabled: !!user,
  })

  useEffect(() => {
    if (currentPerms) {
      setSelected(currentPerms)
    }
  }, [currentPerms])

  function toggle(module: string) {
    setSelected((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    )
  }

  async function handleSave() {
    if (!user) return
    setIsLoading(true)
    try {
      const result = await updateUserPermissions(user.id, selected)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(t('common.success'))
      queryClient.invalidateQueries({ queryKey: usersKeys.permissions(user.id) })
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={!!user} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('users.permissions')}</DialogTitle>
          {user && (
            <p className="text-sm text-muted-foreground">{user.full_name}</p>
          )}
        </DialogHeader>

        <div className="space-y-3 py-2">
          {isLoadingPerms ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))
          ) : (
            MODULES.map((module) => (
              <div key={module} className="flex items-center gap-3">
                <Checkbox
                  id={`perm-${module}`}
                  checked={selected.includes(module)}
                  onCheckedChange={() => toggle(module)}
                  disabled={isLoading}
                />
                <Label htmlFor={`perm-${module}`} className="cursor-pointer font-normal">
                  {t(MODULE_LABEL_KEYS[module as ModuleName] as Parameters<typeof t>[0])}
                </Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isLoading || isLoadingPerms}>
            {isLoading ? t('common.loading') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
