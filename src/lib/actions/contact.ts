'use server'

import { type ContactStatus } from '@prisma/client'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { escapeHtml, sendEmail, wrapEmail } from '@/lib/email'
import {
  publicContactSchema,
  replyContactSchema,
  updateContactSchema,
  type PublicContactInput,
  type ReplyContactInput,
  type UpdateContactInput,
} from '@/lib/validations/quote'

import { type ActionResult } from './nav-items'

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] as const

function flatErrors(zerr: import('zod').ZodError) {
  const fields: Record<string, string> = {}
  for (const issue of zerr.issues) {
    const key = issue.path.join('.') || '_'
    if (!fields[key]) fields[key] = issue.message
  }
  return fields
}

// ─── PUBLIC SUBMIT ──────────────────────────────────────────────────────────
export async function submitPublicContact(
  input: PublicContactInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = publicContactSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const d = parsed.data

  const h = await headers()
  const ipAddress =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    null
  const userAgent = h.get('user-agent') ?? null

  const row = await db.contactMessage.create({
    data: {
      name:    d.name,
      email:   d.email,
      phone:   d.phone || null,
      subject: d.subject || null,
      message: d.message,
      ipAddress,
      userAgent,
    },
  })

  void notifyAdminOfNewContact(row.id).catch(() => undefined)

  return { ok: true, data: { id: row.id } }
}

async function notifyAdminOfNewContact(id: string) {
  const c = await db.contactMessage.findUnique({ where: { id } })
  if (!c) return
  const to = process.env.EMAIL_QUOTE_RECIPIENT ?? 'contact@omegamesure.com'
  const html = wrapEmail(
    `
    <h2 style="margin:0 0 16px;color:#185FA5;font-size:18px;">Nouveau message de contact</h2>
    <p><strong>${escapeHtml(c.name)}</strong> — <a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>
    ${c.phone ? ` — ${escapeHtml(c.phone)}` : ''}</p>
    ${c.subject ? `<p style="color:#64748b;">Sujet : <strong style="color:#0f172a">${escapeHtml(c.subject)}</strong></p>` : ''}
    <div style="margin-top:16px;padding:12px;background:#f8fafc;border-left:3px solid #185FA5;white-space:pre-wrap;">${escapeHtml(c.message)}</div>
    <p style="margin-top:20px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/messages/${c.id}"
         style="background:#185FA5;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block;">
        Ouvrir dans l'admin →
      </a>
    </p>
    `,
    { title: `Contact — ${c.name}` },
  )
  await sendEmail({
    to,
    subject: `[Contact] ${c.subject ?? c.name}`,
    html,
    replyTo: c.email,
  })
}

// ─── ADMIN ──────────────────────────────────────────────────────────────────
export async function updateContact(input: UpdateContactInput): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  const parsed = updateContactSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }
  const { id, status } = parsed.data

  let archivedAt: Date | null | undefined
  if (status === 'ARCHIVED') archivedAt = new Date()
  if (status && status !== 'ARCHIVED') archivedAt = null

  await db.contactMessage.update({
    where: { id },
    data: {
      ...(status !== undefined ? { status: status as ContactStatus } : {}),
      ...(archivedAt !== undefined ? { archivedAt } : {}),
    },
  })
  await logActivity({ userId: session.user.id, action: 'UPDATE', entityType: 'ContactMessage', entityId: id, metadata: { status } })
  revalidatePath('/admin/messages')
  revalidatePath(`/admin/messages/${id}`)
  return { ok: true, data: undefined }
}

export async function replyToContact(input: ReplyContactInput): Promise<
  ActionResult<{ delivered: boolean; skipped: boolean }>
> {
  const session = await requireRole([...ADMIN_ROLES])
  const parsed = replyContactSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }
  const { id, subject, message } = parsed.data

  const msg = await db.contactMessage.findUnique({ where: { id } })
  if (!msg) return { ok: false, error: 'Message introuvable' }

  const html = wrapEmail(
    `
    <h2 style="margin:0 0 16px;color:#185FA5;font-size:18px;">Réponse à votre message</h2>
    <p>Bonjour ${escapeHtml(msg.name.split(' ')[0])},</p>
    <div style="white-space:pre-wrap;margin-top:12px;">${escapeHtml(message)}</div>
    <p style="margin-top:20px;">Bien cordialement,<br />
      <strong>${escapeHtml(session.user.name ?? 'Omega Mesure')}</strong>
    </p>
    `,
    { title: subject },
  )
  const result = await sendEmail({ to: msg.email, subject, html, text: message })

  await db.contactMessage.update({
    where: { id },
    data: {
      status: 'REPLIED',
      repliedAt: new Date(),
      replyText: message,
    },
  })
  await logActivity({
    userId: session.user.id,
    action: result.ok ? 'EMAIL_SENT' : 'EMAIL_FAILED',
    entityType: 'ContactMessage',
    entityId: id,
    metadata: { subject, delivery: result },
  })
  revalidatePath(`/admin/messages/${id}`)
  revalidatePath('/admin/messages')
  return {
    ok: true,
    data: { delivered: result.ok, skipped: !result.ok && 'skipped' in result && !!result.skipped },
  }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  const session = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  try {
    await db.contactMessage.delete({ where: { id } })
    await logActivity({ userId: session.user.id, action: 'DELETE', entityType: 'ContactMessage', entityId: id })
    revalidatePath('/admin/messages')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Suppression impossible' }
  }
}

// ─── LIST ──────────────────────────────────────────────────────────────────
export type ContactFilters = {
  search?: string
  status?: 'all' | ContactStatus
  page?: number
  perPage?: number
}

export async function listContacts(filters: ContactFilters = {}) {
  await requireAuth()
  const page    = Math.max(1, filters.page ?? 1)
  const perPage = Math.min(100, filters.perPage ?? 30)

  const where = {
    ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { name:    { contains: filters.search, mode: 'insensitive' as const } },
            { email:   { contains: filters.search, mode: 'insensitive' as const } },
            { subject: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [rows, total, counts] = await Promise.all([
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, name: true, email: true, phone: true, subject: true,
        status: true, createdAt: true,
      },
    }),
    db.contactMessage.count({ where }),
    db.contactMessage.groupBy({ by: ['status'], _count: { _all: true } }),
  ])
  return {
    rows, total, page, perPage,
    countsByStatus: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Record<ContactStatus, number>,
  }
}
