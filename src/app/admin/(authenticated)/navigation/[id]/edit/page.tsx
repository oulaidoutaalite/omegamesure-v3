import Link from 'next/link'
import { notFound } from 'next/navigation'

import { NavItemForm } from '@/components/admin/nav/NavItemForm'
import { listNavItemsFlat } from '@/lib/actions/nav-items'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { loadTranslatableLocales } from '@/lib/locales'

export const metadata = { title: 'Éditer un item de navigation' }
export const dynamic = 'force-dynamic'

export default async function EditNavItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const { id } = await params

  const [item, all, translatableLocales] = await Promise.all([
    db.navItem.findUnique({ where: { id } }),
    listNavItemsFlat(),
    loadTranslatableLocales(),
  ])
  if (!item) notFound()

  const parentOptions = all
    .filter((i) => i.parentId === null && i.id !== id)
    .map((i) => ({ id: i.id, label: i.label }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <Link href="/admin/navigation" className="text-xs text-muted-foreground hover:underline">
          ← Retour à la navigation
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Éditer : {item.label}</h1>
      </header>

      <div className="rounded-xl border border-border bg-card p-6">
        <NavItemForm
          mode={{ type: 'edit', id }}
          parentOptions={parentOptions}
          translatableLocales={translatableLocales}
          defaultValues={{
            label:       item.label,
            slug:        item.slug,
            icon:        item.icon ?? '',
            href:        item.href ?? '',
            parentId:    item.parentId,
            isPublished: item.isPublished,
            isCta:       item.isCta,
            translations: (item.translations as Record<string, Record<string, string>> | null) ?? undefined,
          }}
        />
      </div>
    </div>
  )
}
