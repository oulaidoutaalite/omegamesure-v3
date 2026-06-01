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
import { createNavItem, updateNavItem } from '@/lib/actions/nav-items'
import { navItemSchema, type NavItemInput } from '@/lib/validations/nav-item'

type Mode = { type: 'create' } | { type: 'edit'; id: string }

type Props = {
  mode: Mode
  defaultValues?: Partial<NavItemInput>
  parentOptions: Array<{ id: string; label: string }>
  translatableLocales?: LocaleDef[]
}

export function NavItemForm({ mode, defaultValues, parentOptions, translatableLocales = [] }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NavItemInput>({
    resolver: zodResolver(navItemSchema),
    defaultValues: {
      label:       defaultValues?.label       ?? '',
      slug:        defaultValues?.slug        ?? '',
      icon:        defaultValues?.icon        ?? '',
      href:        defaultValues?.href        ?? '',
      parentId:    defaultValues?.parentId    ?? null,
      isPublished: defaultValues?.isPublished ?? true,
      isCta:       defaultValues?.isCta       ?? false,
      translations: (defaultValues?.translations as Record<string, Record<string, string>> | undefined) ?? undefined,
    },
  })

  const isPublished  = watch('isPublished')
  const isCta        = watch('isCta')
  const translations = (watch('translations') as Record<string, Record<string, string>>) ?? {}

  function onSubmit(data: NavItemInput) {
    startTransition(async () => {
      const res =
        mode.type === 'create'
          ? await createNavItem(data)
          : await updateNavItem({ id: mode.id, ...data })

      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(mode.type === 'create' ? 'Item créé' : 'Item mis à jour')
      router.push('/admin/navigation')
      router.refresh()
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="label">Libellé *</Label>
          <Input id="label" placeholder="Équipements labo" {...register('label')} />
          {errors.label && <p className="text-xs text-destructive">{errors.label.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL) *</Label>
          <Input id="slug" placeholder="equipements-labo" {...register('slug')} />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          <p className="text-[11px] text-muted-foreground">a-z, 0-9, tirets uniquement</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">Icône Tabler</Label>
          <Input id="icon" placeholder="IconFlask" {...register('icon')} />
          <p className="text-[11px] text-muted-foreground">
            Nom de l&apos;icône <a className="underline" href="https://tabler.io/icons" target="_blank" rel="noreferrer">tabler.io/icons</a>{' '}
            (ex: <code>IconFlask</code>)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="href">URL personnalisée</Label>
          <Input id="href" placeholder="(optionnel — sinon calculé depuis le slug)" {...register('href')} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="parentId">Parent</Label>
          <select
            id="parentId"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            {...register('parentId')}
          >
            <option value="">— Aucun (item de premier niveau)</option>
            {parentOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Sélectionnez un item parent pour créer un sous-menu.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:gap-8">
        <label className="flex cursor-pointer items-center gap-3">
          <Switch
            checked={isPublished}
            onCheckedChange={(v) => setValue('isPublished', v, { shouldDirty: true })}
          />
          <div>
            <div className="text-sm font-medium">Publié</div>
            <div className="text-[11px] text-muted-foreground">Visible sur le site public</div>
          </div>
        </label>

        <label className="flex cursor-pointer items-center gap-3">
          <Switch
            checked={isCta}
            onCheckedChange={(v) => setValue('isCta', v, { shouldDirty: true })}
          />
          <div>
            <div className="text-sm font-medium">Bouton CTA</div>
            <div className="text-[11px] text-muted-foreground">Mise en avant (ex: « Demander un devis »)</div>
          </div>
        </label>
      </div>

      {translatableLocales.length > 0 && (
        <TranslationsEditor
          locales={translatableLocales}
          fields={[{ key: 'label', label: 'Libellé', type: 'text' }]}
          value={translations}
          onChange={(v) => setValue('translations', v, { shouldDirty: true })}
          defaultOpen={false}
        />
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : mode.type === 'create' ? 'Créer' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
