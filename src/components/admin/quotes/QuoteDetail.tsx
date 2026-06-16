'use client'

import { type QuoteStatus } from '@prisma/client'
import {
  IconAlertTriangle,
  IconCircleCheck,
  IconListCheck,
  IconMail,
  IconMailForward,
  IconSend,
  IconTrash,
  IconUserCircle,
} from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  QUOTE_STATUS_OPTIONS,
  QuoteStatusBadge,
} from '@/components/admin/quotes/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { deleteQuote, replyToQuote, sendTestEmail, updateQuote } from '@/lib/actions/quotes'

export type QuoteDetail = {
  id: string
  reference: string
  fullName: string
  company: string | null
  email: string
  phone: string | null
  requestType: string
  sector: string | null
  quantity: string | null
  deadline: string | null
  description: string
  productId: string | null
  status: QuoteStatus
  internalNotes: string | null
  assignedToId: string | null
  emailSentAt: string | null
  emailReplyText: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  items: Array<{ slug?: string; name?: string; qty?: number }> | null
  notifiedAt: string | null
  notifyError: string | null
}

type Props = {
  quote: QuoteDetail
  users: Array<{ id: string; name: string | null; email: string }>
}

export function QuoteDetailView({ quote, users }: Props) {
  const router = useRouter()

  const [status, setStatus] = useState<QuoteStatus>(quote.status)
  const [assignedToId, setAssignedToId] = useState<string>(quote.assignedToId ?? '')
  const [notes, setNotes] = useState<string>(quote.internalNotes ?? '')
  const [savingMeta, startSaveMeta] = useTransition()

  const [replySubject, setReplySubject] = useState<string>(`Re: votre demande ${quote.reference}`)
  const [replyBody, setReplyBody] = useState<string>('')
  const [markSent, setMarkSent] = useState(true)
  const [sending, startSend] = useTransition()
  const [deleting, startDelete] = useTransition()

  function onSaveMeta() {
    startSaveMeta(async () => {
      const res = await updateQuote({
        id: quote.id,
        status,
        internalNotes: notes,
        assignedToId: assignedToId || null,
      })
      if (!res.ok) toast.error(res.error)
      else toast.success('Devis mis à jour')
    })
  }

  function onSend() {
    if (replyBody.trim().length < 5) { toast.error('Message trop court'); return }
    startSend(async () => {
      const res = await replyToQuote({
        id: quote.id,
        subject: replySubject,
        message: replyBody,
        markSent,
      })
      if (!res.ok) { toast.error(res.error); return }
      if (res.data.delivered) toast.success('Email envoyé')
      else if (res.data.skipped) toast.warning('Email enregistré mais NON envoyé (RESEND_API_KEY manquant)')
      else toast.error('Email non délivré (vérifier configuration)')
      setReplyBody('')
      router.refresh()
    })
  }

  function onDelete() {
    if (!confirm('Supprimer définitivement ce devis ?')) return
    startDelete(async () => {
      const res = await deleteQuote(quote.id)
      if (!res.ok) toast.error(res.error)
      else { toast.success('Devis supprimé'); router.push('/admin/quotes') }
    })
  }

  const [testing, startTest] = useTransition()
  function onTestEmail() {
    startTest(async () => {
      const res = await sendTestEmail()
      if (!res.ok) { toast.error(res.error); return }
      if (res.data.delivered) toast.success(res.data.detail)
      else toast.warning(res.data.detail)
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main column */}
      <div className="space-y-6 lg:col-span-2">
        {/* Email notification status */}
        {quote.notifyError ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <IconAlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">La notification email de cette demande n&apos;a pas été envoyée.</p>
              <p className="mt-0.5 text-amber-800/80">{quote.notifyError}</p>
            </div>
          </div>
        ) : quote.notifiedAt ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800">
            <IconCircleCheck size={14} /> Notifié par email le {new Date(quote.notifiedAt).toLocaleString('fr-FR')}
          </div>
        ) : null}

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <code className="rounded bg-muted px-2 py-0.5 text-xs">{quote.reference}</code>
              <h1 className="mt-2 text-xl font-bold tracking-tight">{quote.fullName}</h1>
              <p className="text-sm text-muted-foreground">
                {quote.company && <>{quote.company} · </>}
                <a href={`mailto:${quote.email}`} className="text-brand hover:underline">{quote.email}</a>
                {quote.phone && <> · {quote.phone}</>}
              </p>
            </div>
            <QuoteStatusBadge status={quote.status} />
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <dt className="text-xs uppercase text-muted-foreground">Type</dt>
            <dd>{quote.requestType}{quote.sector ? ` · ${quote.sector}` : ''}</dd>
            {quote.quantity && <><dt className="text-xs uppercase text-muted-foreground">Quantité</dt><dd>{quote.quantity}</dd></>}
            {quote.deadline && <><dt className="text-xs uppercase text-muted-foreground">Délai</dt><dd>{quote.deadline}</dd></>}
            <dt className="text-xs uppercase text-muted-foreground">Reçu</dt>
            <dd>{new Date(quote.createdAt).toLocaleString('fr-FR')}</dd>
          </dl>

          <div>
            <h2 className="mb-2 text-sm font-medium">Description</h2>
            <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm">
              {quote.description}
            </p>
          </div>
        </section>

        {quote.items && quote.items.length > 0 && (
          <section className="space-y-3 rounded-xl border border-brand/30 bg-brand/5 p-6">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <IconListCheck size={15} className="text-brand" /> Liste de matériel demandée ({quote.items.length})
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              {quote.items.map((it, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0 truncate">{it.name ?? it.slug ?? '—'}</span>
                  <span className="shrink-0 text-muted-foreground">× {it.qty ?? 1}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {quote.emailReplyText && (
          <section className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
            <h2 className="flex items-center gap-2 text-sm font-medium text-emerald-900">
              <IconMail size={14} /> Dernière réponse envoyée
              {quote.emailSentAt && (
                <span className="text-xs font-normal text-muted-foreground">
                  · {new Date(quote.emailSentAt).toLocaleString('fr-FR')}
                </span>
              )}
            </h2>
            <p className="whitespace-pre-wrap text-sm text-emerald-900/80">{quote.emailReplyText}</p>
          </section>
        )}

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <IconSend size={14} /> Répondre par email
          </h2>

          <div className="space-y-2">
            <Label htmlFor="subject">Objet</Label>
            <Input id="subject" value={replySubject} onChange={(e) => setReplySubject(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={8}
              placeholder="Bonjour,&#10;&#10;En réponse à votre demande…"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={markSent}
                onChange={(e) => setMarkSent(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Marquer ce devis comme « Devis envoyé » après l&apos;envoi
            </label>
            <Button onClick={onSend} disabled={sending} className="ml-auto">
              <IconSend size={14} /> {sending ? 'Envoi…' : 'Envoyer la réponse'}
            </Button>
          </div>
        </section>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium">Workflow</h2>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as QuoteStatus)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              {QUOTE_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedToId">Assigné à</Label>
            <select id="assignedToId" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">— Personne</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name ?? u.email}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes internes</Label>
            <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Non visibles par le client" />
          </div>

          <Button onClick={onSaveMeta} disabled={savingMeta} className="w-full" variant="outline">
            {savingMeta ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </section>

        {quote.assignedToId && (
          <section className="rounded-xl border border-border bg-card p-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IconUserCircle size={14} />
              Suivi par {users.find((u) => u.id === quote.assignedToId)?.name ?? '—'}
            </div>
          </section>
        )}

        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <h2 className="text-xs font-medium text-muted-foreground">Diagnostic email</h2>
          <Button variant="outline" size="sm" onClick={onTestEmail} disabled={testing} className="w-full">
            <IconMailForward size={14} /> {testing ? 'Envoi…' : "Tester l'email"}
          </Button>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Envoie un email de test au destinataire des devis pour vérifier la configuration Resend.
          </p>
        </section>

        <Button variant="ghost" onClick={onDelete} disabled={deleting}
                className="w-full text-destructive hover:bg-destructive/10">
          <IconTrash size={14} /> Supprimer
        </Button>
      </aside>
    </div>
  )
}
