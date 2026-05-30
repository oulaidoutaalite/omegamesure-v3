'use client'

import { type ContactStatus } from '@prisma/client'
import { IconArchive, IconSend, IconTrash } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  CONTACT_STATUS_OPTIONS,
  ContactStatusBadge,
} from '@/components/admin/quotes/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { deleteContact, replyToContact, updateContact } from '@/lib/actions/contact'

export type ContactDetail = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  status: ContactStatus
  replyText: string | null
  repliedAt: string | null
  archivedAt: string | null
  createdAt: string
}

export function ContactDetailView({ contact }: { contact: ContactDetail }) {
  const router = useRouter()

  const [status, setStatus] = useState<ContactStatus>(contact.status)
  const [replySubject, setReplySubject] = useState<string>(
    contact.subject ? `Re: ${contact.subject}` : `Re: votre message`,
  )
  const [replyBody, setReplyBody] = useState<string>('')

  const [saving, startSave]   = useTransition()
  const [sending, startSend]  = useTransition()
  const [deleting, startDel]  = useTransition()

  function onSaveStatus(next: ContactStatus) {
    setStatus(next)
    startSave(async () => {
      const res = await updateContact({ id: contact.id, status: next })
      if (!res.ok) toast.error(res.error)
      else toast.success('Statut mis à jour')
    })
  }

  function onSend() {
    if (replyBody.trim().length < 5) { toast.error('Message trop court'); return }
    startSend(async () => {
      const res = await replyToContact({
        id: contact.id,
        subject: replySubject,
        message: replyBody,
      })
      if (!res.ok) { toast.error(res.error); return }
      if (res.data.delivered) toast.success('Email envoyé')
      else if (res.data.skipped) toast.warning('Email enregistré mais NON envoyé (RESEND_API_KEY manquant)')
      else toast.error('Email non délivré')
      setReplyBody('')
      router.refresh()
    })
  }

  function onArchive() {
    onSaveStatus('ARCHIVED')
  }

  function onDelete() {
    if (!confirm('Supprimer définitivement ce message ?')) return
    startDel(async () => {
      const res = await deleteContact(contact.id)
      if (!res.ok) toast.error(res.error)
      else { toast.success('Message supprimé'); router.push('/admin/messages') }
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{contact.name}</h1>
              <p className="text-sm text-muted-foreground">
                <a href={`mailto:${contact.email}`} className="text-brand hover:underline">{contact.email}</a>
                {contact.phone && <> · {contact.phone}</>}
              </p>
              {contact.subject && (
                <p className="mt-2 text-sm font-medium">{contact.subject}</p>
              )}
            </div>
            <ContactStatusBadge status={contact.status} />
          </div>

          <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-4 text-sm">
            {contact.message}
          </p>

          <p className="text-xs text-muted-foreground">
            Reçu le {new Date(contact.createdAt).toLocaleString('fr-FR')}
          </p>
        </section>

        {contact.replyText && (
          <section className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
            <h2 className="text-sm font-medium text-emerald-900">
              Dernière réponse envoyée
              {contact.repliedAt && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  · {new Date(contact.repliedAt).toLocaleString('fr-FR')}
                </span>
              )}
            </h2>
            <p className="whitespace-pre-wrap text-sm text-emerald-900/80">{contact.replyText}</p>
          </section>
        )}

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium">
            <IconSend size={14} /> Répondre
          </h2>
          <div className="space-y-2">
            <Label htmlFor="subject">Objet</Label>
            <Input id="subject" value={replySubject} onChange={(e) => setReplySubject(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" rows={8} value={replyBody} onChange={(e) => setReplyBody(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={onSend} disabled={sending}>
              <IconSend size={14} /> {sending ? 'Envoi…' : 'Envoyer'}
            </Button>
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="space-y-3 rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-medium">Statut</h2>
          <select value={status} disabled={saving}
            onChange={(e) => onSaveStatus(e.target.value as ContactStatus)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            {CONTACT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {status !== 'ARCHIVED' && (
            <Button variant="outline" onClick={onArchive} disabled={saving} className="w-full">
              <IconArchive size={14} /> Archiver
            </Button>
          )}
        </section>

        <Button variant="ghost" onClick={onDelete} disabled={deleting}
                className="w-full text-destructive hover:bg-destructive/10">
          <IconTrash size={14} /> Supprimer
        </Button>
      </aside>
    </div>
  )
}
