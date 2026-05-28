'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

import { logActivity } from '@/lib/activity'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import {
  navItemSchema,
  navItemUpdateSchema,
  reorderSchema,
  type NavItemInput,
  type NavItemUpdate,
  type ReorderInput,
} from '@/lib/validations/nav-item'

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fields?: Record<string, string> }

function flatErrors(zerr: import('zod').ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of zerr.issues) {
    const key = issue.path.join('.') || '_'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

// ─── CREATE ─────────────────────────────────────────────────────────────────
export async function createNavItem(input: NavItemInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const parsed = navItemSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }

  const data = parsed.data
  // Compute next `order` within the same parent
  const last = await db.navItem.findFirst({
    where: { parentId: data.parentId ?? null },
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const nextOrder = (last?.order ?? -1) + 1

  try {
    const created = await db.navItem.create({
      data: {
        label:        data.label,
        slug:         data.slug,
        icon:         data.icon || null,
        href:         data.href || null,
        parentId:     data.parentId ?? null,
        isPublished:  data.isPublished,
        isCta:        data.isCta,
        translations: data.translations ?? undefined,
        order:        nextOrder,
      },
    })
    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'NavItem',
      entityId: created.id,
      metadata: { slug: created.slug, label: created.label },
    })
    revalidatePath('/admin/navigation')
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Un item avec ce slug existe déjà.', fields: { slug: 'Slug déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur lors de la création.' }
  }
}

// ─── UPDATE ─────────────────────────────────────────────────────────────────
export async function updateNavItem(input: NavItemUpdate): Promise<ActionResult> {
  const session = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const parsed = navItemUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }

  const { id, ...rest } = parsed.data
  try {
    await db.navItem.update({
      where: { id },
      data: {
        ...(rest.label        !== undefined ? { label: rest.label }            : {}),
        ...(rest.slug         !== undefined ? { slug: rest.slug }              : {}),
        ...(rest.icon         !== undefined ? { icon: rest.icon || null }      : {}),
        ...(rest.href         !== undefined ? { href: rest.href || null }      : {}),
        ...(rest.parentId     !== undefined ? { parentId: rest.parentId }      : {}),
        ...(rest.isPublished  !== undefined ? { isPublished: rest.isPublished }: {}),
        ...(rest.isCta        !== undefined ? { isCta: rest.isCta }            : {}),
        ...(rest.translations !== undefined ? { translations: rest.translations as Prisma.InputJsonValue } : {}),
      },
    })
    await logActivity({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'NavItem',
      entityId: id,
      metadata: rest,
    })
    revalidatePath('/admin/navigation')
    return { ok: true, data: undefined }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Un item avec ce slug existe déjà.', fields: { slug: 'Slug déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur lors de la mise à jour.' }
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────
export async function deleteNavItem(id: string): Promise<ActionResult> {
  const session = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  if (!id) return { ok: false, error: 'Id manquant.' }
  try {
    const item = await db.navItem.delete({ where: { id }, select: { slug: true, label: true } })
    await logActivity({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'NavItem',
      entityId: id,
      metadata: { slug: item.slug, label: item.label },
    })
    revalidatePath('/admin/navigation')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Suppression impossible.' }
  }
}

// ─── TOGGLE PUBLISH ─────────────────────────────────────────────────────────
export async function toggleNavItemPublish(id: string): Promise<ActionResult<{ isPublished: boolean }>> {
  const session = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const item = await db.navItem.findUnique({ where: { id }, select: { isPublished: true } })
  if (!item) return { ok: false, error: 'Item introuvable.' }

  const updated = await db.navItem.update({
    where: { id },
    data: { isPublished: !item.isPublished },
    select: { isPublished: true },
  })
  await logActivity({
    userId: session.user.id,
    action: updated.isPublished ? 'PUBLISH' : 'UNPUBLISH',
    entityType: 'NavItem',
    entityId: id,
  })
  revalidatePath('/admin/navigation')
  return { ok: true, data: { isPublished: updated.isPublished } }
}

// ─── REORDER (drag&drop) ────────────────────────────────────────────────────
export async function reorderNavItems(input: ReorderInput): Promise<ActionResult> {
  const session = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const parsed = reorderSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }

  const { parentId, orderedIds } = parsed.data
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.navItem.update({ where: { id }, data: { order: index, parentId: parentId ?? null } }),
    ),
  )
  await logActivity({
    userId: session.user.id,
    action: 'REORDER',
    entityType: 'NavItem',
    metadata: { parentId, count: orderedIds.length },
  })
  revalidatePath('/admin/navigation')
  return { ok: true, data: undefined }
}

// ─── HELPER: list for forms (parent selector) ───────────────────────────────
export async function listNavItemsFlat() {
  await requireAuth()
  return db.navItem.findMany({
    orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    select: { id: true, label: true, slug: true, parentId: true },
  })
}
