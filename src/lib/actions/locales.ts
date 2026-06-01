'use server'

import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

import { type ActionResult } from './nav-items'

export async function toggleLocaleActive(code: string): Promise<ActionResult<{ isActive: boolean }>> {
  const session = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const row = await db.locale.findUnique({ where: { code }, select: { isActive: true, isDefault: true } })
  if (!row) return { ok: false, error: 'Langue introuvable' }
  if (row.isDefault && row.isActive) {
    return { ok: false, error: 'Impossible de désactiver la langue par défaut.' }
  }
  const updated = await db.locale.update({
    where: { code },
    data: { isActive: !row.isActive },
    select: { isActive: true },
  })
  await logActivity({
    userId: session.user.id,
    action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
    entityType: 'Locale',
    entityId: code,
  })
  revalidatePath('/admin/languages')
  revalidatePath('/admin')
  return { ok: true, data: { isActive: updated.isActive } }
}

export async function setDefaultLocale(code: string): Promise<ActionResult> {
  const session = await requireRole('SUPER_ADMIN')
  const target = await db.locale.findUnique({ where: { code }, select: { isActive: true } })
  if (!target) return { ok: false, error: 'Langue introuvable' }
  if (!target.isActive) return { ok: false, error: 'La langue doit être active.' }

  await db.$transaction([
    db.locale.updateMany({ where: { isDefault: true }, data: { isDefault: false } }),
    db.locale.update({ where: { code }, data: { isDefault: true } }),
  ])
  await logActivity({
    userId: session.user.id,
    action: 'SET_DEFAULT',
    entityType: 'Locale',
    entityId: code,
  })
  revalidatePath('/admin/languages')
  return { ok: true, data: undefined }
}
