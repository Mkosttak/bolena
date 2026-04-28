'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { usersKeys, fetchUsers } from '@/lib/queries/users.queries'
import { AddUserModal } from './AddUserModal'
import { EditUserModal } from './EditUserModal'
import type { Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

interface UsersClientProps {
  embeddedInHub?: boolean
}

export function UsersClient({ embeddedInHub = false }: UsersClientProps) {
  const t = useTranslations('users')
  const tCommon = useTranslations('common')

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<Profile | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: usersKeys.list(),
    queryFn: fetchUsers,
  })

  return (
    <div className={cn('mx-auto max-w-5xl space-y-4', embeddedInHub ? 'p-0' : 'p-4 md:p-6')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <Button onClick={() => setAddModalOpen(true)} className="w-full sm:w-auto">
          {t('addUser')}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('fullName')}</TableHead>
              <TableHead>E-posta</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{tCommon('status')}</TableHead>
              <TableHead>{t('lastActive')}</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !users?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {tCommon('noData')}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className={!user.is_active ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {t(user.role as 'admin' | 'employee')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'outline' : 'destructive'}>
                      {user.is_active ? tCommon('active') : tCommon('passive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : t('neverLoggedIn')}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditUser(user)}
                      aria-label={t('editUser')}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddUserModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <EditUserModal user={editUser} onClose={() => setEditUser(null)} />
    </div>
  )
}
