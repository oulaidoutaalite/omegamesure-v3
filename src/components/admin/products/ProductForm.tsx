'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconBriefcase, IconPackage } from '@tabler/icons-react'
import { useRouter } from 'next/navigation'
import { useMemo, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { TranslationsEditor, type LocaleDef } from '@/components/admin/i18n/TranslationsEditor'
import { MediaPicker, type PickedItem } from '@/components/admin/media/MediaPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createProduct, updateProduct } from '@/lib/actions/products'
import { slugify } from '@/lib/utils'
import { productSchema, type ProductInput } from '@/lib/validations/product'

type Mode = { type: 'create' } | { type: 'edit'; id: string }

export type CategoryOption = {
  id: string
  name: string
  subCategories: Array<{ id: string; name: string }>
}

type Props = {
  mode: Mode
  defaultValues?: Partial<ProductInput>
  categories: CategoryOption[]
  translatableLocales?: LocaleDef[]
}

export function ProductForm({ mode, defaultValues, categories, translatableLocales = [] }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name:             defaultValues?.name             ?? '',
      slug:             defaultValues?.slug             ?? '',
      kind:             defaultValues?.kind             ?? 'PRODUCT',
      shortDescription: defaultValues?.shortDescription ?? '',
      description:      defaultValues?.description      ?? '',
      brand:            defaultValues?.brand            ?? '',
      model:            defaultValues?.model            ?? '',
      price:            defaultValues?.price            ?? null,
      currency:         defaultValues?.currency         ?? 'MAD',
      categoryId:       defaultValues?.categoryId       ?? null,
      subCategoryId:    defaultValues?.subCategoryId    ?? null,
      images:           defaultValues?.images           ?? [],
      datasheetUrl:     defaultValues?.datasheetUrl     ?? '',
      isPublished:      defaultValues?.isPublished      ?? false,
      isFeatured:       defaultValues?.isFeatured       ?? false,
      metaTitle:        defaultValues?.metaTitle        ?? '',
      metaDescription:  defaultValues?.metaDescription  ?? '',
      translations:     (defaultValues?.translations as Record<string, Record<string, string>> | undefined) ?? undefined,
    },
  })

  const name          = watch('name')
  const slug          = watch('slug')
  const categoryId    = watch('categoryId')
  const subCategoryId = watch('subCategoryId')
  const images        = watch('images') ?? []
  const datasheetUrl  = watch('datasheetUrl')
  const isPublished   = watch('isPublished')
  const isFeatured    = watch('isFeatured')
  const kind          = watch('kind')
  const isService     = kind === 'SERVICE'
  const translations  = (watch('translations') as Record<string, Record<string, string>>) ?? {}

  const availableSubs = useMemo(() => {
    const cat = categories.find((c) => c.id === categoryId)
    return cat?.subCategories ?? []
  }, [categories, categoryId])

  function onSubmit(data: ProductInput) {
    startTransition(async () => {
      const res =
        mode.type === 'create'
          ? await createProduct(data)
          : await updateProduct({ id: mode.id, ...data })

      if (!res.ok) { toast.error(res.error); return }
      toast.success(mode.type === 'create' ? 'Produit créé' : 'Produit mis à jour')
      if (mode.type === 'create' && res.ok) {
        router.push(`/admin/products/${res.data.id}/edit`)
      } else {
        router.refresh()
      }
    })
  }

  const datasheetPicks: PickedItem[] = datasheetUrl
    ? [{ url: datasheetUrl, alt: '', isPrimary: true }]
    : []

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
      {/* Main column */}
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-xl border border-border bg-card p-6">
          <fieldset className="space-y-3">
            <legend className="text-base font-semibold">Type</legend>
            <p className="text-[11px] text-muted-foreground">
              Un <strong>produit</strong> est un bien matériel (équipement, balance, consommable).
              Un <strong>service</strong> est une prestation (étalonnage, qualification, formation, consulting).
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
                <input type="radio" value="PRODUCT"
                       checked={kind === 'PRODUCT'}
                       onChange={() => setValue('kind', 'PRODUCT', { shouldDirty: true })}
                       className="mt-1" />
                <div className="flex items-start gap-2">
                  <IconPackage size={18} className="mt-0.5 text-brand" />
                  <div>
                    <div className="text-sm font-medium">Produit</div>
                    <div className="text-[11px] text-muted-foreground">Bien physique avec photos, marque, modèle, prix.</div>
                  </div>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
                <input type="radio" value="SERVICE"
                       checked={kind === 'SERVICE'}
                       onChange={() => setValue('kind', 'SERVICE', { shouldDirty: true })}
                       className="mt-1" />
                <div className="flex items-start gap-2">
                  <IconBriefcase size={18} className="mt-0.5 text-brand" />
                  <div>
                    <div className="text-sm font-medium">Service</div>
                    <div className="text-[11px] text-muted-foreground">Prestation (métrologie, IQ/OQ/PQ, formation, consulting…).</div>
                  </div>
                </div>
              </label>
            </div>
          </fieldset>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">
            Informations {isService ? 'du service' : 'du produit'}
          </h2>

          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input id="name" {...register('name')}
                   onBlur={(e) => { if (!slug) setValue('slug', slugify(e.target.value), { shouldDirty: true }) }} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" {...register('slug')} />
              {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">{isService ? 'Prestataire / Marque' : 'Marque'}</Label>
              <Input id="brand" {...register('brand')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">{isService ? 'Référence interne' : 'Modèle / Référence'}</Label>
              <Input id="model" {...register('model')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Prix (optionnel)</Label>
              <div className="flex gap-2">
                <Input id="price" type="number" step="0.01" {...register('price', { setValueAs: (v) => v === '' || v === null ? null : Number(v) })} />
                <Input className="w-20" placeholder="MAD" {...register('currency')} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Description courte</Label>
            <Textarea id="shortDescription" rows={2} {...register('shortDescription')} />
            <p className="text-[11px] text-muted-foreground">Affichée sur les cartes / listes (≤ 300 caractères).</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description longue</Label>
            <Textarea id="description" rows={6} {...register('description')} />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <MediaPicker
            label={isService ? 'Images illustrant le service' : 'Images du produit'}
            multiple
            accept="IMAGE"
            folder={isService ? 'services' : 'products'}
            value={images.map((img) => ({ url: img.url, alt: img.alt, isPrimary: img.isPrimary }))}
            onChange={(next) => setValue('images', next.map((n) => ({ url: n.url, alt: n.alt ?? '', isPrimary: !!n.isPrimary })), { shouldDirty: true })}
          />
        </section>

        <section className="rounded-xl border border-border bg-card p-6">
          <MediaPicker
            label={isService ? 'Plaquette / Programme (PDF)' : 'Fiche technique (PDF)'}
            multiple={false}
            accept="DOCUMENT"
            folder={isService ? 'services-docs' : 'datasheets'}
            value={datasheetPicks}
            onChange={(next) => setValue('datasheetUrl', next[0]?.url ?? '', { shouldDirty: true })}
          />
        </section>

        <details className="rounded-xl border border-border bg-card p-6">
          <summary className="cursor-pointer text-sm font-medium">SEO (méta titre / description)</summary>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta title</Label>
              <Input id="metaTitle" {...register('metaTitle')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta description</Label>
              <Textarea id="metaDescription" rows={3} {...register('metaDescription')} />
            </div>
          </div>
        </details>

        {translatableLocales.length > 0 && (
          <TranslationsEditor
            locales={translatableLocales}
            fields={[
              { key: 'name',             label: 'Nom du produit',     type: 'text' },
              { key: 'shortDescription', label: 'Description courte', type: 'textarea', rows: 2 },
              { key: 'description',      label: 'Description longue', type: 'textarea', rows: 6 },
            ]}
            value={translations}
            onChange={(v) => setValue('translations', v, { shouldDirty: true })}
          />
        )}
      </div>

      {/* Sidebar column */}
      <aside className="space-y-6">
        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Publication</h2>

          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <div className="text-sm font-medium">Publié</div>
              <div className="text-[11px] text-muted-foreground">Visible sur le site public</div>
            </span>
            <Switch checked={isPublished} onCheckedChange={(v) => setValue('isPublished', v, { shouldDirty: true })} />
          </label>

          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span>
              <div className="text-sm font-medium">Mis en avant</div>
              <div className="text-[11px] text-muted-foreground">Affiché en home et listes top</div>
            </span>
            <Switch checked={isFeatured} onCheckedChange={(v) => setValue('isFeatured', v, { shouldDirty: true })} />
          </label>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-6">
          <h2 className="text-base font-semibold">Classification</h2>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Catégorie</Label>
            <select id="categoryId"
              value={categoryId ?? ''}
              onChange={(e) => {
                setValue('categoryId', e.target.value || null, { shouldDirty: true })
                setValue('subCategoryId', null, { shouldDirty: true })
              }}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
              <option value="">— Aucune</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {availableSubs.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="subCategoryId">Sous-catégorie</Label>
              <select id="subCategoryId"
                value={subCategoryId ?? ''}
                onChange={(e) => setValue('subCategoryId', e.target.value || null, { shouldDirty: true })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">— Aucune</option>
                {availableSubs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? 'Enregistrement…' : mode.type === 'create' ? 'Créer le produit' : 'Enregistrer'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push('/admin/products')}>
            Annuler
          </Button>
        </div>

        <p className="rounded-lg border border-border bg-muted/30 p-3 text-[11px] text-muted-foreground">
          Astuce&nbsp;: enregistrez d&apos;abord le produit en brouillon, puis activez « Publié » quand tout est prêt.
        </p>
      </aside>
    </form>
  )
}
