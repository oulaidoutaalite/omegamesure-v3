'use client'

import { IconCheck, IconStar, IconStarFilled } from '@tabler/icons-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { setDefaultLocale, toggleLocaleActive } from '@/lib/actions/locales'
import { cn } from '@/lib/utils'

export type LocaleAdminRow = {
  code: string
  name: string
  nativeName: string
  flag: string
  isDefault: boolean
  isActive: boolean
  isRtl: boolean
  order: number
}

export function LocalesTable({ items: initial }: { items: LocaleAdminRow[] }) {
  const [items, setItems] = useState(initial)

  function patchRow(code: string, patch: Partial<LocaleAdminRow>) {
    setItems((prev) => prev.map((r) => (r.code === code ? { ...r, ...patch } : r)))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Langue</th>
            <th className="px-4 py-3 text-left font-medium">Code</th>
            <th className="px-4 py-3 text-center font-medium">RTL</th>
            <th className="px-4 py-3 text-center font-medium">Active</th>
            <th className="px-4 py-3 text-center font-medium">Par défaut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((l) => (
            <Row key={l.code} row={l} onPatch={patchRow} setAllDefault={(c) => {
              setItems((prev) => prev.map((r) => ({ ...r, isDefault: r.code === c })))
            }} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Row({
  row, onPatch, setAllDefault,
}: {
  row: LocaleAdminRow
  onPatch: (code: string, patch: Partial<LocaleAdminRow>) => void
  setAllDefault: (code: string) => void
}) {
  const [actPending, startAct] = useTransition()
  const [defPending, startDef] = useTransition()

  function onToggleActive(v: boolean) {
    if (row.isDefault && !v) { toast.error('Impossible de désactiver la langue par défaut.'); return }
    startAct(async () => {
      const res = await toggleLocaleActive(row.code)
      if (!res.ok) toast.error(res.error); else {
        onPatch(row.code, { isActive: res.data.isActive })
        toast.success(res.data.isActive ? 'Langue activée' : 'Langue désactivée')
      }
    })
  }

  function onSetDefault() {
    if (row.isDefault) return
    if (!row.isActive) { toast.error('Activez la langue avant de la définir par défaut.'); return }
    startDef(async () => {
      const res = await setDefaultLocale(row.code)
      if (!res.ok) toast.error(res.error); else {
        setAllDefault(row.code); toast.success(`${row.nativeName} est désormais la langue par défaut`)
      }
    })
  }

  return (
    <tr className="hover:bg-accent/30">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{row.flag}</span>
          <div>
            <div className="font-medium">{row.nativeName}</div>
            <div className="text-xs text-muted-foreground">{row.name}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs">
        <code className="rounded bg-muted px-1.5 py-0.5">{row.code}</code>
      </td>
      <td className="px-4 py-3 text-center text-xs">
        {row.isRtl && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
          <IconCheck size={10} /> RTL
        </span>}
      </td>
      <td className="px-4 py-3 text-center">
        <Switch
          checked={row.isActive}
          disabled={actPending || (row.isDefault && row.isActive)}
          onCheckedChange={onToggleActive}
        />
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          onClick={onSetDefault}
          disabled={defPending || row.isDefault || !row.isActive}
          className={cn(
            'inline-grid h-8 w-8 place-items-center rounded-md',
            row.isDefault ? 'text-amber-500' : 'text-muted-foreground hover:bg-accent hover:text-amber-500',
            'disabled:opacity-50',
          )}
          title={row.isDefault ? 'Langue par défaut' : 'Définir par défaut'}
        >
          {row.isDefault ? <IconStarFilled size={16} /> : <IconStar size={16} />}
        </button>
      </td>
    </tr>
  )
}
