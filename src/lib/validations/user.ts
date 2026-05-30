import { z } from 'zod'

export const roleEnum = z.enum(['SUPER_ADMIN', 'ADMIN', 'EDITOR'])

export const userCreateSchema = z.object({
  email:    z.string().trim().email('Email invalide').max(200),
  name:     z.string().trim().max(120).optional().or(z.literal('')),
  password: z.string().min(8, '8 caractères minimum').max(120),
  role:     roleEnum.default('EDITOR'),
  isActive: z.boolean().default(true),
})
export type UserCreateInput = z.infer<typeof userCreateSchema>

export const userUpdateSchema = z.object({
  id:       z.string().min(1),
  email:    z.string().trim().email().max(200).optional(),
  name:     z.string().trim().max(120).optional().or(z.literal('')),
  role:     roleEnum.optional(),
  isActive: z.boolean().optional(),
})
export type UserUpdateInput = z.infer<typeof userUpdateSchema>

export const changePasswordSchema = z.object({
  id:          z.string().min(1),
  newPassword: z.string().min(8, '8 caractères minimum').max(120),
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
