'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import {
  categorySchema,
  categoryUpdateSchema,
  subCategorySchema,
  subCategoryUpdateSchema,
  type CategoryInput,
  type CategoryUpdate,
  type SubCategoryInput,
  type SubCategoryUpdate,
} from '@/lib/validations/category'

import { type ActionResult } from './nav-items'

function flatErrors(zerr: import('zod').ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of zerr.issues) {
    const key = issue.path.join('.') || '_'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const

// ─── CATEGORY ───────────────────────────────────────────────────────────────

export async function createCategory(input: CategoryInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...ADMIN_ROLES])
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const data = parsed.data

  const last = await db.category.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
  const nextOrder = (last?.order ?? -1) + 1

  try {
    const created = await db.category.create({
      data: {
        name:            data.name,
        slug:            data.slug,
        description:     data.description || null,
        icon:            data.icon || null,
        color:           data.color || null,
        heroImageUrl:    data.heroImageUrl || null,
        navItemId:       data.navItemId ?? null,
        isPublished:     data.isPublished,
        metaTitle:       data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        translations:    (data.translations ?? undefined) as Prisma.InputJsonValue | undefined,
        order:           nextOrder,
      },
    })
    await logActivity({ userId: session.user.id, action: 'CREATE', entityType: 'Category', entityId: created.id, metadata: { slug: created.slug } })
    revalidatePath('/admin/categories')
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Slug déjà utilisé', fields: { slug: 'Slug déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur' }
  }
}

export async function updateCategory(input: CategoryUpdate): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  const parsed = categoryUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }

  const { id, ...rest } = parsed.data
  try {
    await db.category.update({
      where: { id },
      data: {
        ...(rest.name            !== undefined ? { name:            rest.name }                    : {}),
        ...(rest.slug            !== undefined ? { slug:            rest.slug }                    : {}),
        ...(rest.description     !== undefined ? { description:     rest.description || null }    : {}),
        ...(rest.icon            !== undefined ? { icon:            rest.icon || null }           : {}),
        ...(rest.color           !== undefined ? { color:           rest.color || null }          : {}),
        ...(rest.heroImageUrl    !== undefined ? { heroImageUrl:    rest.heroImageUrl || null }   : {}),
        ...(rest.navItemId       !== undefined ? { navItemId:       rest.navItemId }              : {}),
        ...(rest.isPublished     !== undefined ? { isPublished:     rest.isPublished }            : {}),
        ...(rest.metaTitle       !== undefined ? { metaTitle:       rest.metaTitle || null }      : {}),
        ...(rest.metaDescription !== undefined ? { metaDescription: rest.metaDescription || null }: {}),
        ...(rest.translations    !== undefined ? { translations:    (rest.translations ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull } : {}),
      },
    })
    await logActivity({ userId: session.user.id, action: 'UPDATE', entityType: 'Category', entityId: id })
    revalidatePath('/admin/categories')
    revalidatePath(`/admin/categories/${id}/edit`)
    return { ok: true, data: undefined }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Slug déjà utilisé', fields: { slug: 'Slug déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur' }
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  try {
    await db.category.delete({ where: { id } })
    await logActivity({ userId: session.user.id, action: 'DELETE', entityType: 'Category', entityId: id })
    revalidatePath('/admin/categories')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Suppression impossible (catégorie liée à des produits ?)' }
  }
}

export async function reorderCategories(orderedIds: string[]): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  if (!orderedIds.length) return { ok: false, error: 'Aucun id' }
  await db.$transaction(
    orderedIds.map((id, i) => db.category.update({ where: { id }, data: { order: i } })),
  )
  await logActivity({ userId: session.user.id, action: 'REORDER', entityType: 'Category', metadata: { count: orderedIds.length } })
  revalidatePath('/admin/categories')
  return { ok: true, data: undefined }
}

// ─── SUB-CATEGORY ───────────────────────────────────────────────────────────

export async function createSubCategory(input: SubCategoryInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...ADMIN_ROLES])
  const parsed = subCategorySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const data = parsed.data

  const last = await db.subCategory.findFirst({
    where: { categoryId: data.categoryId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const nextOrder = (last?.order ?? -1) + 1

  try {
    const created = await db.subCategory.create({
      data: {
        categoryId:   data.categoryId,
        name:         data.name,
        slug:         data.slug,
        description:  data.description || null,
        icon:         data.icon || null,
        imageUrl:     data.imageUrl || null,
        isPublished:  data.isPublished,
        isAutresSlot: data.isAutresSlot,
        translations: (data.translations ?? undefined) as Prisma.InputJsonValue | undefined,
        order:        nextOrder,
      },
    })
    await logActivity({ userId: session.user.id, action: 'CREATE', entityType: 'SubCategory', entityId: created.id, metadata: { slug: created.slug } })
    revalidatePath(`/admin/categories/${data.categoryId}/edit`)
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Slug déjà utilisé dans cette catégorie', fields: { slug: 'Slug déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur' }
  }
}

export async function updateSubCategory(input: SubCategoryUpdate): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  const parsed = subCategoryUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }

  const { id, ...rest } = parsed.data
  try {
    const updated = await db.subCategory.update({
      where: { id },
      data: {
        ...(rest.name         !== undefined ? { name: rest.name }                       : {}),
        ...(rest.slug         !== undefined ? { slug: rest.slug }                       : {}),
        ...(rest.description  !== undefined ? { description: rest.description || null } : {}),
        ...(rest.icon         !== undefined ? { icon: rest.icon || null }               : {}),
        ...(rest.imageUrl     !== undefined ? { imageUrl: rest.imageUrl || null }       : {}),
        ...(rest.isPublished  !== undefined ? { isPublished: rest.isPublished }         : {}),
        ...(rest.isAutresSlot !== undefined ? { isAutresSlot: rest.isAutresSlot }       : {}),
        ...(rest.translations !== undefined ? { translations: (rest.translations ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull } : {}),
      },
      select: { categoryId: true },
    })
    await logActivity({ userId: session.user.id, action: 'UPDATE', entityType: 'SubCategory', entityId: id })
    revalidatePath(`/admin/categories/${updated.categoryId}/edit`)
    return { ok: true, data: undefined }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Slug déjà utilisé', fields: { slug: 'Slug déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur' }
  }
}

export async function deleteSubCategory(id: string): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  try {
    const removed = await db.subCategory.delete({ where: { id }, select: { categoryId: true } })
    await logActivity({ userId: session.user.id, action: 'DELETE', entityType: 'SubCategory', entityId: id })
    revalidatePath(`/admin/categories/${removed.categoryId}/edit`)
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Suppression impossible (produits liés ?)' }
  }
}

export async function reorderSubCategories(categoryId: string, orderedIds: string[]): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  if (!orderedIds.length) return { ok: false, error: 'Aucun id' }
  await db.$transaction(
    orderedIds.map((id, i) => db.subCategory.update({ where: { id }, data: { order: i } })),
  )
  await logActivity({ userId: session.user.id, action: 'REORDER', entityType: 'SubCategory', metadata: { categoryId, count: orderedIds.length } })
  revalidatePath(`/admin/categories/${categoryId}/edit`)
  return { ok: true, data: undefined }
}

// Move a sub-category (and ALL its products) to another existing category.
export async function moveSubCategory(input: { id: string; targetCategoryId: string }): Promise<ActionResult<{ moved: number }>> {
  const session = await requireRole([...ADMIN_ROLES])
  const { id, targetCategoryId } = input
  if (!id || !targetCategoryId) return { ok: false, error: 'Paramètres manquants' }

  const sub = await db.subCategory.findUnique({ where: { id }, select: { categoryId: true, slug: true } })
  if (!sub) return { ok: false, error: 'Sous-catégorie introuvable' }
  if (sub.categoryId === targetCategoryId) return { ok: true, data: { moved: 0 } }

  const target = await db.category.findUnique({ where: { id: targetCategoryId }, select: { id: true } })
  if (!target) return { ok: false, error: 'Catégorie cible introuvable' }

  const clash = await db.subCategory.findFirst({
    where: { categoryId: targetCategoryId, slug: sub.slug },
    select: { id: true },
  })
  if (clash) return { ok: false, error: `Une sous-catégorie « ${sub.slug} » existe déjà dans la catégorie cible` }

  const last = await db.subCategory.findFirst({
    where: { categoryId: targetCategoryId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })
  const nextOrder = (last?.order ?? -1) + 1
  const fromCategoryId = sub.categoryId

  const [moved] = await db.$transaction([
    db.product.updateMany({ where: { subCategoryId: id }, data: { categoryId: targetCategoryId } }),
    db.subCategory.update({ where: { id }, data: { categoryId: targetCategoryId, order: nextOrder } }),
  ])

  await logActivity({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'SubCategory',
    entityId: id,
    metadata: { movedFrom: fromCategoryId, movedTo: targetCategoryId, products: moved.count },
  })
  revalidatePath(`/admin/categories/${fromCategoryId}/edit`)
  revalidatePath(`/admin/categories/${targetCategoryId}/edit`)
  revalidatePath('/admin/categories')
  return { ok: true, data: { moved: moved.count } }
}
