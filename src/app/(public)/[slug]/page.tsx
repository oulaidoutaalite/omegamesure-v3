import { IconArrowRight, IconCircleCheck } from '@tabler/icons-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'

import { Container } from '@/components/public/Container'
import {
  ProductCard,
  type ProductCardData,
} from '@/components/public/ProductCard'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type ImageJson = { url: string; alt?: string; isPrimary?: boolean }

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const cat = await db.category.findUnique({
    where: { slug },
    select: { name: true, description: true, metaTitle: true, metaDescription: true },
  })
  if (!cat) return { title: 'Introuvable' }
  return {
    title: cat.metaTitle ?? cat.name,
    description: cat.metaDescription ?? cat.description ?? undefined,
  }
}

export default async function CategoryPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const category = await db.category.findFirst({
    where: { slug, isPublished: true },
    include: {
      subCategories: {
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        select: {
          id: true, name: true, slug: true, description: true,
          isAutresSlot: true,
          _count: { select: { products: { where: { isPublished: true } } } },
        },
      },
    },
  })
  if (!category) notFound()

  // Fetch products for this category (across all subcategories)
  const productRows = await db.product.findMany({
    where: { categoryId: category.id, isPublished: true },
    orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
    take: 24,
    select: {
      id: true, name: true, slug: true, shortDescription: true,
      brand: true, model: true, price: true, currency: true, images: true,
      subCategoryId: true,
    },
  })

  const products: ProductCardData[] = productRows.map((p) => {
    const imgs = Array.isArray(p.images) ? (p.images as unknown as ImageJson[]) : []
    const primary = imgs.find((i) => i.isPrimary) ?? imgs[0]
    return {
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      brand: p.brand,
      model: p.model,
      price: p.price ? Number(p.price) : null,
      currency: p.currency,
      imageUrl: primary?.url ?? null,
      categoryColor: category.color,
    }
  })

  const isMetrologie = category.slug === 'metrologie'

  return (
    <>
      {/* Hero */}
      <section
        className="border-b border-border py-12 sm:py-16"
        style={{ background: `linear-gradient(135deg, ${category.color ?? '#185FA5'}10 0%, transparent 100%)` }}
      >
        <Container>
          <nav className="mb-3 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Accueil</Link> / {category.name}
          </nav>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{category.name}</h1>
              {category.description && (
                <p className="mt-3 text-base text-muted-foreground">{category.description}</p>
              )}
              {isMetrologie && (
                <div className="mt-5 inline-flex items-start gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
                  <IconCircleCheck size={16} className="mt-0.5 shrink-0 text-brand" />
                  <span>
                    Notre laboratoire COFRAC étalonne <strong>le matériel que nous vendons ET le matériel tiers, toutes marques</strong>.
                  </span>
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Besoin spécifique ?</p>
              <p className="mt-1 text-sm">
                Notre équipe vous accompagne pour identifier l&apos;équipement le plus adapté à vos contraintes.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link href="/devis">Demander un devis</Link>
              </Button>
            </aside>
          </div>
        </Container>
      </section>

      {/* Sub-categories */}
      {category.subCategories.length > 0 && (
        <section className="border-b border-border py-10">
          <Container>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Sous-catégories
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {category.subCategories.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/${category.slug}#${s.slug}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition hover:border-brand/40 hover:bg-accent/40"
                  >
                    <div>
                      <span className="text-sm font-medium">{s.name}</span>
                      {s.isAutresSlot && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                          Autres
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {s._count.products} {s._count.products > 1 ? 'produits' : 'produit'} <IconArrowRight size={12} className="inline" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Products */}
      <section className="py-16">
        <Container>
          <header className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">Sélection</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">Produits disponibles</h2>
            </div>
            <p className="text-xs text-muted-foreground">{productRows.length} affiché{productRows.length > 1 ? 's' : ''}</p>
          </header>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucun produit publié pour cette catégorie pour le moment.
              </p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/devis">Demander un devis sur mesure</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <li key={p.slug}><ProductCard data={p} /></li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  )
}
