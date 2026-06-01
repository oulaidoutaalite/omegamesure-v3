import { LocalesTable, type LocaleAdminRow } from '@/components/admin/languages/LocalesTable'
import { requireRole } from '@/lib/auth-helpers'
import { getFlag, loadLocales } from '@/lib/locales'

export const metadata = { title: 'Langues' }
export const dynamic = 'force-dynamic'

export default async function LanguagesPage() {
  await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const rows = await loadLocales()
  const items: LocaleAdminRow[] = rows.map((r) => ({
    code:       r.code,
    name:       r.name,
    nativeName: r.nativeName,
    flag:       getFlag(r.code),
    isDefault:  r.isDefault,
    isActive:   r.isActive,
    isRtl:      r.isRtl,
    order:      r.order,
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Langues</h1>
        <p className="text-sm text-muted-foreground">
          Activez ou désactivez les langues disponibles sur le site public, et choisissez la langue par défaut.
        </p>
      </header>

      <LocalesTable items={items} />

      <p className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        💡 Une fois une langue activée, les champs « Traductions » apparaissent automatiquement
        dans les formulaires Navigation, Catégories, Sous-catégories et Produits.
      </p>
    </div>
  )
}
