import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  QuoteDetailView,
  type QuoteDetail,
} from '@/components/admin/quotes/QuoteDetail'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export const metadata = { title: 'Détail du devis' }
export const dynamic = 'force-dynamic'

export default async function QuotePage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const [quote, users] = await Promise.all([
    db.quoteRequest.findUnique({ where: { id } }),
    db.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true },
    }),
  ])
  if (!quote) notFound()

  // Mark as IN_PROGRESS automatically when an admin opens a NEW quote? Optional.
  // We leave that to the user via the workflow select to avoid surprises.

  const detail: QuoteDetail = {
    id: quote.id,
    reference: quote.reference,
    fullName: quote.fullName,
    company: quote.company,
    email: quote.email,
    phone: quote.phone,
    requestType: quote.requestType,
    sector: quote.sector,
    quantity: quote.quantity,
    deadline: quote.deadline,
    description: quote.description,
    productId: quote.productId,
    status: quote.status,
    internalNotes: quote.internalNotes,
    assignedToId: quote.assignedToId,
    emailSentAt:    quote.emailSentAt   ? quote.emailSentAt.toISOString()   : null,
    emailReplyText: quote.emailReplyText,
    closedAt:       quote.closedAt      ? quote.closedAt.toISOString()      : null,
    createdAt:      quote.createdAt.toISOString(),
    updatedAt:      quote.updatedAt.toISOString(),
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/admin/quotes" className="text-xs text-muted-foreground hover:underline">
        ← Retour aux devis
      </Link>
      <QuoteDetailView quote={detail} users={users} />
    </div>
  )
}
