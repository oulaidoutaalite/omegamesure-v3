'use client'

import { type QuoteStatus } from '@prisma/client'
import { IconListCheck, IconSearch } from '@tabler/icons-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import {
  QUOTE_STATUS_OPTIONS,
  QuoteStatusBadge,
} from '@/components/admin/quotes/StatusBadge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type QuoteRow = {
  id: string
  reference: string
  fullName: string
  company: string | null
  email: string
  requestType: string
  status: QuoteStatus
  createdAt: string
  assignedToName: string | null
  emailStatus: 'sent' | 'failed' | 'unknown'
  itemCount: number
}

type Props = {
  items: QuoteRow[]
  total: number
  countsByStatus: Partial<Record<QuoteStatus | 'all', number>>
}

const TABS: Array<{ value: 'all' | QuoteStatus; label: string }> = [
  { value: 'all',         label: 'Tous' },
  ...QUOTE_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]

export function QuotesTable({ items, total, countsByStatus }: Props) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | QuoteStatus>('all')

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (tab !== 'all' && r.status !== tab) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = `${r.reference} ${r.fullName} ${r.company ?? ''} ${r.email}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, tab, search])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <IconSearch size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Référence, nom, email…" value={search}
                 onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="hidden items-center gap-1 sm:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" /> notifié
          </span>
          <span className="hidden items-center gap-1 sm:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" /> email non envoyé
          </span>
          <span>{filtered.length} / {total}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => {
          const count =
            t.value === 'all'
              ? total
              : countsByStatus[t.value] ?? 0
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition',
                tab === t.value
                  ? 'bg-brand text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              {t.label}
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px]',
                tab === t.value ? 'bg-white/20' : 'bg-background',
              )}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Réf.</th>
              <th className="px-4 py-3 text-left font-medium">Demandeur</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-left font-medium">Assigné</th>
              <th className="px-4 py-3 text-left font-medium">Reçu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-accent/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/quotes/${r.id}`} className="flex items-center gap-2">
                    <span
                      title={
                        r.emailStatus === 'failed'
                          ? 'Notification email NON envoyée'
                          : r.emailStatus === 'sent'
                            ? 'Notifié par email'
                            : 'Statut email inconnu'
                      }
                      className={cn(
                        'inline-block h-2 w-2 shrink-0 rounded-full',
                        r.emailStatus === 'failed'
                          ? 'bg-amber-500'
                          : r.emailStatus === 'sent'
                            ? 'bg-emerald-500'
                            : 'bg-muted-foreground/30',
                      )}
                    />
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{r.reference}</code>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/quotes/${r.id}`} className="block">
                    <div className="font-medium">{r.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.company && <>{r.company} · </>}
                      <span className="text-foreground">{r.email}</span>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/quotes/${r.id}`} className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span>{r.requestType}</span>
                    {r.itemCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-medium text-brand">
                        <IconListCheck size={11} /> Liste · {r.itemCount}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/quotes/${r.id}`}><QuoteStatusBadge status={r.status} /></Link>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <Link href={`/admin/quotes/${r.id}`}>{r.assignedToName ?? '—'}</Link>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <Link href={`/admin/quotes/${r.id}`}>
                    {new Date(r.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                Aucune demande ne correspond.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
