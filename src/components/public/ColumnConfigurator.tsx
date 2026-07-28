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
type ColType = 'HPLC' | 'GC' | 'SPE'
/** Types whose geometry is described by length / inner diameter. */
type DimType = 'HPLC' | 'GC'

// Stationary-phase names are used in English worldwide (no translation needed).
// The lists below must stay exhaustive: there is no free-text fallback, so a
// missing value means the client cannot request that column.
const PHASES: Record<ColType, string[]> = {
  HPLC: [
    'C18', 'C18 AQ (100 % aqueux)', 'C8', 'C6', 'C4', 'C1', 'C30',
    'Phenyl', 'Phenyl-Hexyl', 'Biphenyl', 'PFP (pentafluorophényl)',
    'HILIC', 'NH2 (amino)', 'CN (cyano)', 'Diol', 'Amide',
    'Silica (phase normale)', 'PGC (carbone graphité)',
    'SCX (échange cationique fort)', 'WCX (échange cationique faible)',
    'SAX (échange anionique fort)', 'WAX (échange anionique faible)',
    'Mixed-mode', 'SEC / GPC (exclusion stérique)', 'Échange de ligands / sucres',
    'Chirale', 'Affinité (Protein A / G)',
  ],
  GC: [
    '100 % Diméthylpolysiloxane (DB-1 / HP-1)',
    '5 % Phenyl (DB-5 / HP-5 / Rtx-5)',
    '8 % Phenyl',
    '14 % Cyanopropylphenyl (DB-1701)',
    '20 % Phenyl',
    '35 % Phenyl (DB-35)',
    '50 % Phenyl (DB-17)',
    '6 % Cyanopropylphenyl (DB-624 / COV)',
    'Cyanopropyl (DB-23 / DB-225 — FAME)',
    'PEG / Wax (DB-WAX)',
    'FFAP (acides gras)',
    'PLOT Al₂O₃ (hydrocarbures légers)',
    'PLOT Molsieve 5A (gaz permanents)',
    'PLOT Q (divinylbenzène)',
    'Chirale (cyclodextrine)',
  ],
  // SPE: the "phase" is the sorbent.
  SPE: [
    'C18', 'C18 end-capped', 'C8', 'C2', 'Phenyl', 'Cyclohexyl',
    'HLB (polymère hydrophile-lipophile)',
    'SCX (échange cationique fort)', 'WCX (échange cationique faible)',
    'SAX (échange anionique fort)', 'WAX (échange anionique faible)',
    'Mixed-mode MCX', 'Mixed-mode MAX',
    'Silice (phase normale)', 'Alumine neutre', 'Alumine acide', 'Alumine basique',
    'Florisil', 'NH2 (amino)', 'PSA (amine primaire-secondaire)', 'Diol', 'CN (cyano)',
    'Carbone graphité (ENVI-Carb)', 'Échange de ligands', 'Immunoaffinité',
    'QuEChERS (dSPE)',
  ],
}

// Catalogue-standard dimensions (client selects, never types).
const LENGTHS: Record<DimType, string[]> = {
  HPLC: ['10', '15', '20', '25', '30', '33', '50', '75', '100', '125', '150', '175', '200', '250', '300'],
  GC: ['5', '10', '12', '15', '20', '25', '30', '40', '45', '50', '60', '75', '100', '105', '120'],
}
const INNER_DIA: Record<DimType, string[]> = {
  HPLC: ['0.3', '0.5', '0.75', '1.0', '1.5', '2.0', '2.1', '2.5', '3.0', '3.2', '3.9', '4.0', '4.6', '6.0', '7.8', '8.0', '9.4', '10', '19', '21.2', '22', '25', '30', '40', '50'],
  GC: ['0.10', '0.15', '0.18', '0.20', '0.22', '0.25', '0.28', '0.32', '0.45', '0.53', '0.75', '1.00', '2.00', '4.00'],
}
// SPE-specific
const BED_MASSES = ['25 mg', '50 mg', '100 mg', '150 mg', '200 mg', '250 mg', '300 mg', '500 mg', '1 g', '2 g', '5 g', '10 g', '20 g']
const SPE_VOLUMES = ['1 mL', '3 mL', '6 mL', '10 mL', '12 mL', '15 mL', '20 mL', '25 mL', '60 mL', '75 mL', '150 mL']
const SPE_FORMATS_FR = ['Cartouche (seringue)', 'Plaque 96 puits', 'Disque', 'Tube QuEChERS', 'Colonne vide + frittés', 'Cartouche en vrac (bulk)']
const PARTICLES = ['1.3', '1.5', '1.6', '1.7', '1.8', '1.9', '2.0', '2.2', '2.5', '2.6', '2.7', '3.0', '3.5', '4.0', '5', '7', '10', '15', '20', '30', '50']
const PORES = ['60', '80', '90', '100', '110', '120', '125', '130', '150', '160', '200', '250', '300', '400', '500', '1000', '2000', '4000']
const FILMS = ['0.05', '0.10', '0.15', '0.18', '0.20', '0.25', '0.30', '0.33', '0.40', '0.50', '0.75', '1.00', '1.20', '1.40', '1.50', '2.00', '2.65', '3.00', '4.00', '5.00']
const BRANDS = ['Agilent', 'Waters', 'Phenomenex', 'Thermo Fisher', 'Restek', 'Merck / Supelco', 'Shimadzu', 'Macherey-Nagel', 'YMC', 'GL Sciences', 'Sigma-Aldrich', 'Bio-Rad', 'Tosoh', 'Hamilton', 'Interchim', 'Kromasil']

const T: Record<Loc, Record<string, string>> = {
  fr: {
    title: 'Configurer une colonne', subtitle: 'Sélectionnez les caractéristiques de votre colonne HPLC, GC ou cartouche SPE, puis ajoutez-la à votre demande de devis.',
    phase: 'Phase stationnaire', sorbent: 'Sorbant',
    bedMass: 'Masse de phase', volume: 'Volume de cartouche', format: 'Format',
    length: 'Longueur', innerDia: 'Diamètre interne', particle: 'Granulométrie', pore: 'Taille de pores', film: 'Épaisseur de film',
    brand: 'Marque', qty: 'Quantité', optional: '(optionnel)', noPref: 'Sans préférence',
    partNumber: 'Référence fabricant', partNumberPh: 'Ex. : 186002350', refShort: 'Réf.',
    add: 'Ajouter au devis', added: 'Ajouté', pick: '— sélectionner —',
    dec: 'Diminuer la quantité', inc: 'Augmenter la quantité',
    summary: 'Votre colonne', goQuote: 'Voir ma demande de devis',
    hint: 'Tous les champs se sélectionnent ; ajustez la quantité avec − et +. Si vous connaissez la référence fabricant, indiquez-la.',
  },
  en: {
    title: 'Configure a column', subtitle: 'Select the characteristics of your HPLC, GC or SPE cartridge, then add it to your quote request.',
    phase: 'Stationary phase', sorbent: 'Sorbent',
    bedMass: 'Bed mass', volume: 'Cartridge volume', format: 'Format',
    length: 'Length', innerDia: 'Inner diameter', particle: 'Particle size', pore: 'Pore size', film: 'Film thickness',
    brand: 'Brand', qty: 'Quantity', optional: '(optional)', noPref: 'No preference',
    partNumber: 'Manufacturer part number', partNumberPh: 'e.g. 186002350', refShort: 'P/N',
    add: 'Add to quote', added: 'Added', pick: '— select —',
    dec: 'Decrease quantity', inc: 'Increase quantity',
    summary: 'Your column', goQuote: 'View my quote request',
    hint: 'Every field is picked from a list; adjust the quantity with − and +. If you know the manufacturer part number, add it.',
  },
  ar: {
    title: 'تهيئة عمود', subtitle: 'اختر خصائص عمود HPLC أو GC أو خرطوشة SPE ثم أضِفه إلى طلب عرض السعر.',
    phase: 'الطور الثابت', sorbent: 'المادة الماصّة',
    bedMass: 'كتلة الطور', volume: 'حجم الخرطوشة', format: 'الشكل',
    length: 'الطول', innerDia: 'القطر الداخلي', particle: 'حجم الجُسيمات', pore: 'حجم المسام', film: 'سُمك الغشاء',
    brand: 'العلامة التجارية', qty: 'الكمية', optional: '(اختياري)', noPref: 'بدون تفضيل',
    partNumber: 'رقم القطعة لدى الصانع', partNumberPh: 'مثال: 186002350', refShort: 'رقم',
    add: 'أضِف إلى العرض', added: 'تمت الإضافة', pick: '— اختر —',
    dec: 'إنقاص الكمية', inc: 'زيادة الكمية',
    summary: 'عمودك', goQuote: 'عرض طلب السعر',
    hint: 'تُختار جميع الحقول من قوائم؛ اضبط الكمية بـ − و +. إن كنت تعرف رقم القطعة لدى الصانع فأضِفه.',
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
  const [bedMass, setBedMass] = useState('')
  const [volume, setVolume] = useState('')
  const [format, setFormat] = useState('')
  const [brand, setBrand] = useState('')
  const [partNumber, setPartNumber] = useState('')
  const [qty, setQty] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const lenUnit = type === 'HPLC' ? 'mm' : 'm'

  const valid = useMemo(() => {
    if (!phase) return false
    if (type === 'SPE') return !!bedMass && !!volume
    if (!length || !innerDia) return false
    return type === 'HPLC' ? !!particle : !!film
  }, [phase, length, innerDia, particle, film, bedMass, volume, type])

  // Each type has its own dimension lists — switching invalidates them all.
  function switchType(v: ColType) {
    setType(v)
    setPhase(''); setLength(''); setInnerDia(''); setParticle(''); setPore(''); setFilm('')
    setBedMass(''); setVolume(''); setFormat('')
  }

  function reset() {
    setPhase(''); setLength(''); setInnerDia(''); setParticle(''); setPore(''); setFilm('')
    setBedMass(''); setVolume(''); setFormat('')
    setBrand(''); setPartNumber(''); setQty(1)
  }

  function buildName(): string {
    const dims =
      type === 'SPE'  ? [bedMass, volume, format].filter(Boolean).join(' · ')
      : type === 'HPLC' ? [`${length} × ${innerDia} mm`, `${particle} µm`, pore ? `${pore} Å` : ''].filter(Boolean).join(' · ')
      :                   [`${length} m × ${innerDia} mm`, `film ${film} µm`].filter(Boolean).join(' · ')
    const head = type === 'SPE'
      ? `SPE ${phase}`
      : `${locale === 'fr' ? 'Colonne' : locale === 'ar' ? 'عمود' : 'Column'} ${type} ${phase}`
    const ref = partNumber.trim() ? `${t.refShort} ${partNumber.trim()}` : ''
    return [head, dims, brand, ref].filter(Boolean).join(' — ')
  }

  function onAdd() {
    if (!valid) return
    const parts = type === 'SPE'
      ? ['spe', phase, bedMass, volume, format]
      : ['col', type, phase, length, innerDia, type === 'HPLC' ? particle : film, pore]
    const slug = slugify([...parts, brand, partNumber.trim()].join('-'))
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
        {(['HPLC', 'GC', 'SPE'] as ColType[]).map((v) => (
          <button key={v} type="button" onClick={() => switchType(v)}
            className={`rounded-md px-5 py-1.5 text-sm font-semibold transition ${type === v ? 'bg-brand text-white' : 'text-muted-foreground hover:text-foreground'}`}>
            {v}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Phase (or sorbent for SPE) — full width */}
        <div className={`${field} sm:col-span-2`}>
          <Label>{type === 'SPE' ? t.sorbent : t.phase} *</Label>
          <select className={selectCls} value={phase} onChange={(e) => setPhase(e.target.value)}>
            <option value="">{t.pick}</option>
            {PHASES[type].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {type === 'SPE' ? (
          <>
            <Picker label={t.bedMass} value={bedMass} onChange={setBedMass} options={BED_MASSES} placeholder={t.pick} />
            <Picker label={t.volume}  value={volume}  onChange={setVolume}  options={SPE_VOLUMES} placeholder={t.pick} />
            <Picker label={`${t.format} ${t.optional}`} value={format} onChange={setFormat} options={SPE_FORMATS_FR} optional placeholder={t.noPref} />
          </>
        ) : (
          <>
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
          </>
        )}

        <Picker label={`${t.brand} ${t.optional}`} value={brand} onChange={setBrand} options={BRANDS} optional placeholder={t.noPref} />

        {/* Manufacturer part number — optional free text (the client may know the exact reference) */}
        <div className={field}>
          <Label htmlFor="col-pn">{t.partNumber} {t.optional}</Label>
          <Input id="col-pn" value={partNumber} placeholder={t.partNumberPh}
                 onChange={(e) => setPartNumber(e.target.value)} maxLength={60} />
        </div>

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
