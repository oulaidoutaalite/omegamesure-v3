'use client'

import { IconUpload, IconX } from '@tabler/icons-react'
import {
  useCallback,
  useRef,
  useState,
  useTransition,
  type DragEvent,
  type ChangeEvent,
} from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { uploadMedia, type UploadedMedia } from '@/lib/actions/media'
import { cn } from '@/lib/utils'

type Props = {
  folder?: string
  /** Called after a successful upload. Parent can refresh its list. */
  onUploaded?: (items: UploadedMedia[]) => void
  /** Restrict accepted MIME (default: any allowed). */
  accept?: string
  /** Hide the visible drop zone — only show the button trigger. */
  compact?: boolean
  className?: string
}

export function MediaUploader({ folder, onUploaded, accept, compact, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleFiles = useCallback(
    (files: FileList | File[] | null) => {
      if (!files || files.length === 0) return
      const fd = new FormData()
      if (folder) fd.set('folder', folder)
      for (const f of Array.from(files)) fd.append('files', f)

      startTransition(async () => {
        const res = await uploadMedia(fd)
        if (!res.ok) { toast.error(res.error); return }
        const { uploaded, errors } = res.data
        if (uploaded.length > 0) {
          toast.success(`${uploaded.length} fichier(s) téléversé(s)`)
          onUploaded?.(uploaded)
        }
        for (const e of errors) toast.error(`${e.name} : ${e.error}`)
        if (inputRef.current) inputRef.current.value = ''
      })
    },
    [folder, onUploaded],
  )

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files)
  }
  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }
  function onDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(true)
  }
  function onDragLeave() { setDragOver(false) }

  if (compact) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={onChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
        >
          <IconUpload size={14} /> {pending ? 'Téléversement…' : 'Téléverser'}
        </Button>
      </div>
    )
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition',
        dragOver
          ? 'border-brand bg-brand/5'
          : 'border-border bg-muted/30 hover:border-brand/50',
        pending && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <IconUpload size={28} className="text-muted-foreground" />
      <p className="text-sm font-medium">Glissez vos fichiers ici, ou</p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={onChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? 'Téléversement…' : 'Sélectionner des fichiers'}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Images (jpg, png, webp, avif, svg) ou documents (pdf, doc, xls)
        {folder && <> · dossier <code className="rounded bg-muted px-1.5 py-0.5">{folder}</code></>}
      </p>
    </div>
  )
}

/** Compact close button shared by uploader UIs. */
export function MediaUploaderError({ name, onClear }: { name: string; onClear: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <span className="flex-1 truncate">{name}</span>
      <button type="button" onClick={onClear} aria-label="Effacer">
        <IconX size={14} />
      </button>
    </div>
  )
}
