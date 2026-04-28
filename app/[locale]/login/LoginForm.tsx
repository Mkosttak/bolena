'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/client'
import {
  defaultPathAfterLogin,
  isSafeLocaleAdminRedirect,
} from '@/lib/utils/post-login-redirect'
import type { ModuleName } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface LoginFormProps {
  locale: string
  redirectTo?: string
}

export function LoginForm({ locale, redirectTo }: LoginFormProps) {
  const t = useTranslations('login')
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const loginSchema = z.object({
    email: z.string().email(t('emailInvalid')),
    password: z.string().min(6, t('passwordMin')),
  })

  type LoginInput = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(t('invalidCredentials'))
        setIsLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error(t('genericError'))
        setIsLoading(false)
        return
      }

      let destination: string
      if (isSafeLocaleAdminRedirect(redirectTo, locale)) {
        destination = redirectTo
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role === 'employee' ? 'employee' : 'admin'
        let allowed: ModuleName[] = []
        if (role === 'employee') {
          const { data: perms } = await supabase
            .from('module_permissions')
            .select('module_name')
            .eq('user_id', user.id)
            .eq('can_access', true)
          allowed = (perms ?? []).map((p) => p.module_name as ModuleName)
        }
        destination = defaultPathAfterLogin(locale, role, allowed)
      }

      setIsLoading(false)
      setIsRedirecting(true)
      router.push(destination as Route)
      router.refresh()
    } catch {
      toast.error(t('genericError'))
      setIsLoading(false)
    }
  }

  return (
    <>
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('redirecting')}</p>
        </div>
      )}
      <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t('brand')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('emailPlaceholder')}
              autoComplete="email"
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? t('loginButtonLoading') : t('loginButton')}
          </Button>
        </form>
      </CardContent>
    </Card>
    </>
  )

}
