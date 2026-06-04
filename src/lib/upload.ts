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

// ─── Supabase Storage config ────────────────────────────────────────────────
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'media'

/** True when Supabase Storage is configured (production on Vercel). */
function useSupabaseStorage(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
}

/** Root of local upload storage (dev fallback only). */
export function uploadRoot(): string {
  const rel = process.env.UPLOAD_DIR ?? 'public/uploads'
  return path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel)
}

/** Local public URL prefix (dev fallback only). */
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

function validate(file: File): string {
  if (file.size <= 0) throw withCode('Fichier vide')
  if (file.size > MAX_UPLOAD_BYTES)
    throw withCode(`Fichier trop volumineux (max ${(MAX_UPLOAD_BYTES / 1024 / 1024).toFixed(0)} MB)`)
  const mime = file.type || 'application/octet-stream'
  if (!ALLOWED_TYPES.includes(mime as AllowedMime))
    throw withCode(`Type de fichier non autorisé : ${mime}`)
  return mime
}

function withCode(message: string) {
  return Object.assign(new Error(message), { code: 'VALIDATION' })
}

async function imageDimensions(bytes: Buffer, mime: string) {
  let width: number | null = null
  let height: number | null = null
  if (mediaTypeFromMime(mime) === 'IMAGE' && mime !== 'image/svg+xml') {
    try {
      const meta = await sharp(bytes).metadata()
      width = meta.width ?? null
      height = meta.height ?? null
    } catch {
      /* best-effort */
    }
  }
  return { width, height }
}

/**
 * Store a single file. Uses Supabase Storage when configured (production),
 * otherwise falls back to the local disk (development). Throws Error with
 * `.code === 'VALIDATION'` for size / mime violations.
 */
export async function storeFile(
  file: File,
  options: { folder?: string | null } = {},
): Promise<StoredFile> {
  const mime = validate(file)
  const folder = sanitizeFolder(options.folder)
  const filename = `${randomBytes(10).toString('hex')}${safeExt(file.name)}`
  const objectPath = folder ? `${folder}/${filename}` : filename
  const bytes = Buffer.from(await file.arrayBuffer())
  const { width, height } = await imageDimensions(bytes, mime)

  let url: string

  if (useSupabaseStorage()) {
    const endpoint = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        // `apikey` supports the new sb_secret_* keys; Authorization keeps
        // compatibility with the legacy service_role JWT.
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': mime,
        'x-upsert': 'true',
        'cache-control': '31536000',
      },
      body: bytes,
    })
    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      throw new Error(`Échec du téléversement (Supabase ${res.status}) ${detail.slice(0, 120)}`)
    }
    url = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`
  } else {
    // Local disk fallback (dev only)
    const dir = folder ? path.join(uploadRoot(), folder) : uploadRoot()
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, filename), bytes)
    url = `${PUBLIC_URL_PREFIX}${folder ? '/' + folder : ''}/${filename}`
  }

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

/** Remove a stored file, best-effort (Supabase Storage or local disk). */
export async function removeStoredFile(url: string): Promise<void> {
  try {
    // Supabase public URL → delete via storage API
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
    if (useSupabaseStorage() && url.includes(marker)) {
      const objectPath = url.split(marker)[1]
      if (!objectPath) return
      await fetch(`${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`, {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      })
      return
    }
    // Local disk fallback
    if (url.startsWith(PUBLIC_URL_PREFIX + '/')) {
      const rel = url.substring(PUBLIC_URL_PREFIX.length + 1)
      await unlink(path.join(uploadRoot(), rel))
    }
  } catch {
    // ignore missing file
  }
}
