import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  ContactDetailView,
  type ContactDetail,
} from '@/components/admin/contact/ContactDetail'
import { updateContact } from '@/lib/actions/contact'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export const metadata = { title: 'Détail du message' }
export const dynamic = 'force-dynamic'

export default async function MessagePage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const contact = await db.contactMessage.findUnique({ where: { id } })
  if (!contact) notFound()

  // Mark as READ when admin opens a NEW message
  if (contact.status === 'NEW') {
    void updateContact({ id, status: 'READ' }).catch(() => undefined)
  }

  const detail: ContactDetail = {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    subject: contact.subject,
    message: contact.message,
    status: contact.status,
    replyText: contact.replyText,
    repliedAt: contact.repliedAt ? contact.repliedAt.toISOString() : null,
    archivedAt: contact.archivedAt ? contact.archivedAt.toISOString() : null,
    createdAt: contact.createdAt.toISOString(),
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/admin/messages" className="text-xs text-muted-foreground hover:underline">
        ← Retour aux messages
      </Link>
      <ContactDetailView contact={detail} />
    </div>
  )
}
