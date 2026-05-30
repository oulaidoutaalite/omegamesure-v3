import {
  ContactsTable,
  type ContactRow,
} from '@/components/admin/contact/ContactsTable'
import { listContacts } from '@/lib/actions/contact'
import { requireAuth } from '@/lib/auth-helpers'

export const metadata = { title: 'Messages contact' }
export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  await requireAuth()

  const { rows, total, countsByStatus } = await listContacts({ perPage: 200 })
  const items: ContactRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    subject: r.subject,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Messages contact</h1>
        <p className="text-sm text-muted-foreground">
          Messages reçus via le formulaire de contact public.
        </p>
      </header>

      <ContactsTable items={items} total={total} countsByStatus={countsByStatus} />
    </div>
  )
}
