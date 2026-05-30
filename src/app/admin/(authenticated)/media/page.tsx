import { MediaGrid, type MediaRow } from '@/components/admin/media/MediaGrid'
import { listMedia } from '@/lib/actions/media'
import { requireAuth } from '@/lib/auth-helpers'

export const metadata = { title: 'Médias' }
export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  await requireAuth()

  const { rows, total, folders } = await listMedia({ perPage: 60 })
  const items: MediaRow[] = rows.map((r) => ({
    id: r.id, url: r.url, type: r.type, originalName: r.originalName,
    mimeType: r.mimeType, size: r.size, width: r.width, height: r.height,
    folder: r.folder, alt: r.alt, createdAt: r.createdAt,
  }))

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Bibliothèque médias</h1>
        <p className="text-sm text-muted-foreground">
          Images, PDF et documents. Glissez-déposez pour téléverser, cliquez pour éditer.
        </p>
      </header>

      <MediaGrid items={items} folders={folders} total={total} />
    </div>
  )
}
