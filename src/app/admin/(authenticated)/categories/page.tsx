import { IconPlus } from '@tabler/icons-react'
import Link from 'next/link'

import {
  CategoriesList,
  type CategoryRow,
} from '@/components/admin/categories/CategoriesList'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export const metadata = { title: 'Catégories' }
export const dynamic = 'force-dynamic'

export default async function CategoriesPage() {
  await requireRole(['SUPER_ADMIN', 'ADMIN'])

  const rows = await db.category.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true, name: true, slug: true, color: true, icon: true, isPublished: true,
      _count: { select: { products: true, subCategories: true } },
    },
  })

  const items: CategoryRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    color: r.color,
    icon: r.icon,
    isPublished: r.isPublished,
    productCount: r._count.products,
    subCategoryCount: r._count.subCategories,
  }))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catégories</h1>
          <p className="text-sm text-muted-foreground">
            Sections principales du site. Cliquez sur une catégorie pour gérer ses sous-catégories.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/categories/new"><IconPlus size={16} /> Nouvelle</Link>
        </Button>
      </header>

      <CategoriesList items={items} />
    </div>
  )
}
