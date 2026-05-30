'use server'

import { Prisma, type Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import {
  changePasswordSchema,
  userCreateSchema,
  userUpdateSchema,
  type ChangePasswordInput,
  type UserCreateInput,
  type UserUpdateInput,
} from '@/lib/validations/user'

import { type ActionResult } from './nav-items'

function flatErrors(zerr: import('zod').ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of zerr.issues) {
    const key = issue.path.join('.') || '_'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

// ─── CREATE ─────────────────────────────────────────────────────────────────
export async function createUser(input: UserCreateInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole('SUPER_ADMIN')
  const parsed = userCreateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const d = parsed.data

  try {
    const hash = await bcrypt.hash(d.password, 12)
    const created = await db.user.create({
      data: {
        email:    d.email.toLowerCase(),
        password: hash,
        name:     d.name || null,
        role:     d.role as Role,
        isActive: d.isActive,
      },
      select: { id: true, email: true, role: true },
    })
    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'User',
      entityId: created.id,
      metadata: { email: created.email, role: created.role },
    })
    revalidatePath('/admin/users')
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Email déjà utilisé', fields: { email: 'Email déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur' }
  }
}

// ─── UPDATE ─────────────────────────────────────────────────────────────────
export async function updateUser(input: UserUpdateInput): Promise<ActionResult> {
  const session = await requireRole('SUPER_ADMIN')
  const parsed = userUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const { id, ...rest } = parsed.data

  // Safety: never let an admin downgrade their own role and lock themselves out
  if (session.user.id === id && rest.role && rest.role !== session.user.role) {
    return { ok: false, error: 'Vous ne pouvez pas changer votre propre rôle.' }
  }
  if (session.user.id === id && rest.isActive === false) {
    return { ok: false, error: 'Vous ne pouvez pas vous désactiver vous-même.' }
  }

  try {
    await db.user.update({
      where: { id },
      data: {
        ...(rest.email    !== undefined ? { email: rest.email.toLowerCase() }    : {}),
        ...(rest.name     !== undefined ? { name: rest.name || null }            : {}),
        ...(rest.role     !== undefined ? { role: rest.role as Role }            : {}),
        ...(rest.isActive !== undefined ? { isActive: rest.isActive }            : {}),
      },
    })
    await logActivity({ userId: session.user.id, action: 'UPDATE', entityType: 'User', entityId: id, metadata: rest })
    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${id}/edit`)
    return { ok: true, data: undefined }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Email déjà utilisé', fields: { email: 'Email déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur' }
  }
}

// ─── CHANGE PASSWORD ────────────────────────────────────────────────────────
export async function changeUserPassword(input: ChangePasswordInput): Promise<ActionResult> {
  const session = await requireRole('SUPER_ADMIN')
  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const { id, newPassword } = parsed.data

  const hash = await bcrypt.hash(newPassword, 12)
  await db.user.update({ where: { id }, data: { password: hash } })
  await logActivity({ userId: session.user.id, action: 'PASSWORD_RESET', entityType: 'User', entityId: id })
  return { ok: true, data: undefined }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────
export async function deleteUser(id: string): Promise<ActionResult> {
  const session = await requireRole('SUPER_ADMIN')
  if (session.user.id === id) {
    return { ok: false, error: 'Vous ne pouvez pas supprimer votre propre compte.' }
  }
  // Refuse to delete the last super admin
  const target = await db.user.findUnique({ where: { id }, select: { role: true } })
  if (target?.role === 'SUPER_ADMIN') {
    const count = await db.user.count({ where: { role: 'SUPER_ADMIN', isActive: true } })
    if (count <= 1) {
      return { ok: false, error: 'Impossible : un super-admin actif au minimum est requis.' }
    }
  }
  try {
    await db.user.delete({ where: { id } })
    await logActivity({ userId: session.user.id, action: 'DELETE', entityType: 'User', entityId: id })
    revalidatePath('/admin/users')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Suppression impossible' }
  }
}
