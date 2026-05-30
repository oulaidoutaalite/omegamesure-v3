'use client'

import {
  IconCheck,
  IconFileTypePdf,
  IconPhoto,
  IconPlus,
  IconStar,
  IconStarFilled,
  IconTrash,
} from '@tabler/icons-react'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { MediaGrid, type MediaRow } from '@/components/admin/media/MediaGrid'
import { MediaUploader } from '@/components/admin/media/MediaUploader'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { type UploadedMedia } from '@/lib/actions/media'

export type PickedItem = {
  url: string
  alt?: string
  isPrimary?: boolean
}

type Props = {
  label?: string
  multiple?: boolean
  /** Restrict to media TYPE for filtering (IMAGE for picture pickers, DOCUMENT for PDFs). */
  accept?: 'IMAGE' | 'DOCUMENT'
  value: PickedItem[]
  onChange: (next: PickedItem[]) => void
  /** Suggested folder for new uploads. */
  folder?: string
}

/**
 * Reusable media picker for forms.
 * Renders a horizontal preview strip + a modal to browse / upload / select.
 */
export function MediaPicker({
  label = 'Médias',
  multiple = true,
  accept,
  value,
  onChange,
  folder,
}: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (accept) params.set('type', accept)
        if (search) params.set('search', search)
        const res = await fetch(`/api/media/list?${params.toString()}`)
        if (!res.ok) throw new Error('Erreur de chargement')
        const data: { rows: MediaRow[] } = await res.json()
        if (!cancelled) setItems(data.rows)
      } catch (err) {
        if (!cancelled) toast.error((err as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, accept, search])

  const selectedUrls = new Set(value.map((v) => v.url))

  function toggleSelect(item: MediaRow) {
    if (selectedUrls.has(item.url)) {
      onChange(value.filter((v) => v.url !== item.url))
      return
    }
    if (!multiple) {
      onChange([{ url: item.url, alt: item.alt ?? '', isPrimary: true }])
      setOpen(false)
      return
    }
    const isFirst = value.length === 0
    onChange([
      ...value,
      { url: item.url, alt: item.alt ?? '', isPrimary: isFirst },
    ])
  }

  function onUploaded(uploaded: UploadedMedia[]) {
    const newRows: MediaRow[] = uploaded.map((u) => ({
      id: u.id, url: u.url, type: u.type as MediaRow['type'],
      originalName: u.originalName, mimeType: u.mimeType, size: u.size,
      width: u.width, height: u.height, folder: u.folder, alt: u.alt,
      createdAt: new Date(),
    }))
    setItems((prev) => [...newRows, ...prev])
    // Auto-select uploads
    onChange([
      ...value,
      ...newRows
        .filter((r) => !accept || r.type === accept)
        .map((r, i) => ({
          url: r.url,
          alt: '',
          isPrimary: value.length === 0 && i === 0,
        })),
    ])
  }

  function removePick(url: string) {
    const next = value.filter((v) => v.url !== url)
    // Ensure one item stays primary
    if (next.length && !next.some((v) => v.isPrimary)) next[0].isPrimary = true
    onChange(next)
  }

  function setPrimary(url: string) {
    onChange(value.map((v) => ({ ...v, isPrimary: v.url === url })))
  }

  function setAlt(url: string, alt: string) {
    onChange(value.map((v) => (v.url === url ? { ...v, alt } : v)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <IconPlus size={14} /> {value.length === 0 ? 'Ajouter' : 'Modifier'}
        </Button>
      </div>

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full flex-col items-center gap-1 rounded-xl border border-dashed border-border bg-muted/30 p-8 text-sm text-muted-foreground hover:border-brand hover:bg-brand/5"
        >
          {accept === 'DOCUMENT' ? <IconFileTypePdf size={24} /> : <IconPhoto size={24} />}
          Aucun média sélectionné — cliquez pour ajouter
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {value.map((p) => (
            <li
              key={p.url}
              className="group relative overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="aspect-square bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.alt ?? ''} className="h-full w-full object-cover" />
              </div>

              <div className="space-y-1 px-2 py-2">
                <Input
                  value={p.alt ?? ''}
                  onChange={(e) => setAlt(p.url, e.target.value)}
                  placeholder="Alt"
                  className="h-7 text-xs"
                />
              </div>

              <div className="absolute right-1 top-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => setPrimary(p.url)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-amber-500"
                  title={p.isPrimary ? 'Image principale' : 'Définir comme principale'}
                >
                  {p.isPrimary ? <IconStarFilled size={12} /> : <IconStar size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => removePick(p.url)}
                  className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-destructive"
                  title="Retirer"
                >
                  <IconTrash size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Choisir des médias</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <MediaUploader folder={folder} onUploaded={onUploaded}
                             accept={accept === 'DOCUMENT' ? 'application/pdf,application/*' : 'image/*'} />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
              />

              {loading ? (
                <div className="grid place-items-center py-12 text-sm text-muted-foreground">
                  Chargement…
                </div>
              ) : (
                <MediaGrid
                  items={items}
                  folders={[]}
                  total={items.length}
                  selectable
                  selectedIds={items.filter((i) => selectedUrls.has(i.url)).map((i) => i.id)}
                  onSelectToggle={(item) => toggleSelect(item)}
                  readOnly
                />
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <div className="mr-auto flex items-center gap-2">
              <IconCheck size={14} className="text-brand" />
              <span className="text-xs text-muted-foreground">
                {value.length} sélectionné{value.length > 1 ? 's' : ''}
              </span>
            </div>
            <Button type="button" onClick={() => setOpen(false)}>Terminer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
