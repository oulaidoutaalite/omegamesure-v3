'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import {
  mediaTypeFromMime,
  removeStoredFile,
  sanitizeFolder,
  storeFile,
} from '@/lib/upload'
import {
  mediaUpdateSchema,
  type MediaUpdateInput,
} from '@/lib/validations/media'

import { type ActionResult } from './nav-items'

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] as const

export type UploadedMedia = {
  id: string
  url: string
  type: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  folder: string | null
  alt: string | null
}

/**
 * Upload one or more files via FormData. Returns per-file results, never
 * throws — failed files come back with `.error` set so the UI can show them.
 */
export async function uploadMedia(
  formData: FormData,
): Promise<ActionResult<{ uploaded: UploadedMedia[]; errors: Array<{ name: string; error: string }> }>> {
  const session = await requireRole([...ADMIN_ROLES])

  const folderRaw = formData.get('folder')
  const folder = typeof folderRaw === 'string' ? sanitizeFolder(folderRaw) : ''

  const files = formData.getAll('files').filter((v): v is File => v instanceof File)
  if (files.length === 0) return { ok: false, error: 'Aucun fichier reçu.' }

  const uploaded: UploadedMedia[] = []
  const errors: Array<{ name: string; error: string }> = []

  for (const file of files) {
    try {
      const stored = await storeFile(file, { folder })
      const record = await db.media.create({
        data: {
          filename:     stored.filename,
          originalName: stored.originalName,
          url:          stored.url,
          type:         mediaTypeFromMime(stored.mimeType),
          mimeType:     stored.mimeType,
          size:         stored.size,
          width:        stored.width,
          height:       stored.height,
          folder:       stored.folder,
          uploadedById: session.user.id,
        },
      })
      uploaded.push({
        id: record.id,
        url: record.url,
        type: record.type,
        filename: record.filename,
        originalName: record.originalName,
        mimeType: record.mimeType,
        size: record.size,
        width: record.width,
        height: record.height,
        folder: record.folder,
        alt: record.alt,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      errors.push({ name: file.name, error: msg })
    }
  }

  if (uploaded.length > 0) {
    await logActivity({
      userId: session.user.id,
      action: 'CREATE',
      entityType: 'Media',
      metadata: { count: uploaded.length, folder },
    })
    revalidatePath('/admin/media')
  }
  return { ok: true, data: { uploaded, errors } }
}

/** Patch metadata (alt, folder, tags). Does not move files on disk. */
export async function updateMedia(input: MediaUpdateInput): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  const parsed = mediaUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }
  const { id, alt, folder, tags } = parsed.data

  try {
    await db.media.update({
      where: { id },
      data: {
        ...(alt    !== undefined ? { alt: alt || null }                     : {}),
        ...(folder !== undefined ? { folder: sanitizeFolder(folder) || null }: {}),
        ...(tags   !== undefined ? { tags }                                 : {}),
      },
    })
    await logActivity({ userId: session.user.id, action: 'UPDATE', entityType: 'Media', entityId: id })
    revalidatePath('/admin/media')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erreur serveur' }
  }
}

/** Delete a media row and best-effort remove the file from disk. */
export async function deleteMedia(id: string): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  try {
    const removed = await db.media.delete({ where: { id }, select: { url: true } })
    await removeStoredFile(removed.url)
    await logActivity({ userId: session.user.id, action: 'DELETE', entityType: 'Media', entityId: id })
    revalidatePath('/admin/media')
    return { ok: true, data: undefined }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return { ok: false, error: 'Média introuvable' }
    }
    return { ok: false, error: 'Suppression impossible' }
  }
}

/** Server-side fetch used by pages + MediaPicker. */
export async function listMedia(params: {
  type?: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'OTHER'
  folder?: string
  search?: string
  page?: number
  perPage?: number
} = {}) {
  await requireAuth()
  const page = Math.max(1, params.page ?? 1)
  const perPage = Math.min(60, params.perPage ?? 24)
  const where: Prisma.MediaWhereInput = {
    ...(params.type ? { type: params.type } : {}),
    ...(params.folder ? { folder: params.folder } : {}),
    ...(params.search
      ? {
          OR: [
            { originalName: { contains: params.search, mode: 'insensitive' } },
            { alt:          { contains: params.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }
  const [rows, total, folders] = await Promise.all([
    db.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, url: true, type: true, originalName: true, mimeType: true,
        size: true, width: true, height: true, folder: true, alt: true, createdAt: true,
      },
    }),
    db.media.count({ where }),
    db.media.groupBy({ by: ['folder'], _count: { folder: true }, orderBy: { folder: 'asc' } }),
  ])
  return {
    rows,
    total,
    page,
    perPage,
    folders: folders
      .filter((f) => f.folder !== null)
      .map((f) => ({ folder: f.folder as string, count: f._count.folder })),
  }
}
