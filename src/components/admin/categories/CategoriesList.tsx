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
import { IconGripVertical, IconPencil, IconTrash } from '@tabler/icons-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteCategory, reorderCategories } from '@/lib/actions/categories'

export type CategoryRow = {
  id: string
  name: string
  slug: string
  color: string | null
  icon: string | null
  isPublished: boolean
  productCount: number
  subCategoryCount: number
}

export function CategoriesList({ items: initial }: { items: CategoryRow[] }) {
  const [items, setItems] = useState(initial)
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
      const res = await reorderCategories(next.map((c) => c.id))
      if (!res.ok) { toast.error(res.error); setItems(initial) }
      else toast.success('Ordre mis à jour')
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-border">
            {items.map((it) => <Row key={it.id} item={it} disabled={pending} />)}
          </ul>
        </SortableContext>
      </DndContext>
      {items.length === 0 && (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          Aucune catégorie. Cliquez sur « Nouveau » pour en créer une.
        </div>
      )}
    </div>
  )
}

function Row({ item, disabled }: { item: CategoryRow; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [deletePending, startDelete] = useTransition()
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }

  function onDelete() {
    if (!confirm(`Supprimer la catégorie « ${item.name} » ?\n(${item.productCount} produit(s) la perdront)`)) return
    startDelete(async () => {
      const res = await deleteCategory(item.id)
      if (!res.ok) toast.error(res.error); else toast.success('Catégorie supprimée')
    })
  }

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40">
      <button {...attributes} {...listeners} type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Réordonner">
        <IconGripVertical size={18} />
      </button>

      <div
        className="h-3 w-3 shrink-0 rounded-full border border-black/10"
        style={{ backgroundColor: item.color ?? '#cbd5e1' }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.name}</span>
          {!item.isPublished && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
              Brouillon
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5">/{item.slug}</code>
          {' · '}{item.subCategoryCount} sous-catégorie{item.subCategoryCount > 1 ? 's' : ''}
          {' · '}{item.productCount} produit{item.productCount > 1 ? 's' : ''}
        </div>
      </div>

      <Link
        href={`/admin/categories/${item.id}/edit`}
        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Éditer">
        <IconPencil size={16} />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deletePending || disabled}
        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        title="Supprimer">
        <IconTrash size={16} />
      </button>
    </li>
  )
}
