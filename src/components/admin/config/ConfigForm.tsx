'use client'

import { IconCheck } from '@tabler/icons-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import {
  MediaPicker,
  type PickedItem,
} from '@/components/admin/media/MediaPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { saveConfigEntries } from '@/lib/actions/site-config'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'color'
  | 'boolean'
  | 'image'
  | 'tags' // comma-separated list
  | 'multilang' // single-line text in FR/AR/EN
  | 'multilang-textarea' // multi-line text in FR/AR/EN

export type FieldDef = {
  key: string
  label: string
  helper?: string
  type: FieldType
  placeholder?: string
  rows?: number
  /** For image, suggested upload folder. */
  folder?: string
}

/** The three site locales. The default locale (FR) uses the bare key; AR/EN
 *  use the `<key>.<code>` convention already understood by the public pages. */
const LOCALES: { code: string; label: string; dir?: 'rtl' | 'ltr' }[] = [
  { code: '',   label: 'Français' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English' },
]
const subKey = (key: string, code: string) => (code ? `${key}.${code}` : key)
const isMultilang = (t: FieldType) => t === 'multilang' || t === 'multilang-textarea'

type Props = {
  category: string
  fields: FieldDef[]
  initialValues: Record<string, unknown>
}

export function ConfigForm({ category, fields, initialValues }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const out: Record<string, unknown> = {}
    for (const f of fields) {
      if (isMultilang(f.type)) {
        for (const l of LOCALES) {
          const k = subKey(f.key, l.code)
          const v = initialValues[k]
          out[k] = typeof v === 'string' ? v : ''
        }
        continue
      }
      const v = initialValues[f.key]
      if (v !== undefined && v !== null) {
        out[f.key] = f.type === 'tags' && Array.isArray(v) ? (v as string[]).join(', ') : v
      } else {
        out[f.key] =
          f.type === 'boolean' ? false :
          f.type === 'tags' ? '' :
          ''
      }
    }
    return out
  })
  const [pending, startTransition] = useTransition()

  function setValue(key: string, v: unknown) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const entries: { key: string; category: string; label: string; value: unknown }[] = []
    for (const f of fields) {
      if (isMultilang(f.type)) {
        for (const l of LOCALES) {
          const k = subKey(f.key, l.code)
          let value: unknown = values[k]
          if (typeof value === 'string') value = value.trim()
          entries.push({ key: k, category, label: `${f.label} (${l.label})`, value })
        }
        continue
      }
      let value: unknown = values[f.key]
      if (f.type === 'tags' && typeof value === 'string') {
        value = value.split(',').map((s) => s.trim()).filter(Boolean)
      }
      if ((f.type === 'text' || f.type === 'textarea' || f.type === 'email' ||
           f.type === 'tel'  || f.type === 'url'      || f.type === 'image' ||
           f.type === 'color') && typeof value === 'string') {
        value = value.trim()
      }
      entries.push({ key: f.key, category, label: f.label, value })
    }

    startTransition(async () => {
      const res = await saveConfigEntries({ entries })
      if (!res.ok) toast.error(res.error)
      else toast.success('Configuration enregistrée')
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {fields.map((f) =>
        isMultilang(f.type) ? (
          <MultilangField key={f.key} field={f} values={values} onChange={setValue} />
        ) : (
          <FieldRow key={f.key} field={f} value={values[f.key]} onChange={(v) => setValue(f.key, v)} />
        ),
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          <IconCheck size={14} /> {pending ? 'Enregistrement…' : 'Enregistrer cette section'}
        </Button>
      </div>
    </form>
  )
}

/** A single editorial text edited in the three site languages. */
function MultilangField({
  field, values, onChange,
}: { field: FieldDef; values: Record<string, unknown>; onChange: (key: string, v: unknown) => void }) {
  const isArea = field.type === 'multilang-textarea'
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <Label>{field.label}</Label>
      {field.helper && <p className="text-[11px] text-muted-foreground">{field.helper}</p>}
      <div className="space-y-2.5">
        {LOCALES.map((l) => {
          const k = subKey(field.key, l.code)
          const id = `cfg-${k.replace(/\W/g, '-')}`
          return (
            <div key={l.code || 'fr'} className="space-y-1">
              <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {l.label}
              </label>
              {isArea ? (
                <Textarea
                  id={id} rows={field.rows ?? 2} dir={l.dir}
                  value={(values[k] as string) ?? ''}
                  onChange={(e) => onChange(k, e.target.value)}
                  placeholder={field.placeholder}
                />
              ) : (
                <Input
                  id={id} dir={l.dir}
                  value={(values[k] as string) ?? ''}
                  onChange={(e) => onChange(k, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FieldRow({
  field, value, onChange,
}: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const id = `cfg-${field.key.replace(/\W/g, '-')}`

  if (field.type === 'boolean') {
    return (
      <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <span>
          <div className="text-sm font-medium">{field.label}</div>
          {field.helper && <div className="text-[11px] text-muted-foreground">{field.helper}</div>}
        </span>
        <Switch
          id={id}
          checked={!!value}
          onCheckedChange={(v) => onChange(v)}
        />
      </label>
    )
  }

  if (field.type === 'image') {
    const picks: PickedItem[] = value ? [{ url: String(value), alt: '', isPrimary: true }] : []
    return (
      <div className="space-y-2">
        <Label>{field.label}</Label>
        {field.helper && <p className="text-[11px] text-muted-foreground">{field.helper}</p>}
        <MediaPicker
          label=""
          multiple={false}
          accept="IMAGE"
          folder={field.folder ?? 'config'}
          value={picks}
          onChange={(next) => onChange(next[0]?.url ?? '')}
        />
      </div>
    )
  }

  if (field.type === 'color') {
    const v = (value as string) ?? ''
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        {field.helper && <p className="text-[11px] text-muted-foreground">{field.helper}</p>}
        <div className="flex gap-2">
          <Input id={id} type="text" value={v} onChange={(e) => onChange(e.target.value)} className="flex-1" />
          <input type="color" value={/^#/.test(v) ? v : '#185FA5'}
                 onChange={(e) => onChange(e.target.value)}
                 className="h-10 w-12 cursor-pointer rounded-md border border-input" />
        </div>
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        {field.helper && <p className="text-[11px] text-muted-foreground">{field.helper}</p>}
        <Textarea id={id} rows={field.rows ?? 3}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder} />
      </div>
    )
  }

  if (field.type === 'tags') {
    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{field.label}</Label>
        {field.helper && <p className="text-[11px] text-muted-foreground">{field.helper}</p>}
        <Input id={id} value={(value as string) ?? ''}
               onChange={(e) => onChange(e.target.value)}
               placeholder={field.placeholder ?? 'val1, val2, val3'} />
      </div>
    )
  }

  // text / email / tel / url
  const type = field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : field.type === 'url' ? 'url' : 'text'
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{field.label}</Label>
      {field.helper && <p className="text-[11px] text-muted-foreground">{field.helper}</p>}
      <Input id={id} type={type}
             value={(value as string) ?? ''}
             onChange={(e) => onChange(e.target.value)}
             placeholder={field.placeholder} />
    </div>
  )
}
