import Link from 'next/link'

import { NavItemForm } from '@/components/admin/nav/NavItemForm'
import { requireRole } from '@/lib/auth-helpers'
import { listNavItemsFlat } from '@/lib/actions/nav-items'
import { loadTranslatableLocales } from '@/lib/locales'

export const metadata = { title: 'Nouvel item de navigation' }
export const dynamic = 'force-dynamic'

export default async function NewNavItemPage() {
  await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const [all, translatableLocales] = await Promise.all([
    listNavItemsFlat(),
    loadTranslatableLocales(),
  ])
  // Only top-level items can be parents (no nested sub-sub-menus for now)
  const parentOptions = all.filter((i) => i.parentId === null).map((i) => ({ id: i.id, label: i.label }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/navigation" className="text-xs text-muted-foreground hover:underline">
          ← Retour à la navigation
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Nouvel item de navigation</h1>
      </header>

      <div className="rounded-xl border border-border bg-card p-6">
        <NavItemForm mode={{ type: 'create' }} parentOptions={parentOptions} translatableLocales={translatableLocales} />
      </div>
    </div>
  )
}
