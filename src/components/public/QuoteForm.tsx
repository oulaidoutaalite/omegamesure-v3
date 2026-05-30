'use client'

import { IconCircleCheck, IconSend } from '@tabler/icons-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitPublicQuote } from '@/lib/actions/quotes'
import { type PublicQuoteInput } from '@/lib/validations/quote'

type FormConfig = {
  showCompany:   boolean
  showPhone:     boolean
  showSector:    boolean
  showQuantity:  boolean
  showDeadline:  boolean
  confirmationMessage: string
}

const REQUEST_TYPES: Array<{ value: PublicQuoteInput['requestType']; label: string }> = [
  { value: 'EQUIPMENT',  label: 'Équipement labo / biomédical' },
  { value: 'BALANCE',    label: 'Balance / bascule' },
  { value: 'CONSUMABLE', label: 'Consommables' },
  { value: 'METROLOGY',  label: 'Métrologie / étalonnage' },
  { value: 'CONSULTING', label: 'Consulting / validation' },
  { value: 'OTHER',      label: 'Autres' },
]

const SECTORS: Array<{ value: NonNullable<PublicQuoteInput['sector']>; label: string }> = [
  { value: 'PHARMA',     label: 'Pharmaceutique' },
  { value: 'INDUSTRY',   label: 'Industrie' },
  { value: 'BIOMEDICAL', label: 'Biomédical' },
  { value: 'AGRO',       label: 'Agroalimentaire' },
  { value: 'RESEARCH',   label: 'Recherche' },
  { value: 'LOGISTICS',  label: 'Logistique' },
  { value: 'OTHER',      label: 'Autre' },
]

type Props = {
  config: FormConfig
  defaultRequestType?: PublicQuoteInput['requestType']
  productSlug?: string
}

export function QuoteForm({ config, defaultRequestType, productSlug }: Props) {
  const [pending, startTransition] = useTransition()
  const [success, setSuccess] = useState<string | null>(null)

  const [fullName,    setFullName]    = useState('')
  const [company,     setCompany]     = useState('')
  const [email,       setEmail]       = useState('')
  const [phone,       setPhone]       = useState('')
  const [requestType, setRequestType] = useState<PublicQuoteInput['requestType']>(defaultRequestType ?? 'EQUIPMENT')
  const [sector,      setSector]      = useState<PublicQuoteInput['sector']>('PHARMA')
  const [quantity,    setQuantity]    = useState('')
  const [deadline,    setDeadline]    = useState('')
  const [description, setDescription] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (description.trim().length < 10) {
      toast.error('La description doit faire au moins 10 caractères')
      return
    }
    startTransition(async () => {
      const res = await submitPublicQuote({
        fullName,
        company:     config.showCompany  ? company  : '',
        email,
        phone:       config.showPhone    ? phone    : '',
        requestType,
        sector:      config.showSector   ? sector   : undefined,
        quantity:    config.showQuantity ? quantity : '',
        deadline:    config.showDeadline ? deadline : '',
        description,
        productId:   productSlug ?? '',
        locale:      'fr',
      })
      if (!res.ok) { toast.error(res.error); return }
      toast.success(`Demande envoyée — réf. ${res.data.reference}`)
      setSuccess(res.data.reference)
    })
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-10 text-center">
        <IconCircleCheck size={40} className="mx-auto text-emerald-600" />
        <h2 className="mt-4 text-xl font-bold tracking-tight">Demande bien reçue !</h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          Référence : <strong>{success}</strong>. Vous recevrez un email de confirmation,
          et notre équipe vous répondra sous 24 à 48 h ouvrées.
        </p>
        {config.confirmationMessage && (
          <p className="mt-4 whitespace-pre-line text-sm text-muted-foreground">
            {config.confirmationMessage}
          </p>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Nom complet *</Label>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        {config.showCompany && (
          <div className="space-y-1.5">
            <Label htmlFor="company">Société</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email professionnel *</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {config.showPhone && (
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="requestType">Type de demande *</Label>
          <select id="requestType" value={requestType}
                  onChange={(e) => setRequestType(e.target.value as PublicQuoteInput['requestType'])}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            {REQUEST_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {config.showSector && (
          <div className="space-y-1.5">
            <Label htmlFor="sector">Secteur d&apos;activité</Label>
            <select id="sector" value={sector ?? ''}
                    onChange={(e) => setSector(e.target.value as NonNullable<PublicQuoteInput['sector']>)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              {SECTORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
        {config.showQuantity && (
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantité estimée</Label>
            <Input id="quantity" placeholder="ex: 10 unités, ~50 kg/an…"
                   value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
        )}
        {config.showDeadline && (
          <div className="space-y-1.5">
            <Label htmlFor="deadline">Délai souhaité</Label>
            <Input id="deadline" placeholder="ex: avant juin 2026"
                   value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Décrivez votre besoin *</Label>
        <Textarea id="description" rows={6} required minLength={10}
                  placeholder="Application, contraintes techniques, normes, environnement de travail…"
                  value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted-foreground">
          En envoyant, vous acceptez d&apos;être recontacté concernant votre demande.
        </p>
        <Button type="submit" size="lg" disabled={pending}>
          <IconSend size={16} /> {pending ? 'Envoi…' : 'Envoyer ma demande'}
        </Button>
      </div>
    </form>
  )
}
