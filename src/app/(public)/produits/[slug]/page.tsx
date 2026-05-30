import {
  IconDownload,
  IconPhoto,
} from '@tabler/icons-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'

import { Container } from '@/components/public/Container'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type ImageJson = { url: string; alt?: string; isPrimary?: boolean }

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await db.product.findUnique({
    where: { slug },
    select: { name: true, shortDescription: true, metaTitle: true, metaDescription: true },
  })
  if (!p) return { title: 'Produit introuvable' }
  return {
    title: p.metaTitle ?? p.name,
    description: p.metaDescription ?? p.shortDescription ?? undefined,
  }
}

export default async function ProductPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const product = await db.product.findFirst({
    where: { slug, isPublished: true },
    include: {
      category: { select: { name: true, slug: true, color: true } },
      subCategory: { select: { name: true } },
    },
  })
  if (!product) notFound()

  const imgs = Array.isArray(product.images) ? (product.images as unknown as ImageJson[]) : []
  const sorted = [...imgs].sort((a, b) => (a.isPrimary ? -1 : 0) - (b.isPrimary ? -1 : 0))
  const main = sorted[0]

  return (
    <Container className="py-10 lg:py-14">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Accueil</Link>
        {product.category && (
          <>
            {' / '}
            <Link href={`/${product.category.slug}`} className="hover:text-foreground">
              {product.category.name}
            </Link>
          </>
        )}
        {' / '}{product.name}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
            {main ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={main.url} alt={main.alt ?? product.name}
                   className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <IconPhoto size={64} />
              </div>
            )}
          </div>
          {sorted.length > 1 && (
            <ul className="grid grid-cols-4 gap-2">
              {sorted.slice(0, 8).map((img, i) => (
                <li key={i} className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt ?? product.name}
                       className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className="space-y-6">
          <div>
            {(product.brand || product.model) && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {[product.brand, product.model].filter(Boolean).join(' · ')}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{product.name}</h1>
            {product.shortDescription && (
              <p className="mt-3 text-base text-muted-foreground">{product.shortDescription}</p>
            )}
          </div>

          {product.price !== null && (
            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">À partir de</p>
              <p className="mt-1 text-3xl font-bold text-brand">
                {Number(product.price).toLocaleString('fr-FR')} {product.currency}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">HT · Livraison & installation sur devis</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/devis?productSlug=${product.slug}`}>Demander un devis</Link>
            </Button>
            {product.datasheetUrl && (
              <Button asChild size="lg" variant="outline">
                <a href={product.datasheetUrl} target="_blank" rel="noreferrer">
                  <IconDownload size={16} /> Fiche technique
                </a>
              </Button>
            )}
          </div>

          {product.category && (
            <p className="text-xs text-muted-foreground">
              Catégorie :{' '}
              <Link href={`/${product.category.slug}`} className="text-brand hover:underline">
                {product.category.name}
              </Link>
              {product.subCategory && <> · {product.subCategory.name}</>}
            </p>
          )}
        </div>
      </div>

      {product.description && (
        <section className="mt-12 rounded-2xl border border-border bg-card p-8">
          <h2 className="mb-4 text-base font-semibold">Description détaillée</h2>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
            {product.description}
          </div>
        </section>
      )}
    </Container>
  )
}
