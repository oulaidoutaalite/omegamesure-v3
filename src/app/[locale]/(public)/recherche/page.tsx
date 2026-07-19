import { IconSearch } from '@tabler/icons-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Container } from '@/components/public/Container'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'
import { SearchBar } from '@/components/public/SearchBar'
import { type Locale } from '@/i18n'
import { db } from '@/lib/db'
import { pickLocaleField, type TranslationsJson } from '@/lib/i18n-helpers'

export const dynamic = 'force-dynamic'

type ImageJson = { url: string; alt?: string; isPrimary?: boolean }

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'search' })
  return { title: t('title') }
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ q?: string }>
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams])
  setRequestLocale(locale)
  const q = (sp.q ?? '').trim()

  const t = await getTranslations({ locale, namespace: 'search' })

  const selectFields = {
    id: true, name: true, slug: true, shortDescription: true,
    brand: true, model: true, price: true, currency: true, images: true,
    translations: true, category: { select: { color: true } },
  } as const
  const orderBy = [{ isFeatured: 'desc' }, { updatedAt: 'desc' }] as const

  // A generic word like "balance" appears as a substring in many unrelated products
  // ("imbalance" rotor detection, "balanced LED", "heat balance"…). So we search in two
  // tiers: STRONG signals first (name / brand / model, and — crucially — a category or
  // sub-category whose name matches, e.g. "balance" → category "Balances & bascules"),
  // and only fall back to the broad full-text scan when nothing strong matched.
  const [matchCats, matchSubs] = q
    ? await Promise.all([
        db.category.findMany({
          where: { name: { contains: q, mode: 'insensitive' } },
          select: { id: true },
        }),
        db.subCategory.findMany({
          where: { name: { contains: q, mode: 'insensitive' } },
          select: { id: true },
        }),
      ])
    : [[], []]
  const catIds = matchCats.map((c) => c.id)
  const subIds = matchSubs.map((s) => s.id)

  let rows = q
    ? await db.product.findMany({
        where: {
          isPublished: true,
          OR: [
            { name:  { contains: q, mode: 'insensitive' as const } },
            { brand: { contains: q, mode: 'insensitive' as const } },
            { model: { contains: q, mode: 'insensitive' as const } },
            ...(catIds.length ? [{ categoryId: { in: catIds } }] : []),
            ...(subIds.length ? [{ subCategoryId: { in: subIds } }] : []),
          ],
        },
        orderBy: [...orderBy],
        take: 48,
        select: selectFields,
      })
    : []

  // Fallback for queries that match no name/category (model codes buried in the per-model
  // specs table, or names/descriptions in OTHER languages stored in `translations`).
  if (q && rows.length === 0) {
    const specIds = (
      await db.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Product"
        WHERE "isPublished" = true
          AND ("specs"::text ILIKE ${'%' + q + '%'} OR "translations"::text ILIKE ${'%' + q + '%'})
        LIMIT 100`
    ).map((r) => r.id)

    rows = await db.product.findMany({
      where: {
        isPublished: true,
        OR: [
          { shortDescription: { contains: q, mode: 'insensitive' as const } },
          { description:      { contains: q, mode: 'insensitive' as const } },
          ...(specIds.length ? [{ id: { in: specIds } }] : []),
        ],
      },
      orderBy: [...orderBy],
      take: 48,
      select: selectFields,
    })
  }

  const products: ProductCardData[] = rows.map((p) => {
    const imgs = Array.isArray(p.images) ? (p.images as unknown as ImageJson[]) : []
    const primary = imgs.find((i) => i.isPrimary) ?? imgs[0]
    const ptr = p.translations as TranslationsJson
    return {
      slug: p.slug,
      name:             pickLocaleField(p.name,             ptr, 'name',             locale),
      shortDescription: pickLocaleField(p.shortDescription, ptr, 'shortDescription', locale),
      brand: p.brand,
      model: p.model,
      price: p.price ? Number(p.price) : null,
      currency: p.currency,
      imageUrl: primary?.url ?? null,
      categoryColor: p.category?.color ?? null,
    }
  })

  return (
    <Container className="py-10 lg:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('title')}</h1>
        <div className="mt-5">
          <SearchBar />
        </div>
        {q && (
          <p className="mt-4 text-sm text-muted-foreground">
            {t('resultsFor')} <span className="font-medium text-foreground">« {q} »</span>
            {' · '}{t('count', { n: products.length })}
          </p>
        )}
      </header>

      <section className="mt-10">
        {q && products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
            <IconSearch className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{t('noResults')}</p>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <li key={p.slug}><ProductCard data={p} locale={locale} /></li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  )
}
