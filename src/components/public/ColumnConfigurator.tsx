'use client'

import { IconCheck, IconMinus, IconPlus, IconShoppingCartPlus } from '@tabler/icons-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useCart } from '@/components/public/cart/CartProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Loc = 'fr' | 'en' | 'ar'
type ColType = 'HPLC' | 'GC'

// Stationary-phase names are used in English worldwide (no translation needed).
const PHASES: Record<ColType, string[]> = {
  HPLC: ['C18', 'C8', 'C4', 'C30', 'Phenyl', 'Phenyl-Hexyl', 'PFP (pentafluorophényl)', 'HILIC', 'NH2 (amino)', 'CN (cyano)', 'Diol', 'Amide', 'Silica', 'SCX', 'SAX', 'SEC / GPC', 'Chiral'],
  GC: ['5% Phenyl (DB-5 / HP-5 / Rtx-5)', '100% Diméthylpolysiloxane (DB-1 / HP-1)', '50% Phenyl (DB-17)', '14% Cyanopropylphenyl (DB-1701)', '6% Cyanopropylphenyl (DB-624)', 'PEG / Wax (DB-WAX)', 'FFAP (acides gras)', 'PLOT (gaz)'],
}

// Catalogue-standard dimensions (client selects, never types).
const LENGTHS: Record<ColType, string[]> = {
  HPLC: ['30', '50', '75', '100', '125', '150', '200', '250', '300'],
  GC: ['10', '15', '20', '25', '30', '50', '60', '105'],
}
const INNER_DIA: Record<ColType, string[]> = {
  HPLC: ['1.0', '2.0', '2.1', '3.0', '3.9', '4.0', '4.6', '10', '21.2', '30', '50'],
  GC: ['0.10', '0.18', '0.20', '0.25', '0.32', '0.53'],
}
const PARTICLES = ['1.7', '1.8', '2.6', '2.7', '3.0', '3.5', '5', '7', '10']
const PORES = ['60', '80', '100', '120', '130', '150', '200', '300', '1000']
const FILMS = ['0.10', '0.18', '0.25', '0.32', '0.50', '1.00', '1.50', '3.00', '5.00']
const BRANDS = ['Agilent', 'Waters', 'Phenomenex', 'Thermo Fisher', 'Restek', 'Merck / Supelco', 'Shimadzu', 'Macherey-Nagel', 'YMC', 'GL Sciences']

const T: Record<Loc, Record<string, string>> = {
  fr: {
    title: 'Configurer une colonne', subtitle: 'Sélectionnez les caractéristiques de votre colonne HPLC ou GC, puis ajoutez-la à votre demande de devis.',
    phase: 'Phase stationnaire',
    length: 'Longueur', innerDia: 'Diamètre interne', particle: 'Granulométrie', pore: 'Taille de pores', film: 'Épaisseur de film',
    brand: 'Marque', qty: 'Quantité', optional: '(optionnel)', noPref: 'Sans préférence',
    add: 'Ajouter au devis', added: 'Ajouté', pick: '— sélectionner —',
    dec: 'Diminuer la quantité', inc: 'Augmenter la quantité',
    summary: 'Votre colonne', goQuote: 'Voir ma demande de devis',
    hint: 'Tous les champs se sélectionnent ; ajustez la quantité avec − et +.',
  },
  en: {
    title: 'Configure a column', subtitle: 'Select the characteristics of your HPLC or GC column, then add it to your quote request.',
    phase: 'Stationary phase',
    length: 'Length', innerDia: 'Inner diameter', particle: 'Particle size', pore: 'Pore size', film: 'Film thickness',
    brand: 'Brand', qty: 'Quantity', optional: '(optional)', noPref: 'No preference',
    add: 'Add to quote', added: 'Added', pick: '— select —',
    dec: 'Decrease quantity', inc: 'Increase quantity',
    summary: 'Your column', goQuote: 'View my quote request',
    hint: 'Every field is picked from a list; adjust the quantity with − and +.',
  },
  ar: {
    title: 'تهيئة عمود', subtitle: 'اختر خصائص عمود HPLC أو GC الخاص بك ثم أضِفه إلى طلب عرض السعر.',
    phase: 'الطور الثابت',
    length: 'الطول', innerDia: 'القطر الداخلي', particle: 'حجم الجُسيمات', pore: 'حجم المسام', film: 'سُمك الغشاء',
    brand: 'العلامة التجارية', qty: 'الكمية', optional: '(اختياري)', noPref: 'بدون تفضيل',
    add: 'أضِف إلى العرض', added: 'تمت الإضافة', pick: '— اختر —',
    dec: 'إنقاص الكمية', inc: 'زيادة الكمية',
    summary: 'عمودك', goQuote: 'عرض طلب السعر',
    hint: 'تُختار جميع الحقول من قوائم؛ اضبط الكمية بـ − و +.',
  },
}

function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const SELECT_CLS = 'flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm'

/** Labelled <select>. Declared at module level so React keeps the same element
 *  across re-renders (a component defined inside the parent would remount on
 *  every state change and lose focus/value). */
function Picker({ label, unit, optional, value, onChange, options, placeholder }: {
  label: string; unit?: string; optional?: boolean
  value: string; onChange: (v: string) => void
  options: string[]; placeholder: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{unit ? ` (${unit})` : ''} {optional ? '' : '*'}</Label>
      <select className={SELECT_CLS} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

const QTY_MIN = 1
const QTY_MAX = 9999

/** Quantity stepper: − / value / + (value stays typable). Module level — see Picker. */
function QtyStepper({ label, value, onChange, decLabel, incLabel }: {
  label: string; value: number; onChange: (n: number) => void
  decLabel: string; incLabel: string
}) {
  const clamp = (n: number) => Math.max(QTY_MIN, Math.min(QTY_MAX, n))
  const btn = 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-input bg-background text-foreground transition hover:border-brand hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-40'
  return (
    <div className="space-y-1.5">
      <Label htmlFor="col-qty">{label} *</Label>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => onChange(clamp(value - 1))}
                disabled={value <= QTY_MIN} aria-label={decLabel} title={decLabel}>
          <IconMinus size={16} />
        </button>
        <Input id="col-qty" type="number" inputMode="numeric" min={QTY_MIN} max={QTY_MAX}
               value={String(value)} onChange={(e) => onChange(clamp(Number(e.target.value) || QTY_MIN))}
               className="h-10 w-20 text-center" />
        <button type="button" className={btn} onClick={() => onChange(clamp(value + 1))}
                disabled={value >= QTY_MAX} aria-label={incLabel} title={incLabel}>
          <IconPlus size={16} />
        </button>
      </div>
    </div>
  )
}

export function ColumnConfigurator() {
  const rawLocale = useLocale()
  const locale: Loc = rawLocale === 'en' || rawLocale === 'ar' ? rawLocale : 'fr'
  const t = T[locale]
  const cart = useCart()

  const [type, setType] = useState<ColType>('HPLC')
  const [phase, setPhase] = useState('')
  const [length, setLength] = useState('')
  const [innerDia, setInnerDia] = useState('')
  const [particle, setParticle] = useState('')
  const [pore, setPore] = useState('')
  const [film, setFilm] = useState('')
  const [brand, setBrand] = useState('')
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const lenUnit = type === 'HPLC' ? 'mm' : 'm'

  const valid = useMemo(() => {
    if (!phase || !length || !innerDia) return false
    return type === 'HPLC' ? !!particle : !!film
  }, [phase, length, innerDia, particle, film, type])

  // Switching HPLC ↔ GC invalidates every dimension list.
  function switchType(v: ColType) {
    setType(v)
    setPhase(''); setLength(''); setInnerDia(''); setParticle(''); setPore(''); setFilm('')
  }

  function reset() {
    setPhase(''); setLength(''); setInnerDia(''); setParticle(''); setPore(''); setFilm(''); setBrand(''); setQty(1)
  }

  function buildName(): string {
    const dims = type === 'HPLC'
      ? [`${length} × ${innerDia} mm`, `${particle} µm`, pore ? `${pore} Å` : ''].filter(Boolean).join(' · ')
      : [`${length} m × ${innerDia} mm`, `film ${film} µm`].filter(Boolean).join(' · ')
    const head = `${locale === 'fr' ? 'Colonne' : locale === 'ar' ? 'عمود' : 'Column'} ${type} ${phase}`
    return brand ? `${head} — ${dims} — ${brand}` : `${head} — ${dims}`
  }

  function onAdd() {
    if (!valid) return
    const slug = slugify(['col', type, phase, length, innerDia, type === 'HPLC' ? particle : film, pore, brand].join('-'))
    cart.add({ slug, name: buildName(), brand: brand || 'Chromatographie', image: null, qty })
    toast.success(t.added)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
    reset()
  }

  const devisHref = locale === 'fr' ? '/devis' : `/${locale}/devis`
  const field = 'space-y-1.5'
  const selectCls = SELECT_CLS

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h3 className="text-xl font-bold tracking-tight">{t.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      {/* Type toggle */}
      <div className="mt-6 inline-flex rounded-lg border border-border p-1">
        {(['HPLC', 'GC'] as ColType[]).map((v) => (
          <button key={v} type="button" onClick={() => switchType(v)}
            className={`rounded-md px-5 py-1.5 text-sm font-semibold transition ${type === v ? 'bg-brand text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            {v}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Phase — full width */}
        <div className={`${field} sm:col-span-2`}>
          <Label>{t.phase} *</Label>
          <select className={selectCls} value={phase} onChange={(e) => setPhase(e.target.value)}>
            <option value="">{t.pick}</option>
            {PHASES[type].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <Picker label={t.length}   unit={lenUnit} value={length}   onChange={setLength}   options={LENGTHS[type]}   placeholder={t.pick} />
        <Picker label={t.innerDia} unit="mm"      value={innerDia} onChange={setInnerDia} options={INNER_DIA[type]} placeholder={t.pick} />

        {type === 'HPLC' ? (
          <>
            <Picker label={t.particle} unit="µm" value={particle} onChange={setParticle} options={PARTICLES} placeholder={t.pick} />
            <Picker label={`${t.pore} ${t.optional}`} unit="Å" value={pore} onChange={setPore} options={PORES} optional placeholder={t.noPref} />
          </>
        ) : (
          <Picker label={t.film} unit="µm" value={film} onChange={setFilm} options={FILMS} placeholder={t.pick} />
        )}

        <Picker label={`${t.brand} ${t.optional}`} value={brand} onChange={setBrand} options={BRANDS} optional placeholder={t.noPref} />

        {/* Quantity — stepper − / + (the only editable value) */}
        <QtyStepper label={t.qty} value={qty} onChange={setQty} decLabel={t.dec} incLabel={t.inc} />
      </div>

      {/* Live summary */}
      {valid && (
        <div className="mt-5 rounded-xl border border-brand/20 bg-brand/5 p-3 text-sm">
          <span className="font-semibold text-brand">{t.summary} : </span>{buildName()}
        </div>
      )}

      <div className="mt-5 flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted-foreground">{t.hint}</p>
        <div className="flex items-center gap-3">
          {cart.ready && cart.count > 0 && (
            <Link href={devisHref} className="text-sm font-medium text-brand underline-offset-2 hover:underline">{t.goQuote} ({cart.count})</Link>
          )}
          <Button type="button" size="lg" onClick={onAdd} disabled={!valid}>
            {justAdded ? <IconCheck size={16} /> : <IconShoppingCartPlus size={16} />}
            {justAdded ? t.added : t.add}
          </Button>
        </div>
      </div>
    </div>
  )
}
