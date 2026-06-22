'use client'

import { IconPlus, IconTable, IconTrash, IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { SpecTable } from '@/lib/validations/product'

type Props = {
  value: SpecTable | null
  onChange: (v: SpecTable | null) => void
}

export function SpecsEditor({ value, onChange }: Props) {
  if (!value) {
    return (
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Spécifications techniques</h2>
            <p className="text-[11px] text-muted-foreground">
              Tableau affiché sur la fiche produit publique. Aucun tableau pour l’instant.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ columns: ['Caractéristique', 'Valeur'], rows: [['', '']] })}
          >
            <IconTable size={15} /> Ajouter un tableau
          </Button>
        </div>
      </section>
    )
  }

  const { columns, rows } = value
  const setCol  = (j: number, v: string) => onChange({ columns: columns.map((c, i) => (i === j ? v : c)), rows })
  const setCell = (i: number, j: number, v: string) =>
    onChange({ columns, rows: rows.map((r, ri) => (ri === i ? r.map((c, ci) => (ci === j ? v : c)) : r)) })
  const addRow    = () => onChange({ columns, rows: [...rows, columns.map(() => '')] })
  const removeRow = (i: number) => {
    const next = rows.filter((_, ri) => ri !== i)
    onChange(next.length ? { columns, rows: next } : null)
  }
  const addCol    = () => onChange({ columns: [...columns, ''], rows: rows.map((r) => [...r, '']) })
  const removeCol = (j: number) => {
    if (columns.length <= 1) return
    onChange({ columns: columns.filter((_, ci) => ci !== j), rows: rows.map((r) => r.filter((_, ci) => ci !== j)) })
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Spécifications techniques</h2>
          <p className="text-[11px] text-muted-foreground">
            Affiché sur la fiche produit. Rédigez les libellés en <strong>français</strong> (le tableau est commun à toutes les langues).
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => onChange(null)}
        >
          Supprimer le tableau
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: '4px' }}>
          <thead>
            <tr>
              {columns.map((c, j) => (
                <th key={j} className="min-w-[150px] align-top">
                  <div className="flex items-center gap-1">
                    <Input
                      value={c}
                      onChange={(e) => setCol(j, e.target.value)}
                      placeholder={`Colonne ${j + 1}`}
                      className="h-8 font-semibold"
                    />
                    {columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCol(j)}
                        title="Supprimer cette colonne"
                        className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <IconX size={14} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="w-9" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j}>
                    <Input
                      value={r[j] ?? ''}
                      onChange={(e) => setCell(i, j, e.target.value)}
                      className="h-8"
                    />
                  </td>
                ))}
                <td className="text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    title="Supprimer cette ligne"
                    className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <IconTrash size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <IconPlus size={14} /> Ligne
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addCol}>
          <IconPlus size={14} /> Colonne
        </Button>
      </div>
    </section>
  )
}
