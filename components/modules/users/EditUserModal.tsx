'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import {
  updateUserProfile,
  setUserPassword,
  updateUserPermissions,
  deleteUser,
} from '@/app/[locale]/admin/users/actions'
import { usersKeys, fetchUserPermissions } from '@/lib/queries/users.queries'
import { MODULES, type ModuleName, type Profile } from '@/types'
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
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/* ── Şema ───────────────────────────────────────────────── */
const editSchema = z
  .object({
    fullName: z.string().min(2, 'En az 2 karakter'),
    email: z.string().email('Geçerli e-posta girin'),
    role: z.enum(['admin', 'employee']),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (d) => !d.newPassword || d.newPassword.length >= 8,
    { message: 'En az 8 karakter', path: ['newPassword'] }
  )
  .refine(
    (d) => !d.newPassword || d.newPassword === d.confirmPassword,
    { message: 'Şifreler eşleşmiyor', path: ['confirmPassword'] }
  )

type EditForm = z.infer<typeof editSchema>

/* ── Modül etiket map'i ──────────────────────────────────── */
const MODULE_LABELS: Record<ModuleName, string> = {
  users: 'Kullanıcılar',
  menu: 'Menü',
  tables: 'Masalar',
  reservations: 'Rezervasyonlar',
  'platform-orders': 'Platform Siparişleri',
  'working-hours': 'Çalışma Saatleri',
  reports: 'Raporlar',
  dashboard: 'Dashboard',
  kds: 'KDS',
  'site-settings': 'Site Ayarları',
  blog: 'Blog',
}

/* ── Props ───────────────────────────────────────────────── */
interface EditUserModalProps {
  user: Profile | null
  onClose: () => void
}

/* ── Bileşen ─────────────────────────────────────────────── */
export function EditUserModal({ user, onClose }: EditUserModalProps) {
  const t = useTranslations('users')
  const tCommon = useTranslations('common')
  const queryClient = useQueryClient()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [role, setRole] = useState<'admin' | 'employee'>(user?.role ?? 'employee')

  const { data: currentPerms, isLoading: isLoadingPerms } = useQuery({
    queryKey: usersKeys.permissions(user?.id ?? ''),
    queryFn: () => fetchUserPermissions(user!.id),
    enabled: !!user && user.role === 'employee',
  })

  useEffect(() => {
    if (currentPerms) setSelectedModules(currentPerms)
  }, [currentPerms])

  // Kullanıcı değişince formu sıfırla
  useEffect(() => {
    if (user) {
      reset({ fullName: user.full_name, email: user.email, role: user.role })
      setRole(user.role)
      setShowPasswordSection(false)
      setDeleteConfirmOpen(false)
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: user?.full_name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'employee',
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (data: EditForm) => {
      const results = await Promise.all([
        // Profil güncelle
        updateUserProfile(user!.id, {
          fullName: data.fullName,
          email: data.email,
          role: data.role,
        }),
        // Şifre — sadece doldurulduysa
        data.newPassword
          ? setUserPassword({ userId: user!.id, password: data.newPassword })
          : Promise.resolve({ success: true }),
        // Modül izinleri — sadece employee ise
        data.role === 'employee'
          ? updateUserPermissions(user!.id, selectedModules)
          : Promise.resolve({ success: true }),
      ])
      const failed = results.find((r) => r && 'error' in r && r.error)
      if (failed && 'error' in failed) return { error: failed.error }
      return { success: true }
    },
    onSuccess: (result) => {
      if (result && 'error' in result && result.error) {
        toast.error(result.error as string)
        return
      }
      toast.success(tCommon('success'))
      queryClient.invalidateQueries({ queryKey: usersKeys.list() })
      queryClient.invalidateQueries({ queryKey: usersKeys.permissions(user!.id) })
      onClose()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(user!.id),
    onSuccess: (result) => {
      if (result.error) { toast.error(result.error); return }
      toast.success(t('deleteUserSuccess'))
      queryClient.invalidateQueries({ queryKey: usersKeys.list() })
      onClose()
    },
  })

  function toggleModule(module: string) {
    setSelectedModules((prev) =>
      prev.includes(module) ? prev.filter((m) => m !== module) : [...prev, module]
    )
  }

  if (!user) return null
  const isBusy = saveMutation.isPending || deleteMutation.isPending

  return (
    <>
      <Dialog open={!!user && !deleteConfirmOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </DialogHeader>

          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-5">

            {/* ── Temel bilgiler ── */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-fullName">{t('fullName')}</Label>
                <Input id="edit-fullName" disabled={isBusy} {...register('fullName')} />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="edit-email">E-posta</Label>
                <Input id="edit-email" type="email" disabled={isBusy} {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1">
                <Label>{t('role')}</Label>
                <Select
                  value={role}
                  disabled={isBusy}
                  onValueChange={(val) => {
                    const r = val as 'admin' | 'employee'
                    setRole(r)
                    setValue('role', r)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">{t('employee')}</SelectItem>
                    <SelectItem value="admin">{t('admin')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Modül izinleri (employee) ── */}
            {role === 'employee' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('permissions')}</Label>
                  {isLoadingPerms ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {MODULES.map((module) => (
                        <div key={module} className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-perm-${module}`}
                            checked={selectedModules.includes(module)}
                            onCheckedChange={() => toggleModule(module)}
                            disabled={isBusy}
                          />
                          <Label
                            htmlFor={`edit-perm-${module}`}
                            className="cursor-pointer font-normal text-sm"
                          >
                            {MODULE_LABELS[module as ModuleName]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Şifre (toggle ile açılır) ── */}
            <Separator />
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowPasswordSection((p) => !p)}
                className="flex items-center justify-between w-full text-sm font-medium text-left"
              >
                <span>{t('setPassword')}</span>
                {showPasswordSection
                  ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                }
              </button>

              {showPasswordSection && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="edit-newPassword">{t('setPasswordLabel')}</Label>
                    <div className="relative">
                      <Input
                        id="edit-newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={t('setPasswordPlaceholder')}
                        className="pr-10"
                        disabled={isBusy}
                        {...register('newPassword')}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="edit-confirmPassword">Şifre Tekrar</Label>
                    <div className="relative">
                      <Input
                        id="edit-confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder={t('setPasswordPlaceholder')}
                        className="pr-10"
                        disabled={isBusy}
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <Separator />
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isBusy}
                className="w-full sm:w-auto"
              >
                {t('deleteUser')}
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={onClose} disabled={isBusy} className="flex-1 sm:flex-none">
                  {tCommon('cancel')}
                </Button>
                <Button type="submit" disabled={isBusy} className="flex-1 sm:flex-none">
                  {saveMutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{tCommon('loading')}</>
                    : tCommon('save')
                  }
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Silme onay diyaloğu */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              {t('deleteUserConfirmTitle')}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t('deleteUserConfirmDesc', { name: user.full_name })}
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteMutation.isPending}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{tCommon('loading')}</>
                : t('confirmDelete')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
