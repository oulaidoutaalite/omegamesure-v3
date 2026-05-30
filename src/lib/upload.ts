import { randomBytes } from 'node:crypto'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
] as const

export const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
] as const

export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES] as const
export type AllowedMime = (typeof ALLOWED_TYPES)[number]

/** Default max size (MB) read from env. Falls back to 8 MB. */
export const MAX_UPLOAD_BYTES =
  (Number.parseInt(process.env.MAX_UPLOAD_SIZE_MB ?? '8', 10) || 8) * 1024 * 1024

/** Root of upload storage on disk. Configurable via env. */
export function uploadRoot(): string {
  const rel = process.env.UPLOAD_DIR ?? 'public/uploads'
  return path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel)
}

/** Public URL prefix that maps to the upload root via /public. */
export const PUBLIC_URL_PREFIX = '/uploads'

/** Sanitize a folder name to a safe slug-like path segment. */
export function sanitizeFolder(input?: string | null): string {
  if (!input) return ''
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '')
  return cleaned.split('/').filter(Boolean).slice(0, 4).join('/')
}

/** Detect a Media type label from MIME. */
export function mediaTypeFromMime(mime: string): 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'OTHER' {
  if (mime.startsWith('image/')) return 'IMAGE'
  if (mime.startsWith('video/')) return 'VIDEO'
  if (
    mime === 'application/pdf' ||
    mime.startsWith('application/msword') ||
    mime.startsWith('application/vnd.openxmlformats') ||
    mime.startsWith('application/vnd.ms-') ||
    mime.startsWith('text/')
  ) return 'DOCUMENT'
  return 'OTHER'
}

/** Extension preserved from original filename (lowercased, alnum only). */
function safeExt(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, '')
  return ext.length > 1 && ext.length <= 8 ? ext : ''
}

export type StoredFile = {
  filename: string
  originalName: string
  url: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  folder: string | null
}

/**
 * Write a single file to disk and return its public-facing metadata.
 * Throws Error('VALIDATION') with .message for size / mime violations.
 */
export async function storeFile(
  file: File,
  options: { folder?: string | null } = {},
): Promise<StoredFile> {
  if (file.size <= 0) {
    throw Object.assign(new Error('Fichier vide'), { code: 'VALIDATION' })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw Object.assign(
      new Error(`Fichier trop volumineux (max ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} MB)`),
      { code: 'VALIDATION' },
    )
  }
  const mime = file.type || 'application/octet-stream'
  if (!ALLOWED_TYPES.includes(mime as AllowedMime)) {
    throw Object.assign(new Error(`Type de fichier non autorisé : ${mime}`), { code: 'VALIDATION' })
  }

  const folder = sanitizeFolder(options.folder)
  const dir = folder ? path.join(uploadRoot(), folder) : uploadRoot()
  await mkdir(dir, { recursive: true })

  const filename = `${randomBytes(10).toString('hex')}${safeExt(file.name)}`
  const fullPath = path.join(dir, filename)

  const bytes = Buffer.from(await file.arrayBuffer())
  await writeFile(fullPath, bytes)

  let width: number | null = null
  let height: number | null = null
  if (mediaTypeFromMime(mime) === 'IMAGE' && mime !== 'image/svg+xml') {
    try {
      const meta = await sharp(bytes).metadata()
      width  = meta.width  ?? null
      height = meta.height ?? null
    } catch {
      // image meta is best-effort
    }
  }

  const url = `${PUBLIC_URL_PREFIX}${folder ? '/' + folder : ''}/${filename}`

  return {
    filename,
    originalName: file.name,
    url,
    mimeType: mime,
    size: file.size,
    width,
    height,
    folder: folder || null,
  }
}

/** Remove a stored file from disk, best-effort. */
export async function removeStoredFile(url: string): Promise<void> {
  try {
    if (!url.startsWith(PUBLIC_URL_PREFIX + '/')) return
    const rel = url.substring(PUBLIC_URL_PREFIX.length + 1)
    const full = path.join(uploadRoot(), rel)
    await unlink(full)
  } catch {
    // ignore missing file
  }
}
