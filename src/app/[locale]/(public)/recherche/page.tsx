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
  // Two-tier, accent-insensitive search (Postgres `unaccent`, so "etuve" matches "Étuve").
  //  1. STRONG signals: name / brand / model, and — crucially — a category or sub-category
  //     whose name matches (e.g. "balance" → category "Balances & bascules"). This keeps a
  //     generic word like "balance" from dragging in "imbalance" / "balanced LED" noise.
  //  2. FALLBACK (only when nothing strong matched): broad scan of description + specs +
  //     translations, so model codes buried in the specs table ("WD-220") and other-language
  //     names ("Automatic Glassware Washer") still resolve.
  const pat = '%' + q + '%'
  let ids: string[] = []
  if (q) {
    ids = (
      await db.$queryRaw<{ id: string }[]>`
        SELECT p.id
        FROM "Product" p
        LEFT JOIN "Category" c     ON c.id  = p."categoryId"
        LEFT JOIN "SubCategory" sc ON sc.id = p."subCategoryId"
        WHERE p."isPublished" = true AND (
              public.unaccent(p.name)                ILIKE public.unaccent(${pat})
          OR  public.unaccent(coalesce(p.brand, '')) ILIKE public.unaccent(${pat})
          OR  public.unaccent(coalesce(p.model, '')) ILIKE public.unaccent(${pat})
          OR  public.unaccent(coalesce(c.name, ''))  ILIKE public.unaccent(${pat})
          OR  public.unaccent(coalesce(sc.name, '')) ILIKE public.unaccent(${pat})
        )
        ORDER BY p."isFeatured" DESC, p."updatedAt" DESC
        LIMIT 48`
    ).map((r) => r.id)

    if (ids.length === 0) {
      ids = (
        await db.$queryRaw<{ id: string }[]>`
          SELECT p.id
          FROM "Product" p
          WHERE p."isPublished" = true AND (
                public.unaccent(coalesce(p."shortDescription", '')) ILIKE public.unaccent(${pat})
            OR  public.unaccent(coalesce(p.description, ''))         ILIKE public.unaccent(${pat})
            OR  public.unaccent(p.specs::text)                      ILIKE public.unaccent(${pat})
            OR  public.unaccent(p.translations::text)               ILIKE public.unaccent(${pat})
          )
          ORDER BY p."isFeatured" DESC, p."updatedAt" DESC
          LIMIT 48`
      ).map((r) => r.id)
    }
  }

  const found = ids.length
    ? await db.product.findMany({ where: { id: { in: ids } }, select: selectFields })
    : []
  const byId = new Map(found.map((p) => [p.id, p]))
  const rows = ids
    .map((id) => byId.get(id))
    .filter((p): p is (typeof found)[number] => Boolean(p))

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
