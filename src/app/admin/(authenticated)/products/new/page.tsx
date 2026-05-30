import Link from 'next/link'

import {
  ProductForm,
  type CategoryOption,
} from '@/components/admin/products/ProductForm'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export const metadata = { title: 'Nouveau produit' }
export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  await requireAuth()

  const cats = await db.category.findMany({
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      subCategories: {
        orderBy: { order: 'asc' },
        select: { id: true, name: true },
      },
    },
  })
  const categories: CategoryOption[] = cats.map((c) => ({ id: c.id, name: c.name, subCategories: c.subCategories }))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Link href="/admin/products" className="text-xs text-muted-foreground hover:underline">
          ← Retour aux produits
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Nouveau produit</h1>
      </header>

      <ProductForm mode={{ type: 'create' }} categories={categories} />
    </div>
  )
}
