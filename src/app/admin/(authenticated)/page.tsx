import {
  IconFileInvoice,
  IconMail,
  IconPackage,
  IconUsers,
} from '@tabler/icons-react'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth-helpers'

export const metadata = { title: 'Tableau de bord' }
export const dynamic = 'force-dynamic'

async function fetchStats() {
  const [products, quotesNew, messagesNew, users] = await Promise.all([
    db.product.count({ where: { isPublished: true } }),
    db.quoteRequest.count({ where: { status: 'NEW' } }),
    db.contactMessage.count({ where: { status: 'NEW' } }),
    db.user.count({ where: { isActive: true } }),
  ])
  return { products, quotesNew, messagesNew, users }
}

async function fetchRecentQuotes() {
  return db.quoteRequest.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, reference: true, fullName: true, company: true, email: true,
      requestType: true, status: true, createdAt: true,
    },
  })
}

const statusLabels: Record<string, { label: string; className: string }> = {
  NEW:         { label: 'Nouveau',     className: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'En cours',    className: 'bg-amber-100 text-amber-700' },
  QUOTE_SENT:  { label: 'Devis envoyé', className: 'bg-purple-100 text-purple-700' },
  WON:         { label: 'Gagné',       className: 'bg-emerald-100 text-emerald-700' },
  LOST:        { label: 'Perdu',       className: 'bg-rose-100 text-rose-700' },
}

export default async function DashboardPage() {
  const session = await requireAuth()
  const [stats, recentQuotes] = await Promise.all([fetchStats(), fetchRecentQuotes()])

  const cards = [
    { label: 'Produits publiés',  value: stats.products,    icon: IconPackage,      tone: 'bg-brand/10 text-brand' },
    { label: 'Devis à traiter',   value: stats.quotesNew,   icon: IconFileInvoice,  tone: 'bg-amber-100 text-amber-700' },
    { label: 'Messages reçus',    value: stats.messagesNew, icon: IconMail,         tone: 'bg-teal-100 text-teal-700' },
    { label: 'Utilisateurs admin',value: stats.users,       icon: IconUsers,        tone: 'bg-purple-100 text-purple-700' },
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenue, {session.user.name}. Voici l&apos;activité récente.
        </p>
      </header>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </span>
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${c.tone}`}>
                  <Icon size={18} />
                </span>
              </div>
              <div className="mt-3 text-3xl font-bold">{c.value}</div>
            </div>
          )
        })}
      </section>

      {/* Recent quotes */}
      <section className="rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Devis récents</h2>
          <span className="text-xs text-muted-foreground">5 derniers</span>
        </header>
        {recentQuotes.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            Aucun devis pour le moment.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recentQuotes.map((q) => {
              const s = statusLabels[q.status] ?? { label: q.status, className: 'bg-muted text-foreground' }
              return (
                <li key={q.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {q.company ?? q.fullName} ·{' '}
                      <span className="text-muted-foreground">{q.email}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {q.reference} · {q.requestType}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
                    {s.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
        🚧 Les modules CRUD (Produits, Catégories, Médias, Devis, Configuration…)
        seront implémentés dans les prochaines étapes. Le squelette d&apos;auth + sidebar est prêt.
      </section>
    </div>
  )
}
