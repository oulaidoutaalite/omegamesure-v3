import { type QuoteStatus, type ContactStatus } from '@prisma/client'

import { cn } from '@/lib/utils'

const QUOTE_LABELS: Record<QuoteStatus, { label: string; cls: string }> = {
  NEW:         { label: 'Nouveau',     cls: 'bg-blue-100 text-blue-800 ring-blue-200' },
  IN_PROGRESS: { label: 'En cours',    cls: 'bg-amber-100 text-amber-800 ring-amber-200' },
  QUOTE_SENT:  { label: 'Devis envoyé', cls: 'bg-purple-100 text-purple-800 ring-purple-200' },
  WON:         { label: 'Gagné',       cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  LOST:        { label: 'Perdu',       cls: 'bg-rose-100 text-rose-800 ring-rose-200' },
}

const CONTACT_LABELS: Record<ContactStatus, { label: string; cls: string }> = {
  NEW:      { label: 'Nouveau',  cls: 'bg-blue-100 text-blue-800 ring-blue-200' },
  READ:     { label: 'Lu',       cls: 'bg-amber-100 text-amber-800 ring-amber-200' },
  REPLIED:  { label: 'Répondu',  cls: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  ARCHIVED: { label: 'Archivé',  cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
}

export function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  const def = QUOTE_LABELS[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', def.cls, className)}>
      {def.label}
    </span>
  )
}

export function ContactStatusBadge({ status, className }: { status: ContactStatus; className?: string }) {
  const def = CONTACT_LABELS[status]
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', def.cls, className)}>
      {def.label}
    </span>
  )
}

export const QUOTE_STATUS_OPTIONS: Array<{ value: QuoteStatus; label: string }> = [
  { value: 'NEW',         label: 'Nouveau' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'QUOTE_SENT',  label: 'Devis envoyé' },
  { value: 'WON',         label: 'Gagné' },
  { value: 'LOST',        label: 'Perdu' },
]

export const CONTACT_STATUS_OPTIONS: Array<{ value: ContactStatus; label: string }> = [
  { value: 'NEW',      label: 'Nouveau' },
  { value: 'READ',     label: 'Lu' },
  { value: 'REPLIED',  label: 'Répondu' },
  { value: 'ARCHIVED', label: 'Archivé' },
]
