'use client'

import { IconCircleCheck, IconSend } from '@tabler/icons-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitPublicContact } from '@/lib/actions/contact'

export function ContactForm() {
  const [pending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 5) { toast.error('Message trop court'); return }
    startTransition(async () => {
      const res = await submitPublicContact({ name, email, phone, subject, message })
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Message envoyé')
      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-10 text-center">
        <IconCircleCheck size={40} className="mx-auto text-emerald-600" />
        <h2 className="mt-4 text-xl font-bold tracking-tight">Message reçu</h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          Merci, nous vous répondons rapidement.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Nom *</Label>
          <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-email">Email *</Label>
          <Input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-phone">Téléphone</Label>
          <Input id="c-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-subject">Sujet</Label>
          <Input id="c-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-message">Message *</Label>
        <Textarea id="c-message" rows={6} required minLength={5}
                  value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          <IconSend size={14} /> {pending ? 'Envoi…' : 'Envoyer'}
        </Button>
      </div>
    </form>
  )
}
