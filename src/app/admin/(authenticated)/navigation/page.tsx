import { IconPlus } from '@tabler/icons-react'
import Link from 'next/link'

import { NavItemsList, type NavItemRow } from '@/components/admin/nav/NavItemsList'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export const metadata = { title: 'Navigation' }
export const dynamic = 'force-dynamic'

export default async function NavigationPage() {
  await requireRole(['SUPER_ADMIN', 'ADMIN'])

  const all = await db.navItem.findMany({
    orderBy: [{ parentId: 'asc' }, { order: 'asc' }],
    select: { id: true, label: true, slug: true, icon: true, isPublished: true, isCta: true, order: true, parentId: true },
  })

  // Build top-level rows with nested children
  const byParent = new Map<string | null, typeof all>()
  for (const it of all) {
    const k = it.parentId
    if (!byParent.has(k)) byParent.set(k, [])
    byParent.get(k)!.push(it)
  }
  const topLevel: NavItemRow[] = (byParent.get(null) ?? []).map((it) => ({
    id: it.id, label: it.label, slug: it.slug, icon: it.icon, isPublished: it.isPublished,
    isCta: it.isCta, order: it.order,
    children: (byParent.get(it.id) ?? []).map((c) => ({
      id: c.id, label: c.label, slug: c.slug, icon: c.icon, isPublished: c.isPublished,
      isCta: c.isCta, order: c.order, children: [],
    })),
  }))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Navigation</h1>
          <p className="text-sm text-muted-foreground">
            Glissez pour réordonner. Activez le toggle pour publier ou masquer un item.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/navigation/new">
            <IconPlus size={16} /> Nouveau
          </Link>
        </Button>
      </header>

      <NavItemsList items={topLevel} />
    </div>
  )
}
