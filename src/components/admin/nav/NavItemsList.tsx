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
import {
  IconChevronRight,
  IconGripVertical,
  IconPencil,
  IconTrash,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useTransition, useState } from 'react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import {
  deleteNavItem,
  reorderNavItems,
  toggleNavItemPublish,
} from '@/lib/actions/nav-items'

export type NavItemRow = {
  id: string
  label: string
  slug: string
  icon: string | null
  isPublished: boolean
  isCta: boolean
  order: number
  children: NavItemRow[]
}

export function NavItemsList({ items: initial }: { items: NavItemRow[] }) {
  const [items, setItems] = useState(initial)
  const [pending, startTransition] = useTransition()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = items.findIndex((i) => i.id === active.id)
    const newIdx = items.findIndex((i) => i.id === over.id)
    if (oldIdx < 0 || newIdx < 0) return

    const next = arrayMove(items, oldIdx, newIdx)
    setItems(next) // optimistic

    startTransition(async () => {
      const res = await reorderNavItems({
        parentId: null,
        orderedIds: next.map((i) => i.id),
      })
      if (!res.ok) {
        toast.error(res.error)
        setItems(initial)
      } else {
        toast.success('Ordre mis à jour')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <SortableRow key={item.id} item={item} disabled={pending} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {items.length === 0 && (
        <div className="px-5 py-12 text-center text-sm text-muted-foreground">
          Aucun item de navigation. Cliquez sur « Nouveau » pour en créer un.
        </div>
      )}
    </div>
  )
}

function SortableRow({ item, disabled }: { item: NavItemRow; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })
  const [togglePending, startToggle] = useTransition()
  const [deletePending, startDelete] = useTransition()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  }

  function onToggle() {
    startToggle(async () => {
      const res = await toggleNavItemPublish(item.id)
      if (!res.ok) toast.error(res.error)
      else toast.success(res.data.isPublished ? 'Item publié' : 'Item masqué')
    })
  }

  function onDelete() {
    if (!confirm(`Supprimer « ${item.label} » ?`)) return
    startDelete(async () => {
      const res = await deleteNavItem(item.id)
      if (!res.ok) toast.error(res.error)
      else toast.success('Item supprimé')
    })
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label="Glisser pour réordonner"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{item.label}</span>
          {item.isCta && (
            <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
              CTA
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5">/{item.slug}</code>
          {item.icon && <span>· icône: <code>{item.icon}</code></span>}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>{item.isPublished ? 'Publié' : 'Masqué'}</span>
        <Switch
          checked={item.isPublished}
          disabled={togglePending || disabled}
          onCheckedChange={onToggle}
          aria-label="Publication"
        />
      </div>

      <Link
        href={`/admin/navigation/${item.id}/edit`}
        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        title="Éditer"
      >
        <IconPencil size={16} />
      </Link>

      <button
        type="button"
        onClick={onDelete}
        disabled={deletePending}
        className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        title="Supprimer"
      >
        <IconTrash size={16} />
      </button>

      <IconChevronRight size={14} className="text-muted-foreground/40" />
    </li>
  )
}
