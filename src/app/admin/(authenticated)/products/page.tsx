import { IconPlus } from '@tabler/icons-react'
import Link from 'next/link'

import {
  ProductsTable,
  type ProductRow,
} from '@/components/admin/products/ProductsTable'
import { Button } from '@/components/ui/button'
import { listProducts } from '@/lib/actions/products'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export const metadata = { title: 'Produits' }
export const dynamic = 'force-dynamic'

type ImageJson = { url: string; alt?: string; isPrimary?: boolean }

export default async function ProductsPage() {
  await requireAuth()

  const [{ rows, total }, categories] = await Promise.all([
    listProducts({ perPage: 100 }),
    db.category.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true } }),
  ])

  const items: ProductRow[] = rows.map((r) => {
    const imgs = Array.isArray(r.images) ? (r.images as unknown as ImageJson[]) : []
    const primary = imgs.find((i) => i.isPrimary) ?? imgs[0]
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      kind: r.kind,
      brand: r.brand,
      model: r.model,
      price: r.price ? Number(r.price) : null,
      currency: r.currency,
      primaryImageUrl: primary?.url ?? null,
      isPublished: r.isPublished,
      isFeatured: r.isFeatured,
      categoryName:    r.category?.name    ?? null,
      categoryColor:   r.category?.color   ?? null,
      subCategoryName: r.subCategory?.name ?? null,
      updatedAt: r.updatedAt.toISOString(),
    }
  })

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produits &amp; Services</h1>
          <p className="text-sm text-muted-foreground">
            Catalogue complet — filtrez par type, catégorie ou statut, recherchez par nom / marque / slug.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new"><IconPlus size={16} /> Nouveau</Link>
        </Button>
      </header>

      <ProductsTable items={items} total={total} categories={categories} />
    </div>
  )
}
