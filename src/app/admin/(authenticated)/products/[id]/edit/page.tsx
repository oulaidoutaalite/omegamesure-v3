import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  ProductForm,
  type CategoryOption,
} from '@/components/admin/products/ProductForm'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { loadTranslatableLocales } from '@/lib/locales'

export const metadata = { title: 'Éditer le produit' }
export const dynamic = 'force-dynamic'

type ImageJson = { url: string; alt?: string; isPrimary?: boolean }

export default async function EditProductPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireAuth()
  const { id } = await params

  const [product, cats, translatableLocales] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true, name: true,
        subCategories: { orderBy: { order: 'asc' }, select: { id: true, name: true } },
      },
    }),
    loadTranslatableLocales(),
  ])
  if (!product) notFound()

  const categories: CategoryOption[] = cats.map((c) => ({ id: c.id, name: c.name, subCategories: c.subCategories }))
  const imgs = Array.isArray(product.images) ? (product.images as unknown as ImageJson[]) : []

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Link href="/admin/products" className="text-xs text-muted-foreground hover:underline">
          ← Retour aux produits &amp; services
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight">
          {product.name}
          <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
            product.kind === 'SERVICE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {product.kind === 'SERVICE' ? 'Service' : 'Produit'}
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5">/{product.slug}</code>
          {!product.isPublished && (
            <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase">Brouillon</span>
          )}
        </p>
      </header>

      <ProductForm
        mode={{ type: 'edit', id }}
        categories={categories}
        translatableLocales={translatableLocales}
        defaultValues={{
          name:             product.name,
          slug:             product.slug,
          kind:             product.kind,
          shortDescription: product.shortDescription ?? '',
          description:      product.description      ?? '',
          brand:            product.brand            ?? '',
          model:            product.model            ?? '',
          price:            product.price ? Number(product.price) : null,
          currency:         product.currency,
          categoryId:       product.categoryId,
          subCategoryId:    product.subCategoryId,
          images:           imgs.map((i) => ({ url: i.url, alt: i.alt ?? '', isPrimary: !!i.isPrimary })),
          datasheetUrl:     product.datasheetUrl ?? '',
          isPublished:      product.isPublished,
          isFeatured:       product.isFeatured,
          metaTitle:        product.metaTitle       ?? '',
          metaDescription:  product.metaDescription ?? '',
          translations:     (product.translations as Record<string, Record<string, string>> | null) ?? undefined,
        }}
      />
    </div>
  )
}
