'use client'

import {
  IconFile,
  IconFileTypePdf,
  IconFolder,
  IconPhoto,
  IconSearch,
  IconVideo,
  IconX,
} from '@tabler/icons-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { MediaEditDialog } from '@/components/admin/media/MediaEditDialog'
import { MediaUploader } from '@/components/admin/media/MediaUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteMedia } from '@/lib/actions/media'
import { cn } from '@/lib/utils'

export type MediaRow = {
  id: string
  url: string
  type: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'OTHER'
  originalName: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  folder: string | null
  alt: string | null
  createdAt: Date | string
}

type Props = {
  items: MediaRow[]
  folders: Array<{ folder: string; count: number }>
  total: number
  /** Optional selection mode (used by MediaPicker). */
  selectable?: boolean
  selectedIds?: string[]
  onSelectToggle?: (item: MediaRow) => void
  /** Hide the inline editor (used by picker). */
  readOnly?: boolean
}

export function MediaGrid({
  items: initial,
  folders,
  total,
  selectable,
  selectedIds = [],
  onSelectToggle,
  readOnly,
}: Props) {
  const [items, setItems] = useState(initial)
  const [search, setSearch] = useState('')
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'IMAGE' | 'DOCUMENT' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const filtered = items.filter((it) => {
    if (activeFolder !== null && it.folder !== activeFolder) return false
    if (activeType !== null && it.type !== activeType) return false
    if (search && !it.originalName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function appendUploaded(uploaded: MediaRow[]) {
    setItems((prev) => [...uploaded, ...prev])
  }

  function refresh(patch: Partial<MediaRow> & { id: string }) {
    setItems((prev) => prev.map((i) => (i.id === patch.id ? { ...i, ...patch } : i)))
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const editing = editId ? items.find((i) => i.id === editId) ?? null : null

  return (
    <div className="space-y-4">
      {!readOnly && (
        <MediaUploader onUploaded={(uploaded) => appendUploaded(uploaded as MediaRow[])} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <IconSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom…"
            className="pl-9"
          />
        </div>

        <FilterBtn active={activeType === null} onClick={() => setActiveType(null)}>Tout</FilterBtn>
        <FilterBtn active={activeType === 'IMAGE'}    onClick={() => setActiveType('IMAGE')}>Images</FilterBtn>
        <FilterBtn active={activeType === 'DOCUMENT'} onClick={() => setActiveType('DOCUMENT')}>Documents</FilterBtn>

        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} / {total}
        </span>
      </div>

      {folders.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterBtn active={activeFolder === null} onClick={() => setActiveFolder(null)}>
            <IconFolder size={12} /> tous les dossiers
          </FilterBtn>
          {folders.map((f) => (
            <FilterBtn
              key={f.folder}
              active={activeFolder === f.folder}
              onClick={() => setActiveFolder(f.folder)}
            >
              <IconFolder size={12} /> {f.folder} <span className="text-muted-foreground">({f.count})</span>
            </FilterBtn>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Aucun média ne correspond à ces critères.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((m) => {
            const isSelected = selectedIds.includes(m.id)
            return (
              <li
                key={m.id}
                className={cn(
                  'group relative overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md',
                  isSelected && 'ring-2 ring-brand ring-offset-2',
                )}
              >
                <button
                  type="button"
                  className="block aspect-square w-full overflow-hidden bg-muted"
                  onClick={() => {
                    if (selectable) onSelectToggle?.(m)
                    else if (!readOnly) setEditId(m.id)
                  }}
                >
                  <MediaThumb media={m} />
                </button>

                <div className="space-y-0.5 px-2.5 py-2">
                  <p className="truncate text-xs font-medium" title={m.originalName}>
                    {m.originalName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {prettyBytes(m.size)}
                    {m.width && m.height ? ` · ${m.width}×${m.height}` : ''}
                  </p>
                </div>

                {!readOnly && !selectable && (
                  <DeleteOverlay id={m.id} onDeleted={() => remove(m.id)} />
                )}

                {selectable && isSelected && (
                  <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-brand text-white">
                    ✓
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {editing && !readOnly && (
        <MediaEditDialog
          media={editing}
          open
          onClose={() => setEditId(null)}
          onSaved={(patch) => refresh(patch)}
          onDeleted={() => { remove(editing.id); setEditId(null) }}
        />
      )}
    </div>
  )
}

function FilterBtn({
  active, onClick, children,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition',
        active
          ? 'bg-brand text-white'
          : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function MediaThumb({ media }: { media: MediaRow }) {
  if (media.type === 'IMAGE') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={media.url}
        alt={media.alt ?? media.originalName}
        loading="lazy"
        className="h-full w-full object-cover transition group-hover:scale-105"
      />
    )
  }
  const Icon =
    media.type === 'VIDEO' ? IconVideo
    : media.mimeType === 'application/pdf' ? IconFileTypePdf
    : media.type === 'DOCUMENT' ? IconFile
    : IconPhoto
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-muted to-muted/40 text-muted-foreground">
      <Icon size={36} />
    </div>
  )
}

function DeleteOverlay({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const [pending, startTransition] = useTransition()
  function onClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm('Supprimer ce média ?')) return
    startTransition(async () => {
      const res = await deleteMedia(id)
      if (!res.ok) toast.error(res.error)
      else { toast.success('Média supprimé'); onDeleted() }
    })
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-destructive disabled:opacity-50"
      aria-label="Supprimer"
    >
      <IconX size={14} />
    </button>
  )
}

function prettyBytes(n: number): string {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`
  return `${(n / 1024 / 1024).toFixed(1)} Mo`
}
