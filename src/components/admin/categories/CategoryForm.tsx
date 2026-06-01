'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { TranslationsEditor, type LocaleDef } from '@/components/admin/i18n/TranslationsEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createCategory, updateCategory } from '@/lib/actions/categories'
import { categorySchema, type CategoryInput } from '@/lib/validations/category'

type Mode = { type: 'create' } | { type: 'edit'; id: string }

type Props = {
  mode: Mode
  defaultValues?: Partial<CategoryInput>
  navItemOptions: Array<{ id: string; label: string }>
  translatableLocales?: LocaleDef[]
}

export function CategoryForm({ mode, defaultValues, navItemOptions, translatableLocales = [] }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name:            defaultValues?.name            ?? '',
      slug:            defaultValues?.slug            ?? '',
      description:     defaultValues?.description     ?? '',
      icon:            defaultValues?.icon            ?? '',
      color:           defaultValues?.color           ?? '#185FA5',
      heroImageUrl:    defaultValues?.heroImageUrl    ?? '',
      navItemId:       defaultValues?.navItemId       ?? null,
      isPublished:     defaultValues?.isPublished     ?? true,
      metaTitle:       defaultValues?.metaTitle       ?? '',
      metaDescription: defaultValues?.metaDescription ?? '',
      translations:    (defaultValues?.translations as Record<string, Record<string, string>> | undefined) ?? undefined,
    },
  })

  const isPublished  = watch('isPublished')
  const translations = (watch('translations') as Record<string, Record<string, string>>) ?? {}

  function onSubmit(data: CategoryInput) {
    startTransition(async () => {
      const res =
        mode.type === 'create'
          ? await createCategory(data)
          : await updateCategory({ id: mode.id, ...data })

      if (!res.ok) { toast.error(res.error); return }
      toast.success(mode.type === 'create' ? 'Catégorie créée' : 'Catégorie mise à jour')
      if (mode.type === 'create' && res.ok) {
        router.push(`/admin/categories/${res.data.id}/edit`)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Nom *</Label>
          <Input id="name" placeholder="Équipements labo & biomédicales" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" placeholder="equipements-labo" {...register('slug')} />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="navItemId">Item de navigation lié</Label>
          <select id="navItemId" className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" {...register('navItemId')}>
            <option value="">— Aucun</option>
            {navItemOptions.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} {...register('description')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">Icône Tabler</Label>
          <Input id="icon" placeholder="IconFlask" {...register('icon')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="color">Couleur (hex)</Label>
          <div className="flex gap-2">
            <Input id="color" type="text" {...register('color')} className="flex-1" />
            <input type="color" value={watch('color') || '#185FA5'}
                   onChange={(e) => setValue('color', e.target.value, { shouldDirty: true })}
                   className="h-10 w-12 cursor-pointer rounded-md border border-input" />
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="heroImageUrl">Image hero (URL)</Label>
          <Input id="heroImageUrl" placeholder="/uploads/categories/labo-hero.jpg" {...register('heroImageUrl')} />
        </div>
      </div>

      <details className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
        <summary className="cursor-pointer font-medium">SEO</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="metaTitle">Meta title</Label>
            <Input id="metaTitle" {...register('metaTitle')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="metaDescription">Meta description</Label>
            <Textarea id="metaDescription" rows={2} {...register('metaDescription')} />
          </div>
        </div>
      </details>

      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <Switch checked={isPublished} onCheckedChange={(v) => setValue('isPublished', v, { shouldDirty: true })} />
        <div>
          <div className="text-sm font-medium">Publiée</div>
          <div className="text-[11px] text-muted-foreground">Visible sur le site public</div>
        </div>
      </label>

      {translatableLocales.length > 0 && (
        <TranslationsEditor
          locales={translatableLocales}
          fields={[
            { key: 'name',        label: 'Nom',         type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
          ]}
          value={translations}
          onChange={(v) => setValue('translations', v, { shouldDirty: true })}
        />
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Annuler</Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : mode.type === 'create' ? 'Créer' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
