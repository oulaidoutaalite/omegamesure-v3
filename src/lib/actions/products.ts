'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import {
  productSchema,
  productUpdateSchema,
  type ProductInput,
  type ProductUpdate,
} from '@/lib/validations/product'

import { type ActionResult } from './nav-items'

const EDITOR_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] as const

function flatErrors(zerr: import('zod').ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of zerr.issues) {
    const key = issue.path.join('.') || '_'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

function normalizeImages(input: ProductInput['images']) {
  if (!input || input.length === 0) return []
  const hasPrimary = input.some((i) => i.isPrimary)
  return input.map((img, idx) => ({
    url: img.url,
    alt: img.alt ?? '',
    isPrimary: hasPrimary ? !!img.isPrimary : idx === 0,
    order: idx,
  }))
}

// ─── CREATE ─────────────────────────────────────────────────────────────────
export async function createProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const session = await requireRole([...EDITOR_ROLES])
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const d = parsed.data
  const images = normalizeImages(d.images)

  try {
    const created = await db.product.create({
      data: {
        name:             d.name,
        slug:             d.slug,
        kind:             d.kind,
        shortDescription: d.shortDescription || null,
        description:      d.description      || null,
        brand:            d.brand            || null,
        model:            d.model            || null,
        price:            d.price ?? null,
        currency:         d.currency,
        categoryId:       d.categoryId    || null,
        subCategoryId:    d.subCategoryId || null,
        images:           images as Prisma.InputJsonValue,
        datasheetUrl:     d.datasheetUrl || null,
        isPublished:      d.isPublished,
        isFeatured:       d.isFeatured,
        publishedAt:      d.isPublished ? new Date() : null,
        metaTitle:        d.metaTitle       || null,
        metaDescription:  d.metaDescription || null,
        translations:     (d.translations ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    await logActivity({ userId: session.user.id, action: 'CREATE', entityType: 'Product', entityId: created.id, metadata: { slug: created.slug } })
    revalidatePath('/admin/products')
    return { ok: true, data: { id: created.id } }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Slug déjà utilisé', fields: { slug: 'Slug déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur' }
  }
}

// ─── UPDATE ─────────────────────────────────────────────────────────────────
export async function updateProduct(input: ProductUpdate): Promise<ActionResult> {
  const session = await requireRole([...EDITOR_ROLES])
  const parsed = productUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const { id, ...rest } = parsed.data

  const existing = await db.product.findUnique({
    where: { id },
    select: { isPublished: true, publishedAt: true },
  })
  if (!existing) return { ok: false, error: 'Produit introuvable' }

  // Manage publishedAt transitions
  let publishedAt: Date | null | undefined = undefined
  if (rest.isPublished !== undefined) {
    if (rest.isPublished && !existing.isPublished) publishedAt = new Date()
    else if (!rest.isPublished && existing.isPublished) publishedAt = null
  }

  try {
    await db.product.update({
      where: { id },
      data: {
        ...(rest.name             !== undefined ? { name:             rest.name }                    : {}),
        ...(rest.slug             !== undefined ? { slug:             rest.slug }                    : {}),
        ...(rest.kind             !== undefined ? { kind:             rest.kind }                    : {}),
        ...(rest.shortDescription !== undefined ? { shortDescription: rest.shortDescription || null }: {}),
        ...(rest.description      !== undefined ? { description:      rest.description      || null }: {}),
        ...(rest.brand            !== undefined ? { brand:            rest.brand            || null }: {}),
        ...(rest.model            !== undefined ? { model:            rest.model            || null }: {}),
        ...(rest.price            !== undefined ? { price:            rest.price ?? null }           : {}),
        ...(rest.currency         !== undefined ? { currency:         rest.currency }                : {}),
        ...(rest.categoryId       !== undefined ? { categoryId:       rest.categoryId    || null }   : {}),
        ...(rest.subCategoryId    !== undefined ? { subCategoryId:    rest.subCategoryId || null }   : {}),
        ...(rest.images           !== undefined ? { images:           normalizeImages(rest.images) as Prisma.InputJsonValue } : {}),
        ...(rest.datasheetUrl     !== undefined ? { datasheetUrl:     rest.datasheetUrl || null }    : {}),
        ...(rest.isPublished      !== undefined ? { isPublished:      rest.isPublished }             : {}),
        ...(rest.isFeatured       !== undefined ? { isFeatured:       rest.isFeatured }              : {}),
        ...(publishedAt           !== undefined ? { publishedAt }                                    : {}),
        ...(rest.metaTitle        !== undefined ? { metaTitle:        rest.metaTitle || null }       : {}),
        ...(rest.metaDescription  !== undefined ? { metaDescription:  rest.metaDescription || null } : {}),
        ...(rest.translations     !== undefined ? { translations:     (rest.translations ?? Prisma.JsonNull) as Prisma.InputJsonValue | typeof Prisma.JsonNull } : {}),
      },
    })
    await logActivity({ userId: session.user.id, action: 'UPDATE', entityType: 'Product', entityId: id })
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}/edit`)
    return { ok: true, data: undefined }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return { ok: false, error: 'Slug déjà utilisé', fields: { slug: 'Slug déjà utilisé' } }
    }
    return { ok: false, error: 'Erreur serveur' }
  }
}

// ─── DELETE ─────────────────────────────────────────────────────────────────
export async function deleteProduct(id: string): Promise<ActionResult> {
  const session = await requireRole([...EDITOR_ROLES])
  try {
    await db.product.delete({ where: { id } })
    await logActivity({ userId: session.user.id, action: 'DELETE', entityType: 'Product', entityId: id })
    revalidatePath('/admin/products')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Suppression impossible' }
  }
}

// ─── TOGGLE FLAGS ───────────────────────────────────────────────────────────
export async function toggleProductPublish(id: string): Promise<ActionResult<{ isPublished: boolean }>> {
  const session = await requireRole([...EDITOR_ROLES])
  const item = await db.product.findUnique({ where: { id }, select: { isPublished: true } })
  if (!item) return { ok: false, error: 'Produit introuvable' }
  const updated = await db.product.update({
    where: { id },
    data: {
      isPublished: !item.isPublished,
      publishedAt: !item.isPublished ? new Date() : null,
    },
    select: { isPublished: true },
  })
  await logActivity({ userId: session.user.id, action: updated.isPublished ? 'PUBLISH' : 'UNPUBLISH', entityType: 'Product', entityId: id })
  revalidatePath('/admin/products')
  return { ok: true, data: { isPublished: updated.isPublished } }
}

export async function toggleProductFeatured(id: string): Promise<ActionResult<{ isFeatured: boolean }>> {
  const session = await requireRole([...EDITOR_ROLES])
  const item = await db.product.findUnique({ where: { id }, select: { isFeatured: true } })
  if (!item) return { ok: false, error: 'Produit introuvable' }
  const updated = await db.product.update({
    where: { id }, data: { isFeatured: !item.isFeatured }, select: { isFeatured: true },
  })
  await logActivity({ userId: session.user.id, action: 'UPDATE', entityType: 'Product', entityId: id, metadata: { isFeatured: updated.isFeatured } })
  revalidatePath('/admin/products')
  return { ok: true, data: { isFeatured: updated.isFeatured } }
}

// ─── LIST (server-side filters) ─────────────────────────────────────────────
export type ProductFilters = {
  search?: string
  categoryId?: string
  subCategoryId?: string
  status?: 'published' | 'draft' | 'all'
  kind?: 'PRODUCT' | 'SERVICE' | 'all'
  page?: number
  perPage?: number
}

export async function listProducts(filters: ProductFilters = {}) {
  await requireAuth()
  const page    = Math.max(1, filters.page ?? 1)
  const perPage = Math.min(100, filters.perPage ?? 20)

  const where: Prisma.ProductWhereInput = {
    ...(filters.status === 'published' ? { isPublished: true }  : {}),
    ...(filters.status === 'draft'     ? { isPublished: false } : {}),
    ...(filters.kind && filters.kind !== 'all' ? { kind: filters.kind } : {}),
    ...(filters.categoryId    ? { categoryId:    filters.categoryId }    : {}),
    ...(filters.subCategoryId ? { subCategoryId: filters.subCategoryId } : {}),
    ...(filters.search
      ? {
          OR: [
            { name:  { contains: filters.search, mode: 'insensitive' } },
            { brand: { contains: filters.search, mode: 'insensitive' } },
            { model: { contains: filters.search, mode: 'insensitive' } },
            { slug:  { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const [rows, total] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, name: true, slug: true, kind: true, brand: true, model: true,
        price: true, currency: true, images: true, isPublished: true,
        isFeatured: true, updatedAt: true,
        category:    { select: { name: true, color: true } },
        subCategory: { select: { name: true } },
      },
    }),
    db.product.count({ where }),
  ])
  return { rows, total, page, perPage }
}
