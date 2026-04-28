import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi girin'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalı'),
  role: z.enum(['admin', 'employee']),
  modules: z.array(z.string()).optional(),
})

export const setPasswordSchema = z.object({
  userId: z.string().uuid(),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
})

export type SetPasswordInput = z.infer<typeof setPasswordSchema>

export const updatePermissionsSchema = z.object({
  userId: z.string().uuid(),
  modules: z.array(z.string()),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>
