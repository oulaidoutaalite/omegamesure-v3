import { IconDownload } from '@tabler/icons-react'
import Link from 'next/link'

import {
  QuotesTable,
  type QuoteRow,
} from '@/components/admin/quotes/QuotesTable'
import { Button } from '@/components/ui/button'
import { listQuotes } from '@/lib/actions/quotes'
import { requireAuth } from '@/lib/auth-helpers'

export const metadata = { title: 'Devis' }
export const dynamic = 'force-dynamic'

export default async function QuotesPage() {
  await requireAuth()

  const { rows, total, countsByStatus } = await listQuotes({ perPage: 200 })
  const items: QuoteRow[] = rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    fullName: r.fullName,
    company: r.company,
    email: r.email,
    requestType: r.requestType,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    assignedToName: r.assignedTo?.name ?? null,
  }))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Devis reçus</h1>
          <p className="text-sm text-muted-foreground">
            Workflow : Nouveau → En cours → Devis envoyé → Gagné / Perdu
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/api/quotes/export.csv">
            <IconDownload size={16} /> Export CSV
          </Link>
        </Button>
      </header>

      <QuotesTable items={items} total={total} countsByStatus={countsByStatus} />
    </div>
  )
}
