'use client'

import { IconLanguage } from '@tabler/icons-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

export type TranslationField = {
  key: string
  label: string
  type?: 'text' | 'textarea'
  rows?: number
  placeholder?: string
  helper?: string
}

export type LocaleDef = {
  code: string
  nativeName: string
  flag?: string
  isRtl?: boolean
}

export type TranslationsValue = Record<string, Record<string, string>>

type Props = {
  /** Locales other than the default — usually loaded from DB. */
  locales: LocaleDef[]
  /** Fields to translate (same shape as the form's default-locale fields). */
  fields: TranslationField[]
  /** Current translations object, e.g. { ar: { name: '…' }, en: { name: '…' } } */
  value: TranslationsValue
  /** Called whenever the user types in any field. */
  onChange: (next: TranslationsValue) => void
  /** Section title (default: "Traductions"). */
  title?: string
  /** Open by default. */
  defaultOpen?: boolean
}

export function TranslationsEditor({
  locales, fields, value, onChange, title = 'Traductions', defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const [activeLocale, setActiveLocale] = useState<string>(locales[0]?.code ?? '')

  if (locales.length === 0) return null

  function update(locale: string, fieldKey: string, v: string) {
    const next: TranslationsValue = { ...value }
    const bucket = { ...(next[locale] ?? {}) }
    if (v.trim().length === 0) {
      delete bucket[fieldKey]
    } else {
      bucket[fieldKey] = v
    }
    if (Object.keys(bucket).length === 0) delete next[locale]
    else next[locale] = bucket
    onChange(next)
  }

  const filledCount = (locale: string) => {
    const bucket = value[locale]
    if (!bucket) return 0
    return Object.values(bucket).filter((v) => typeof v === 'string' && v.trim().length > 0).length
  }

  const active = locales.find((l) => l.code === activeLocale)
  const activeBucket = activeLocale ? value[activeLocale] ?? {} : {}

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <IconLanguage size={16} className="text-brand" /> {title}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {locales.map((l) => {
            const c = filledCount(l.code)
            return (
              <span key={l.code} className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]',
                c > 0 ? 'bg-brand/10 text-brand' : 'bg-muted',
              )}>
                {l.flag} {l.code.toUpperCase()}{c > 0 ? ` · ${c}/${fields.length}` : ''}
              </span>
            )
          })}
          <span className="ml-1">{open ? '▾' : '▸'}</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-border p-5">
          <div className="mb-4 inline-flex rounded-lg border border-border bg-muted/30 p-1">
            {locales.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setActiveLocale(l.code)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition',
                  activeLocale === l.code
                    ? 'bg-brand text-white'
                    : 'text-muted-foreground hover:bg-accent',
                )}
              >
                {l.flag && <span>{l.flag}</span>}
                <span>{l.nativeName}</span>
              </button>
            ))}
          </div>

          {active && (
            <div className="space-y-4" dir={active.isRtl ? 'rtl' : 'ltr'}>
              {fields.map((f) => {
                const v = activeBucket[f.key] ?? ''
                const id = `tr-${active.code}-${f.key}`
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label htmlFor={id} className="text-xs">{f.label}</Label>
                    {f.type === 'textarea' ? (
                      <Textarea
                        id={id}
                        rows={f.rows ?? 3}
                        value={v}
                        placeholder={f.placeholder}
                        onChange={(e) => update(active.code, f.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={id}
                        value={v}
                        placeholder={f.placeholder}
                        onChange={(e) => update(active.code, f.key, e.target.value)}
                      />
                    )}
                    {f.helper && (
                      <p className="text-[10px] text-muted-foreground">{f.helper}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <p className="mt-4 text-[10px] text-muted-foreground">
            Laissez un champ vide pour utiliser la valeur en {locales.length === 1 ? 'français' : 'langue par défaut'}.
          </p>
        </div>
      )}
    </div>
  )
}
