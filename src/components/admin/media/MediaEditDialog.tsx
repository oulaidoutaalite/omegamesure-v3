'use client'

import { IconTrash } from '@tabler/icons-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

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
import { Label } from '@/components/ui/label'
import { deleteMedia, updateMedia } from '@/lib/actions/media'

import { type MediaRow } from './MediaGrid'

type Props = {
  open: boolean
  media: MediaRow
  onClose: () => void
  onSaved: (patch: Partial<MediaRow> & { id: string }) => void
  onDeleted: () => void
}

export function MediaEditDialog({ open, media, onClose, onSaved, onDeleted }: Props) {
  const [alt,    setAlt]    = useState(media.alt ?? '')
  const [folder, setFolder] = useState(media.folder ?? '')
  const [tagsRaw, setTagsRaw] = useState<string>('')
  const [pending, startTransition] = useTransition()
  const [deletePending, startDelete] = useTransition()

  function onSave() {
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20)

    startTransition(async () => {
      const res = await updateMedia({
        id: media.id,
        alt,
        folder,
        tags: tags.length ? tags : undefined,
      })
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Média mis à jour')
      onSaved({ id: media.id, alt: alt || null, folder: folder || null })
      onClose()
    })
  }

  function onDelete() {
    if (!confirm('Supprimer définitivement ce média ?')) return
    startDelete(async () => {
      const res = await deleteMedia(media.id)
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Média supprimé')
      onDeleted()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="truncate">{media.originalName}</DialogTitle>
        </DialogHeader>

        <DialogBody>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-border bg-muted">
              {media.type === 'IMAGE' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.url} alt={media.alt ?? media.originalName}
                     className="h-auto w-full object-contain" />
              ) : (
                <div className="grid h-64 place-items-center text-sm text-muted-foreground">
                  {media.mimeType}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alt">Texte alternatif</Label>
                <Input id="alt" value={alt} onChange={(e) => setAlt(e.target.value)}
                       placeholder="Description de l'image" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="folder">Dossier</Label>
                <Input id="folder" value={folder} onChange={(e) => setFolder(e.target.value)}
                       placeholder="ex: products, hero, brands" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                <Input id="tags" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)}
                       placeholder="hplc, balance, …" />
              </div>

              <dl className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-3 text-xs">
                <dt className="text-muted-foreground">Type</dt>
                <dd>{media.mimeType}</dd>
                <dt className="text-muted-foreground">Taille</dt>
                <dd>{(media.size / 1024).toFixed(0)} Ko</dd>
                {media.width && media.height && (
                  <>
                    <dt className="text-muted-foreground">Dimensions</dt>
                    <dd>{media.width} × {media.height}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">URL</dt>
                <dd className="truncate">
                  <a href={media.url} target="_blank" rel="noreferrer" className="text-brand underline">
                    {media.url}
                  </a>
                </dd>
              </dl>
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" type="button"
                  onClick={onDelete} disabled={deletePending}
                  className="mr-auto text-destructive hover:bg-destructive/10">
            <IconTrash size={14} /> Supprimer
          </Button>
          <Button variant="outline" type="button" onClick={onClose}>Annuler</Button>
          <Button type="button" onClick={onSave} disabled={pending}>
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
