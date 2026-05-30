'use client'

import { type ContactStatus } from '@prisma/client'
import { IconSearch } from '@tabler/icons-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import {
  CONTACT_STATUS_OPTIONS,
  ContactStatusBadge,
} from '@/components/admin/quotes/StatusBadge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type ContactRow = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  status: ContactStatus
  createdAt: string
}

type Props = {
  items: ContactRow[]
  total: number
  countsByStatus: Partial<Record<ContactStatus | 'all', number>>
}

const TABS: Array<{ value: 'all' | ContactStatus; label: string }> = [
  { value: 'all', label: 'Tous' },
  ...CONTACT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
]

export function ContactsTable({ items, total, countsByStatus }: Props) {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'all' | ContactStatus>('all')

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (tab !== 'all' && r.status !== tab) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = `${r.name} ${r.email} ${r.subject ?? ''}`.toLowerCase()
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
          <Input placeholder="Nom, email, sujet…" value={search}
                 onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} / {total}</span>
      </div>

      <div className="flex flex-wrap gap-1">
        {TABS.map((t) => {
          const count = t.value === 'all' ? total : countsByStatus[t.value] ?? 0
          return (
            <button key={t.value} type="button" onClick={() => setTab(t.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition',
                tab === t.value
                  ? 'bg-brand text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
              )}>
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
              <th className="px-4 py-3 text-left font-medium">Expéditeur</th>
              <th className="px-4 py-3 text-left font-medium">Sujet</th>
              <th className="px-4 py-3 text-left font-medium">Statut</th>
              <th className="px-4 py-3 text-left font-medium">Reçu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <tr key={r.id} className="cursor-pointer hover:bg-accent/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/messages/${r.id}`} className="block">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.email}{r.phone && <> · {r.phone}</>}
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs">
                  <Link href={`/admin/messages/${r.id}`}>
                    {r.subject || <span className="italic text-muted-foreground">(sans sujet)</span>}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/messages/${r.id}`}><ContactStatusBadge status={r.status} /></Link>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  <Link href={`/admin/messages/${r.id}`}>
                    {new Date(r.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                Aucun message ne correspond.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
