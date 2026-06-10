'use server'

import { Prisma, type QuoteStatus } from '@prisma/client'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { requireAuth, requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { escapeHtml, sendEmail, wrapEmail } from '@/lib/email'
import { formatQuoteReference } from '@/lib/utils'
import {
  publicQuoteSchema,
  replyQuoteSchema,
  updateQuoteSchema,
  type PublicQuoteInput,
  type ReplyQuoteInput,
  type UpdateQuoteInput,
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

// ─── PUBLIC SUBMIT (no auth) ────────────────────────────────────────────────
export async function submitPublicQuote(input: PublicQuoteInput): Promise<
  ActionResult<{ reference: string }>
> {
  const parsed = publicQuoteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  }
  const d = parsed.data
  const h = await headers()
  const ipAddress =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    null
  const userAgent = h.get('user-agent') ?? null

  // Build human reference: OM-2026-XXXX based on yearly count
  const year = new Date().getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const count = await db.quoteRequest.count({ where: { createdAt: { gte: startOfYear } } })
  const reference = formatQuoteReference(count + 1, year)

  const created = await db.quoteRequest.create({
    data: {
      reference,
      fullName:    d.fullName,
      company:     d.company || null,
      email:       d.email,
      phone:       d.phone   || null,
      requestType: d.requestType,
      sector:      d.sector,
      quantity:    d.quantity || null,
      deadline:    d.deadline || null,
      description: d.description,
      productId:   d.productId || null,
      items:       d.items && d.items.length ? (d.items as unknown as Prisma.InputJsonValue) : undefined,
      locale:      d.locale,
      ipAddress,
      userAgent,
    },
  })

  // Fire-and-forget notifications (don't break the user flow if emails fail)
  void notifyAdminOfNewQuote(created.id).catch(() => undefined)
  void confirmQuoteToCustomer(created.id).catch(() => undefined)

  return { ok: true, data: { reference } }
}

async function notifyAdminOfNewQuote(quoteId: string) {
  const q = await db.quoteRequest.findUnique({ where: { id: quoteId } })
  if (!q) return
  const to = process.env.EMAIL_QUOTE_RECIPIENT ?? 'contact@omegamesure.com'

  const itemsArr = Array.isArray(q.items)
    ? (q.items as Array<{ slug?: string; name?: string; qty?: number }>)
    : []
  const itemsHtml = itemsArr.length
    ? `<h3 style="margin:18px 0 6px;font-size:14px;color:#185FA5;">Produits sélectionnés (${itemsArr.length})</h3>
       <table cellpadding="6" style="font-size:13px;border-collapse:collapse;width:100%;">
         ${itemsArr
           .map(
             (it) =>
               `<tr><td style="border-bottom:1px solid #eef2f7;">${escapeHtml(String(it.name ?? it.slug ?? ''))}</td><td style="border-bottom:1px solid #eef2f7;text-align:right;color:#64748b;white-space:nowrap;">× ${escapeHtml(String(it.qty ?? 1))}</td></tr>`,
           )
           .join('')}
       </table>`
    : ''

  const html = wrapEmail(
    `
    <h2 style="margin:0 0 16px;color:#185FA5;font-size:18px;">Nouvelle demande de devis</h2>
    <p>Référence : <strong>${escapeHtml(q.reference)}</strong></p>
    <table cellpadding="6" style="font-size:13px;border-collapse:collapse;">
      <tr><td style="color:#64748b;">Contact</td><td>${escapeHtml(q.fullName)}${q.company ? ' — ' + escapeHtml(q.company) : ''}</td></tr>
      <tr><td style="color:#64748b;">Email</td><td><a href="mailto:${escapeHtml(q.email)}">${escapeHtml(q.email)}</a></td></tr>
      ${q.phone ? `<tr><td style="color:#64748b;">Téléphone</td><td>${escapeHtml(q.phone)}</td></tr>` : ''}
      <tr><td style="color:#64748b;">Type</td><td>${escapeHtml(q.requestType)}${q.sector ? ' / ' + escapeHtml(q.sector) : ''}</td></tr>
      ${q.quantity ? `<tr><td style="color:#64748b;">Quantité</td><td>${escapeHtml(q.quantity)}</td></tr>` : ''}
      ${q.deadline ? `<tr><td style="color:#64748b;">Délai</td><td>${escapeHtml(q.deadline)}</td></tr>` : ''}
    </table>
    ${itemsHtml}
    ${q.description ? `<div style="margin-top:16px;padding:12px;background:#f8fafc;border-left:3px solid #185FA5;white-space:pre-wrap;">${escapeHtml(q.description)}</div>` : ''}
    `,
    { title: `Nouveau devis ${q.reference}` },
  )
  await sendEmail({
    to,
    subject: `[Devis ${q.reference}] ${q.fullName}${q.company ? ' — ' + q.company : ''}`,
    html,
    replyTo: q.email,
  })
}

async function confirmQuoteToCustomer(quoteId: string) {
  const q = await db.quoteRequest.findUnique({ where: { id: quoteId } })
  if (!q) return
  const html = wrapEmail(
    `
    <h2 style="margin:0 0 16px;color:#185FA5;font-size:18px;">Demande bien reçue</h2>
    <p>Bonjour ${escapeHtml(q.fullName.split(' ')[0])},</p>
    <p>Nous avons bien reçu votre demande de devis (référence <strong>${escapeHtml(q.reference)}</strong>).
       Notre équipe vous répondra sous 24 à 48 h ouvrées.</p>
    <div style="margin-top:16px;padding:12px;background:#f8fafc;border-left:3px solid #185FA5;font-size:12px;color:#64748b;">
      Récapitulatif&nbsp;: ${escapeHtml(q.requestType)}${q.quantity ? ' · ' + escapeHtml(q.quantity) : ''}${q.deadline ? ' · délai ' + escapeHtml(q.deadline) : ''}
    </div>
    <p style="margin-top:20px;">Bien cordialement,<br /><strong>L'équipe Omega Mesure</strong></p>
    `,
    { title: `Demande ${q.reference} reçue` },
  )
  await sendEmail({
    to: q.email,
    subject: `Votre demande ${q.reference} — Omega Mesure`,
    html,
  })
}

// ─── ADMIN: UPDATE (status / assignment / notes) ────────────────────────────
export async function updateQuote(input: UpdateQuoteInput): Promise<ActionResult> {
  const session = await requireRole([...ADMIN_ROLES])
  const parsed = updateQuoteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const { id, ...rest } = parsed.data

  const existing = await db.quoteRequest.findUnique({ where: { id }, select: { status: true } })
  if (!existing) return { ok: false, error: 'Devis introuvable' }

  let closedAt: Date | null | undefined
  if (rest.status === 'WON' || rest.status === 'LOST') {
    if (existing.status !== rest.status) closedAt = new Date()
  } else if (rest.status && existing.status !== 'NEW') {
    // Re-opening: clear closedAt
    closedAt = null
  }

  await db.quoteRequest.update({
    where: { id },
    data: {
      ...(rest.status        !== undefined ? { status: rest.status as QuoteStatus } : {}),
      ...(rest.internalNotes !== undefined ? { internalNotes: rest.internalNotes || null } : {}),
      ...(rest.assignedToId  !== undefined ? { assignedToId: rest.assignedToId } : {}),
      ...(closedAt           !== undefined ? { closedAt } : {}),
    },
  })
  await logActivity({
    userId: session.user.id,
    action: 'UPDATE',
    entityType: 'QuoteRequest',
    entityId: id,
    metadata: { changes: rest },
  })
  revalidatePath('/admin/quotes')
  revalidatePath(`/admin/quotes/${id}`)
  return { ok: true, data: undefined }
}

// ─── ADMIN: REPLY ──────────────────────────────────────────────────────────
export async function replyToQuote(input: ReplyQuoteInput): Promise<
  ActionResult<{ delivered: boolean; skipped: boolean }>
> {
  const session = await requireRole([...ADMIN_ROLES])
  const parsed = replyQuoteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed', fields: flatErrors(parsed.error) }
  const { id, subject, message, markSent } = parsed.data

  const quote = await db.quoteRequest.findUnique({ where: { id } })
  if (!quote) return { ok: false, error: 'Devis introuvable' }

  const html = wrapEmail(
    `
    <h2 style="margin:0 0 16px;color:#185FA5;font-size:18px;">Réponse à votre demande ${escapeHtml(quote.reference)}</h2>
    <p>Bonjour ${escapeHtml(quote.fullName.split(' ')[0])},</p>
    <div style="white-space:pre-wrap;margin-top:12px;">${escapeHtml(message)}</div>
    <p style="margin-top:20px;">Bien cordialement,<br />
      <strong>${escapeHtml(session.user.name ?? 'Omega Mesure')}</strong>
    </p>
    `,
    { title: subject },
  )

  const result = await sendEmail({
    to: quote.email,
    subject,
    html,
    text: message,
    replyTo: process.env.EMAIL_QUOTE_RECIPIENT ?? undefined,
  })

  await db.quoteRequest.update({
    where: { id },
    data: {
      emailSentAt:    new Date(),
      emailReplyText: message,
      ...(markSent ? { status: 'QUOTE_SENT' as QuoteStatus } : {}),
    },
  })
  await logActivity({
    userId: session.user.id,
    action: result.ok ? 'EMAIL_SENT' : 'EMAIL_FAILED',
    entityType: 'QuoteRequest',
    entityId: id,
    metadata: { subject, markSent, delivery: result },
  })

  revalidatePath(`/admin/quotes/${id}`)
  revalidatePath('/admin/quotes')

  return {
    ok: true,
    data: { delivered: result.ok, skipped: !result.ok && 'skipped' in result && !!result.skipped },
  }
}

// ─── ADMIN: DELETE ─────────────────────────────────────────────────────────
export async function deleteQuote(id: string): Promise<ActionResult> {
  const session = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  try {
    await db.quoteRequest.delete({ where: { id } })
    await logActivity({ userId: session.user.id, action: 'DELETE', entityType: 'QuoteRequest', entityId: id })
    revalidatePath('/admin/quotes')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Suppression impossible' }
  }
}

// ─── ADMIN: LIST ───────────────────────────────────────────────────────────
export type QuoteFilters = {
  search?: string
  status?: 'all' | QuoteStatus
  page?: number
  perPage?: number
}

export async function listQuotes(filters: QuoteFilters = {}) {
  await requireAuth()
  const page    = Math.max(1, filters.page ?? 1)
  const perPage = Math.min(100, filters.perPage ?? 30)

  const where = {
    ...(filters.status && filters.status !== 'all' ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { fullName:  { contains: filters.search, mode: 'insensitive' as const } },
            { company:   { contains: filters.search, mode: 'insensitive' as const } },
            { email:     { contains: filters.search, mode: 'insensitive' as const } },
            { reference: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [rows, total, counts] = await Promise.all([
    db.quoteRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true, reference: true, fullName: true, company: true, email: true,
        requestType: true, status: true, createdAt: true,
        assignedTo: { select: { id: true, name: true } },
      },
    }),
    db.quoteRequest.count({ where }),
    db.quoteRequest.groupBy({ by: ['status'], _count: { _all: true } }),
  ])
  return {
    rows,
    total,
    page,
    perPage,
    countsByStatus: Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Record<QuoteStatus, number>,
  }
}
