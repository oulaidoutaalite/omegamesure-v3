'use client'

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  IconCheck,
  IconGripVertical,
  IconPencil,
  IconPlus,
  IconStar,
  IconStarFilled,
  IconTrash,
  IconX,
} from '@tabler/icons-react'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { TranslationsEditor, type LocaleDef } from '@/components/admin/i18n/TranslationsEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  createSubCategory,
  deleteSubCategory,
  moveSubCategory,
  reorderSubCategories,
  updateSubCategory,
} from '@/lib/actions/categories'
import { subCategorySchema, type SubCategoryInput } from '@/lib/validations/category'
import { slugify } from '@/lib/utils'

export type SubRow = {
  id: string
  name: string
  slug: string
  description: string | null
  isPublished: boolean
  isAutresSlot: boolean
  translations?: Record<string, Record<string, string>> | null
}

type Props = {
  categoryId: string
  items: SubRow[]
  translatableLocales?: LocaleDef[]
  categories?: Array<{ id: string; name: string }>
}

export function SubCategoriesSection({ categoryId, items: initial, translatableLocales = [], categories = [] }: Props) {
  const [items, setItems] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return
    const oldIdx = items.findIndex((i) => i.id === e.active.id)
    const newIdx = items.findIndex((i) => i.id === e.over!.id)
    if (oldIdx < 0 || newIdx < 0) return
    const next = arrayMove(items, oldIdx, newIdx)
    setItems(next)
    startTransition(async () => {
      const res = await reorderSubCategories(categoryId, next.map((i) => i.id))
      if (!res.ok) { toast.error(res.error); setItems(initial) }
      else toast.success('Ordre mis à jour')
    })
  }

  function onCreated(row: SubRow) {
    setItems((prev) => [...prev, row])
    setCreating(false)
  }
  function onUpdated(row: SubRow) {
    setItems((prev) => prev.map((i) => (i.id === row.id ? row : i)))
    setEditingId(null)
  }
  function onDeleted(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }
  function onMoved(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Sous-catégories</h2>
        {!creating && (
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <IconPlus size={16} /> Ajouter
          </Button>
        )}
      </header>

      <div className="rounded-xl border border-border bg-card">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-border">
              {items.map((it) =>
                editingId === it.id ? (
                  <li key={it.id} className="bg-accent/30 p-4">
                    <SubForm
                      categoryId={categoryId}
                      initialValue={it}
                      onCancel={() => setEditingId(null)}
                      onSaved={onUpdated}
                      translatableLocales={translatableLocales}
                    />
                  </li>
                ) : (
                  <Row key={it.id} item={it} disabled={pending}
                       categories={categories}
                       onEdit={() => setEditingId(it.id)}
                       onDeleted={onDeleted}
                       onMoved={onMoved} />
                ),
              )}
              {creating && (
                <li className="bg-accent/30 p-4">
                  <SubForm
                    categoryId={categoryId}
                    onCancel={() => setCreating(false)}
                    onSaved={onCreated}
                    translatableLocales={translatableLocales}
                  />
                </li>
              )}
            </ul>
          </SortableContext>
        </DndContext>

        {items.length === 0 && !creating && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Aucune sous-catégorie. Cliquez sur « Ajouter » pour en créer.
          </div>
        )}
      </div>
    </div>
  )
}

function Row({
  item, disabled, categories, onEdit, onDeleted, onMoved,
}: {
  item: SubRow
  disabled: boolean
  categories: Array<{ id: string; name: string }>
  onEdit: () => void
  onDeleted: (id: string) => void
  onMoved: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [deletePending, startDelete] = useTransition()
  const [moving, startMove] = useTransition()
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

  function onDelete() {
    if (!confirm(`Supprimer « ${item.name} » ?`)) return
    startDelete(async () => {
      const res = await deleteSubCategory(item.id)
      if (!res.ok) toast.error(res.error)
      else { toast.success('Supprimée'); onDeleted(item.id) }
    })
  }

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40">
      <button {...attributes} {...listeners} type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Réordonner">
        <IconGripVertical size={18} />
      </button>

      {item.isAutresSlot ? (
        <IconStarFilled size={14} className="text-amber-500" />
      ) : (
        <IconStar size={14} className="text-muted-foreground/30" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.name}</span>
          {!item.isPublished && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">Masquée</span>
          )}
          {item.isAutresSlot && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
              « Autres »
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5">/{item.slug}</code>
          {item.description && <> · {item.description.slice(0, 60)}{item.description.length > 60 && '…'}</>}
        </div>
      </div>

      {categories.length > 0 && (
        <select
          aria-label="Déplacer vers une autre catégorie"
          title="Déplacer cette sous-catégorie (et ses produits) vers une autre catégorie"
          disabled={moving || disabled}
          value=""
          onChange={(e) => {
            const target = e.target.value
            if (!target) return
            const cat = categories.find((c) => c.id === target)
            if (!confirm(`Déplacer « ${item.name} » et tous ses produits vers « ${cat?.name} » ?`)) return
            startMove(async () => {
              const res = await moveSubCategory({ id: item.id, targetCategoryId: target })
              if (!res.ok) toast.error(res.error)
              else {
                toast.success(`Déplacée vers ${cat?.name}${res.data.moved ? ` · ${res.data.moved} produits` : ''}`)
                onMoved(item.id)
              }
            })
          }}
          className="h-8 max-w-[150px] shrink-0 rounded-md border border-input bg-background px-2 text-xs text-muted-foreground disabled:opacity-50"
        >
          <option value="">Déplacer vers…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      <button onClick={onEdit} type="button"
        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Éditer">
        <IconPencil size={16} />
      </button>
      <button onClick={onDelete} type="button" disabled={deletePending || disabled}
        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        title="Supprimer">
        <IconTrash size={16} />
      </button>
    </li>
  )
}

function SubForm({
  categoryId,
  initialValue,
  onCancel,
  onSaved,
  translatableLocales,
}: {
  categoryId: string
  initialValue?: SubRow
  onCancel: () => void
  onSaved: (row: SubRow) => void
  translatableLocales: LocaleDef[]
}) {
  const isEdit = !!initialValue
  const [pending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SubCategoryInput>({
    resolver: zodResolver(subCategorySchema),
    defaultValues: {
      categoryId,
      name:         initialValue?.name        ?? '',
      slug:         initialValue?.slug        ?? '',
      description:  initialValue?.description ?? '',
      icon:         '',
      imageUrl:     '',
      isPublished:  initialValue?.isPublished ?? true,
      isAutresSlot: initialValue?.isAutresSlot ?? false,
      translations: (initialValue?.translations as Record<string, Record<string, string>> | undefined) ?? undefined,
    },
  })

  const name         = watch('name')
  const isPublished  = watch('isPublished')
  const isAutresSlot = watch('isAutresSlot')
  const translations = (watch('translations') as Record<string, Record<string, string>>) ?? {}

  function onSubmit(data: SubCategoryInput) {
    startTransition(async () => {
      const res = isEdit
        ? await updateSubCategory({ id: initialValue!.id, ...data })
        : await createSubCategory(data)
      if (!res.ok) { toast.error(res.error); return }
      toast.success(isEdit ? 'Mise à jour' : 'Sous-catégorie créée')
      onSaved({
        id: isEdit ? initialValue!.id : (res as { data: { id: string } }).data.id,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        isPublished: data.isPublished,
        isAutresSlot: data.isAutresSlot,
        translations: data.translations ?? null,
      })
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Input placeholder="Nom de la sous-catégorie" {...register('name')}
                 onBlur={(e) => { if (!watch('slug')) setValue('slug', slugify(e.target.value)) }} />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <Input placeholder="slug" {...register('slug')} />
          {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
        </div>
      </div>

      <Textarea rows={2} placeholder="Description (optionnel)" {...register('description')} />

      {translatableLocales.length > 0 && (
        <TranslationsEditor
          locales={translatableLocales}
          fields={[
            { key: 'name',        label: 'Nom',         type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea', rows: 2 },
          ]}
          value={translations}
          onChange={(v) => setValue('translations', v, { shouldDirty: true })}
        />
      )}

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Switch checked={isPublished}
                  onCheckedChange={(v) => setValue('isPublished', v, { shouldDirty: true })} />
          Publiée
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <Switch checked={isAutresSlot}
                  onCheckedChange={(v) => setValue('isAutresSlot', v, { shouldDirty: true })} />
          Slot « Autres »
        </label>

        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={pending}>
            <IconX size={14} /> Annuler
          </Button>
          <Button type="submit" size="sm" disabled={pending}>
            <IconCheck size={14} /> {pending ? '…' : isEdit ? 'Sauver' : 'Créer'}
          </Button>
        </div>
      </div>
    </form>
  )
}
