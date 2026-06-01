import Link from 'next/link'

import { CategoryForm } from '@/components/admin/categories/CategoryForm'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { loadTranslatableLocales } from '@/lib/locales'

export const metadata = { title: 'Nouvelle catégorie' }
export const dynamic = 'force-dynamic'

export default async function NewCategoryPage() {
  await requireRole(['SUPER_ADMIN', 'ADMIN'])

  const [navItems, translatableLocales] = await Promise.all([
    db.navItem.findMany({
      where: { parentId: null },
      orderBy: { order: 'asc' },
      select: { id: true, label: true },
    }),
    loadTranslatableLocales(),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/categories" className="text-xs text-muted-foreground hover:underline">
          ← Retour aux catégories
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Nouvelle catégorie</h1>
      </header>

      <div className="rounded-xl border border-border bg-card p-6">
        <CategoryForm
          mode={{ type: 'create' }}
          navItemOptions={navItems.map((n) => ({ id: n.id, label: n.label }))}
          translatableLocales={translatableLocales}
        />
      </div>
    </div>
  )
}
