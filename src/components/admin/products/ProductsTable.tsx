'use client'

import {
  IconPencil,
  IconPhoto,
  IconSearch,
  IconStar,
  IconStarFilled,
  IconTrash,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import {
  deleteProduct,
  toggleProductFeatured,
  toggleProductPublish,
} from '@/lib/actions/products'
import { cn } from '@/lib/utils'

export type ProductRow = {
  id: string
  name: string
  slug: string
  brand: string | null
  model: string | null
  price: number | null
  currency: string
  primaryImageUrl: string | null
  isPublished: boolean
  isFeatured: boolean
  categoryName: string | null
  categoryColor: string | null
  subCategoryName: string | null
  updatedAt: string
}

type Props = {
  items: ProductRow[]
  total: number
  categories: Array<{ id: string; name: string }>
}

export function ProductsTable({ items: initial, total, categories }: Props) {
  const [rows, setRows]           = useState(initial)
  const [search, setSearch]       = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
  const [status, setStatus]       = useState<'all' | 'published' | 'draft'>('all')

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status === 'published' && !r.isPublished) return false
      if (status === 'draft'     &&  r.isPublished) return false
      if (categoryId) {
        const found = initial.find((x) => x.id === r.id)
        if (!found?.categoryName) return false
        const cat = categories.find((c) => c.id === categoryId)
        if (cat && found.categoryName !== cat.name) return false
      }
      if (search) {
        const q = search.toLowerCase()
        const hay = `${r.name} ${r.brand ?? ''} ${r.model ?? ''} ${r.slug}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, search, categoryId, status, initial, categories])

  function patchRow(id: string, patch: Partial<ProductRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function dropRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <IconSearch size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Rechercher (nom, marque, slug)…" className="pl-9" />
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="ml-auto inline-flex rounded-lg border border-border bg-card text-xs">
          {([
            { v: 'all',       l: 'Tous' },
            { v: 'published', l: 'Publiés' },
            { v: 'draft',     l: 'Brouillons' },
          ] as const).map((opt) => (
            <button key={opt.v} type="button" onClick={() => setStatus(opt.v)}
              className={cn(
                'px-3 py-1.5',
                status === opt.v ? 'bg-brand text-white' : 'text-muted-foreground hover:bg-accent',
              )}>
              {opt.l}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground">
          {filtered.length} / {total}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Produit</th>
              <th className="px-4 py-3 text-left font-medium">Catégorie</th>
              <th className="px-4 py-3 text-left font-medium">Prix</th>
              <th className="px-4 py-3 text-center font-medium">Pub.</th>
              <th className="px-4 py-3 text-center font-medium">★</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => (
              <Row key={r.id} row={r} onPatch={patchRow} onDrop={dropRow} />
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                Aucun produit ne correspond.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({
  row, onPatch, onDrop,
}: { row: ProductRow; onPatch: (id: string, p: Partial<ProductRow>) => void; onDrop: (id: string) => void }) {
  const [pubPending, startPub] = useTransition()
  const [featPending, startFeat] = useTransition()
  const [delPending, startDel] = useTransition()

  function togglePub() {
    startPub(async () => {
      const res = await toggleProductPublish(row.id)
      if (!res.ok) toast.error(res.error)
      else { onPatch(row.id, { isPublished: res.data.isPublished }); toast.success(res.data.isPublished ? 'Publié' : 'Dépublié') }
    })
  }
  function toggleFeat() {
    startFeat(async () => {
      const res = await toggleProductFeatured(row.id)
      if (!res.ok) toast.error(res.error)
      else onPatch(row.id, { isFeatured: res.data.isFeatured })
    })
  }
  function onDelete() {
    if (!confirm(`Supprimer « ${row.name} » ?`)) return
    startDel(async () => {
      const res = await deleteProduct(row.id)
      if (!res.ok) toast.error(res.error)
      else { toast.success('Produit supprimé'); onDrop(row.id) }
    })
  }

  return (
    <tr className="hover:bg-accent/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
            {row.primaryImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.primaryImageUrl} alt={row.name} className="h-full w-full object-cover" />
            ) : (
              <IconPhoto size={16} className="text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate font-medium">{row.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {row.brand || row.model ? `${row.brand ?? ''} ${row.model ?? ''}`.trim() + ' · ' : ''}
              <code className="rounded bg-muted px-1 py-0.5">/{row.slug}</code>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {row.categoryName ? (
          <div className="flex items-center gap-2">
            {row.categoryColor && (
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.categoryColor }} />
            )}
            <span>{row.categoryName}</span>
            {row.subCategoryName && (
              <span className="text-xs text-muted-foreground">/ {row.subCategoryName}</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm">
        {row.price !== null ? `${row.price.toLocaleString('fr-FR')} ${row.currency}` : '—'}
      </td>
      <td className="px-4 py-3 text-center">
        <Switch checked={row.isPublished} disabled={pubPending} onCheckedChange={togglePub} aria-label="Publication" />
      </td>
      <td className="px-4 py-3 text-center">
        <button type="button" onClick={toggleFeat} disabled={featPending}
                className="text-muted-foreground hover:text-amber-500 disabled:opacity-50">
          {row.isFeatured ? <IconStarFilled size={16} className="text-amber-500" /> : <IconStar size={16} />}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <Link href={`/admin/products/${row.id}/edit`}
              className="inline-grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Éditer">
          <IconPencil size={16} />
        </Link>
        <button type="button" onClick={onDelete} disabled={delPending}
                className="ml-1 inline-grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                title="Supprimer">
          <IconTrash size={16} />
        </button>
      </td>
    </tr>
  )
}
