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

// Universal stationary-phase tokens (chromatography phase names are used in
// English worldwide); the "Other" option reveals a free-text field.
const PHASES: Record<ColType, string[]> = {
  HPLC: ['C18', 'C8', 'C4', 'C30', 'Phenyl', 'HILIC', 'NH2 (amino)', 'CN (cyano)', 'Silica', 'SCX', 'SAX', 'Chiral'],
  GC: ['5% Phenyl (DB-5 / HP-5)', '100% Dimethylpolysiloxane (DB-1)', '50% Phenyl', '(6%-Cyanopropylphenyl) (DB-624)', 'PEG / Wax (polar)'],
}
const BRANDS = ['Agilent', 'Waters', 'Phenomenex', 'Thermo Fisher', 'Restek', 'Merck / Supelco', 'Shimadzu', 'Macherey-Nagel']

const T: Record<Loc, Record<string, string>> = {
  fr: {
    title: 'Configurer une colonne', subtitle: 'Précisez votre colonne HPLC ou GC, puis ajoutez-la à votre demande de devis.',
    type: 'Type de colonne', phase: 'Phase stationnaire', other: 'Autre (préciser)', otherPh: 'Ex. : Amide, Pentafluorophényl…',
    length: 'Longueur', innerDia: 'Diamètre interne', particle: 'Granulométrie', pore: 'Taille de pores', film: "Épaisseur de film",
    brand: 'Marque', brandPh: 'Marque souhaitée (optionnel)', qty: 'Quantité', optional: '(optionnel)',
    add: 'Ajouter au devis', added: 'Ajouté', pick: '— choisir —',
    summary: 'Votre colonne', goQuote: 'Voir ma demande de devis', hint: 'Champs requis : type, phase, longueur, Ø interne et granulométrie (HPLC) ou épaisseur de film (GC).',
  },
  en: {
    title: 'Configure a column', subtitle: 'Specify your HPLC or GC column, then add it to your quote request.',
    type: 'Column type', phase: 'Stationary phase', other: 'Other (specify)', otherPh: 'e.g. Amide, Pentafluorophenyl…',
    length: 'Length', innerDia: 'Inner diameter', particle: 'Particle size', pore: 'Pore size', film: 'Film thickness',
    brand: 'Brand', brandPh: 'Preferred brand (optional)', qty: 'Quantity', optional: '(optional)',
    add: 'Add to quote', added: 'Added', pick: '— choose —',
    summary: 'Your column', goQuote: 'View my quote request', hint: 'Required: type, phase, length, inner Ø and particle size (HPLC) or film thickness (GC).',
  },
  ar: {
    title: 'تهيئة عمود', subtitle: 'حدّد عمود HPLC أو GC الخاص بك ثم أضِفه إلى طلب عرض السعر.',
    type: 'نوع العمود', phase: 'الطور الثابت', other: 'أخرى (حدّد)', otherPh: 'مثال: Amide، Pentafluorophenyl…',
    length: 'الطول', innerDia: 'القطر الداخلي', particle: 'حجم الجُسيمات', pore: 'حجم المسام', film: 'سُمك الغشاء',
    brand: 'العلامة التجارية', brandPh: 'العلامة المفضّلة (اختياري)', qty: 'الكمية', optional: '(اختياري)',
    add: 'أضِف إلى العرض', added: 'تمت الإضافة', pick: '— اختر —',
    summary: 'عمودك', goQuote: 'عرض طلب السعر', hint: 'مطلوب: النوع، الطور، الطول، القطر الداخلي وحجم الجُسيمات (HPLC) أو سُمك الغشاء (GC).',
  },
}

function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function ColumnConfigurator() {
  const locale = (useLocale() as Loc) in T ? (useLocale() as Loc) : 'fr'
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
    if (!phase || !length.trim() || !innerDia.trim()) return false
    if (type === 'HPLC') return !!particle.trim()
    return !!film.trim()
  }, [phase, length, innerDia, particle, film, type])

  function reset() {
    setPhaseSel(''); setPhaseOther(''); setLength(''); setInnerDia(''); setParticle(''); setPore(''); setFilm(''); setBrand(''); setQty('1')
  }

  function buildName(): string {
    const dims = type === 'HPLC'
      ? [`${length} × ${innerDia} mm`, `${particle} µm`, pore.trim() ? `${pore} Å` : ''].filter(Boolean).join(' · ')
      : [`${length} m × ${innerDia} mm`, `film ${film} µm`].filter(Boolean).join(' · ')
    const head = `${locale === 'fr' ? 'Colonne' : locale === 'ar' ? 'عمود' : 'Column'} ${type} ${phase}`
    return brand.trim() ? `${head} — ${dims} — ${brand.trim()}` : `${head} — ${dims}`
  }

  function onAdd() {
    if (!valid) return
    const slug = slugify(['col', type, phase, length, innerDia, type === 'HPLC' ? particle : film, pore, brand].join('-'))
    cart.add({ slug, name: buildName(), brand: brand.trim() || 'Chromatographie', image: null, qty: Math.max(1, Math.min(9999, Number(qty) || 1)) })
    toast.success(t.added)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
    reset()
  }

  const devisHref = locale === 'fr' ? '/devis' : `/${locale}/devis`
  const field = 'space-y-1.5'
  const selectCls = 'flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm'

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <h3 className="text-xl font-bold tracking-tight">{t.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>

      {/* Type toggle */}
      <div className="mt-6 inline-flex rounded-lg border border-border p-1">
        {(['HPLC', 'GC'] as ColType[]).map((v) => (
          <button key={v} type="button" onClick={() => { setType(v); setPhaseSel(''); setPhaseOther('') }}
            className={`rounded-md px-5 py-1.5 text-sm font-semibold transition ${type === v ? 'bg-brand text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            {v}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Phase */}
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

        <div className={field}>
          <Label>{t.length} ({lenUnit}) *</Label>
          <Input inputMode="decimal" placeholder={type === 'HPLC' ? '150' : '30'} value={length} onChange={(e) => setLength(e.target.value)} />
        </div>
        <div className={field}>
          <Label>{t.innerDia} (mm) *</Label>
          <Input inputMode="decimal" placeholder={type === 'HPLC' ? '4.6' : '0.25'} value={innerDia} onChange={(e) => setInnerDia(e.target.value)} />
        </div>

        {type === 'HPLC' ? (
          <>
            <div className={field}>
              <Label>{t.particle} (µm) *</Label>
              <Input inputMode="decimal" placeholder="5" value={particle} onChange={(e) => setParticle(e.target.value)} />
            </div>
            <div className={field}>
              <Label>{t.pore} (Å) {t.optional}</Label>
              <Input inputMode="decimal" placeholder="100" value={pore} onChange={(e) => setPore(e.target.value)} />
            </div>
          </>
        ) : (
          <div className={field}>
            <Label>{t.film} (µm) *</Label>
            <Input inputMode="decimal" placeholder="0.25" value={film} onChange={(e) => setFilm(e.target.value)} />
          </div>
        )}

        <div className={field}>
          <Label>{t.brand} {t.optional}</Label>
          <Input list="col-brands" placeholder={t.brandPh} value={brand} onChange={(e) => setBrand(e.target.value)} />
          <datalist id="col-brands">{BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
        </div>
        <div className={field}>
          <Label>{t.qty}</Label>
          <Input type="number" min={1} max={9999} value={qty} onChange={(e) => setQty(e.target.value)} />
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
