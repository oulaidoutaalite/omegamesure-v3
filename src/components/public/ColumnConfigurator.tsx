'use client'

import { IconCheck, IconShoppingCartPlus } from '@tabler/icons-react'
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
    phase: 'Phase stationnaire', other: 'Autre (préciser)', otherPh: 'Précisez la phase souhaitée',
    length: 'Longueur', innerDia: 'Diamètre interne', particle: 'Granulométrie', pore: 'Taille de pores', film: 'Épaisseur de film',
    brand: 'Marque', qty: 'Quantité', optional: '(optionnel)', noPref: 'Sans préférence',
    add: 'Ajouter au devis', added: 'Ajouté', pick: '— sélectionner —',
    summary: 'Votre colonne', goQuote: 'Voir ma demande de devis',
    hint: 'Seule la quantité est à saisir : tous les autres champs se sélectionnent.',
  },
  en: {
    title: 'Configure a column', subtitle: 'Select the characteristics of your HPLC or GC column, then add it to your quote request.',
    phase: 'Stationary phase', other: 'Other (specify)', otherPh: 'Specify the required phase',
    length: 'Length', innerDia: 'Inner diameter', particle: 'Particle size', pore: 'Pore size', film: 'Film thickness',
    brand: 'Brand', qty: 'Quantity', optional: '(optional)', noPref: 'No preference',
    add: 'Add to quote', added: 'Added', pick: '— select —',
    summary: 'Your column', goQuote: 'View my quote request',
    hint: 'Only the quantity is typed — every other field is selected from a list.',
  },
  ar: {
    title: 'تهيئة عمود', subtitle: 'اختر خصائص عمود HPLC أو GC الخاص بك ثم أضِفه إلى طلب عرض السعر.',
    phase: 'الطور الثابت', other: 'أخرى (حدّد)', otherPh: 'حدّد الطور المطلوب',
    length: 'الطول', innerDia: 'القطر الداخلي', particle: 'حجم الجُسيمات', pore: 'حجم المسام', film: 'سُمك الغشاء',
    brand: 'العلامة التجارية', qty: 'الكمية', optional: '(اختياري)', noPref: 'بدون تفضيل',
    add: 'أضِف إلى العرض', added: 'تمت الإضافة', pick: '— اختر —',
    summary: 'عمودك', goQuote: 'عرض طلب السعر',
    hint: 'الكمية فقط تُكتب — أما بقية الحقول فتُختار من قوائم.',
  },
}

function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function ColumnConfigurator() {
  const rawLocale = useLocale()
  const locale: Loc = rawLocale === 'en' || rawLocale === 'ar' ? rawLocale : 'fr'
  const t = T[locale]
  const cart = useCart()

  const [type, setType] = useState<ColType>('HPLC')
  const [phaseSel, setPhaseSel] = useState('')
  const [phaseOther, setPhaseOther] = useState('')
  const [length, setLength] = useState('')
  const [innerDia, setInnerDia] = useState('')
  const [particle, setParticle] = useState('')
  const [pore, setPore] = useState('')
  const [film, setFilm] = useState('')
  const [brand, setBrand] = useState('')
  const [qty, setQty] = useState('1')
  const [justAdded, setJustAdded] = useState(false)

  const phase = phaseSel === '__other__' ? phaseOther.trim() : phaseSel
  const lenUnit = type === 'HPLC' ? 'mm' : 'm'

  const valid = useMemo(() => {
    if (!phase || !length || !innerDia) return false
    return type === 'HPLC' ? !!particle : !!film
  }, [phase, length, innerDia, particle, film, type])

  // Switching HPLC ↔ GC invalidates every dimension list.
  function switchType(v: ColType) {
    setType(v)
    setPhaseSel(''); setPhaseOther(''); setLength(''); setInnerDia(''); setParticle(''); setPore(''); setFilm('')
  }

  function reset() {
    setPhaseSel(''); setPhaseOther(''); setLength(''); setInnerDia(''); setParticle(''); setPore(''); setFilm(''); setBrand(''); setQty('1')
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
    cart.add({ slug, name: buildName(), brand: brand || 'Chromatographie', image: null, qty: Math.max(1, Math.min(9999, Number(qty) || 1)) })
    toast.success(t.added)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
    reset()
  }

  const devisHref = locale === 'fr' ? '/devis' : `/${locale}/devis`
  const field = 'space-y-1.5'
  const selectCls = 'flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm'

  /** Reusable labelled <select>. */
  function Picker({ label, value, onChange, options, unit, optional }: {
    label: string; value: string; onChange: (v: string) => void
    options: string[]; unit?: string; optional?: boolean
  }) {
    return (
      <div className={field}>
        <Label>
          {label}{unit ? ` (${unit})` : ''} {optional ? t.optional : '*'}
        </Label>
        <select className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{optional ? t.noPref : t.pick}</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

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
          <select className={selectCls} value={phaseSel} onChange={(e) => setPhaseSel(e.target.value)}>
            <option value="">{t.pick}</option>
            {PHASES[type].map((p) => <option key={p} value={p}>{p}</option>)}
            <option value="__other__">{t.other}</option>
          </select>
          {phaseSel === '__other__' && (
            <Input className="mt-2" placeholder={t.otherPh} value={phaseOther} onChange={(e) => setPhaseOther(e.target.value)} />
          )}
        </div>

        <Picker label={t.length}   unit={lenUnit} value={length}   onChange={setLength}   options={LENGTHS[type]} />
        <Picker label={t.innerDia} unit="mm"      value={innerDia} onChange={setInnerDia} options={INNER_DIA[type]} />

        {type === 'HPLC' ? (
          <>
            <Picker label={t.particle} unit="µm" value={particle} onChange={setParticle} options={PARTICLES} />
            <Picker label={t.pore}     unit="Å"  value={pore}     onChange={setPore}     options={PORES} optional />
          </>
        ) : (
          <Picker label={t.film} unit="µm" value={film} onChange={setFilm} options={FILMS} />
        )}

        <Picker label={t.brand} value={brand} onChange={setBrand} options={BRANDS} optional />

        {/* Quantity — the only typed field */}
        <div className={field}>
          <Label htmlFor="col-qty">{t.qty} *</Label>
          <Input id="col-qty" type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(e.target.value)} />
        </div>
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
