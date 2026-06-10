'use client'

import { IconCircleCheck, IconSend } from '@tabler/icons-react'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { useCart } from '@/components/public/cart/CartProvider'
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

const REQUEST_TYPES: Array<PublicQuoteInput['requestType']> = [
  'EQUIPMENT', 'BALANCE', 'CONSUMABLE', 'METROLOGY', 'CONSULTING', 'OTHER',
]
const SECTORS: Array<NonNullable<PublicQuoteInput['sector']>> = [
  'PHARMA', 'INDUSTRY', 'BIOMEDICAL', 'AGRO', 'RESEARCH', 'LOGISTICS', 'OTHER',
]

type Props = {
  config: FormConfig
  defaultRequestType?: PublicQuoteInput['requestType']
  productSlug?: string
}

export function QuoteForm({ config, defaultRequestType, productSlug }: Props) {
  const t       = useTranslations('quote.form')
  const tTypes  = useTranslations('quote.types')
  const tSector = useTranslations('quote.sectors')
  const tCart   = useTranslations('cart')
  const locale  = useLocale()

  const cart      = useCart()
  const cartItems = cart.items
  const hasCart   = cart.ready && cartItems.length > 0

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
    if (!hasCart && description.trim().length < 10) {
      toast.error(t('minLength'))
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
        items:       hasCart ? cartItems.map((i) => ({ slug: i.slug, name: i.name, qty: i.qty })) : undefined,
        locale,
      })
      if (!res.ok) { toast.error(res.error); return }
      if (hasCart) cart.clear()
      toast.success(t('successTitle'))
      setSuccess(res.data.reference)
    })
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-10 text-center">
        <IconCircleCheck size={40} className="mx-auto text-emerald-600" />
        <h2 className="mt-4 text-xl font-bold tracking-tight">{t('successTitle')}</h2>
        <p className="mt-2 text-sm text-emerald-900/80">
          {t('successBody', { ref: success })}
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
      {hasCart && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
          <p className="mb-2 text-sm font-semibold text-brand">
            {tCart('selectedTitle')} ({cartItems.length})
          </p>
          <ul className="space-y-1.5">
            {cartItems.map((it) => (
              <li key={it.slug} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{it.name}</span>
                <span className="shrink-0 text-muted-foreground">× {it.qty}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">{t('fullName')} *</Label>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        {config.showCompany && (
          <div className="space-y-1.5">
            <Label htmlFor="company">{t('company')}</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('email')} *</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {config.showPhone && (
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t('phone')}</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="requestType">{t('requestType')} *</Label>
          <select id="requestType" value={requestType}
                  onChange={(e) => setRequestType(e.target.value as PublicQuoteInput['requestType'])}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
            {REQUEST_TYPES.map((v) => <option key={v} value={v}>{tTypes(v)}</option>)}
          </select>
        </div>
        {config.showSector && (
          <div className="space-y-1.5">
            <Label htmlFor="sector">{t('sector')}</Label>
            <select id="sector" value={sector ?? ''}
                    onChange={(e) => setSector(e.target.value as NonNullable<PublicQuoteInput['sector']>)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              {SECTORS.map((v) => <option key={v} value={v}>{tSector(v)}</option>)}
            </select>
          </div>
        )}
        {config.showQuantity && (
          <div className="space-y-1.5">
            <Label htmlFor="quantity">{t('quantity')}</Label>
            <Input id="quantity" placeholder={t('quantityPlaceholder')}
                   value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
        )}
        {config.showDeadline && (
          <div className="space-y-1.5">
            <Label htmlFor="deadline">{t('deadline')}</Label>
            <Input id="deadline" placeholder={t('deadlinePlaceholder')}
                   value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">{t('description')} {hasCart ? '' : '*'}</Label>
        <Textarea id="description" rows={6} required={!hasCart} minLength={hasCart ? undefined : 10}
                  placeholder={t('descriptionPlaceholder')}
                  value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted-foreground">{t('consent')}</p>
        <Button type="submit" size="lg" disabled={pending}>
          <IconSend size={16} /> {pending ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  )
}
