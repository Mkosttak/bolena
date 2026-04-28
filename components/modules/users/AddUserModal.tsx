'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createUserSchema, type CreateUserInput } from '@/lib/validations/user.schema'
import { usersKeys } from '@/lib/queries/users.queries'
import { createUser } from '@/app/[locale]/admin/users/actions'
import { MODULES, type ModuleName } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface AddUserModalProps {
  open: boolean
  onClose: () => void
}

/** `MODULES` ile birebir; eksik anahtar TS hatası verir */
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

export function AddUserModal({ open, onClose }: AddUserModalProps) {
  const t = useTranslations('users')
  const tCommon = useTranslations('common')
  const tNav = useTranslations('nav')
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [role, setRole] = useState<'admin' | 'employee'>('employee')
  const [selectedModules, setSelectedModules] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'employee' },
  })

  function toggleModule(module: string) {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    )
  }

  async function onSubmit(data: CreateUserInput) {
    setIsLoading(true)
    try {
      const result = await createUser({ ...data, modules: selectedModules })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: usersKeys.list() })
      handleClose()
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    reset()
    setRole('employee')
    setSelectedModules([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addUser')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="fullName">{t('fullName')}</Label>
            <Input
              id="fullName"
              disabled={isLoading}
              {...register('fullName')}
            />
            {errors.fullName && (
              <p className="text-xs text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              type="password"
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>{t('role')}</Label>
            <Select
              value={role}
              disabled={isLoading}
              onValueChange={(val) => {
                const r = val as 'admin' | 'employee'
                setRole(r)
                setValue('role', r)
                if (r === 'admin') setSelectedModules([])
              }}
            >
              <SelectTrigger>
                <SelectValue>
                  {role === 'admin' ? t('admin') : t('employee')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">{t('employee')}</SelectItem>
                <SelectItem value="admin">{t('admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === 'employee' && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>{t('permissions')}</Label>
                <div className="space-y-2">
                  {MODULES.filter((m) => m !== 'dashboard').map((module) => (
                    <div key={module} className="flex items-center gap-3">
                      <Checkbox
                        id={`new-perm-${module}`}
                        checked={selectedModules.includes(module)}
                        onCheckedChange={() => toggleModule(module)}
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor={`new-perm-${module}`}
                        className="cursor-pointer font-normal"
                      >
                        {tNav(MODULE_LABEL_KEYS[module as ModuleName].slice(4) as Parameters<typeof tNav>[0])}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? tCommon('loading') : tCommon('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
