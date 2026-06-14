import { IconCircleCheck } from '@tabler/icons-react'
import { type Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Container } from '@/components/public/Container'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'
import { Button } from '@/components/ui/button'
import { defaultLocale, type Locale } from '@/i18n'
import { db } from '@/lib/db'
import { pickLocaleField, type TranslationsJson } from '@/lib/i18n-helpers'

export const dynamic = 'force-dynamic'

type ImageJson = { url: string; alt?: string; isPrimary?: boolean }

function withLocale(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path
  if (path === '/') return `/${locale}`
  return `/${locale}${path}`
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  const cat = await db.category.findUnique({
    where: { slug },
    select: { name: true, description: true, metaTitle: true, metaDescription: true, translations: true },
  })
  if (!cat) return { title: 'Introuvable' }
  const tr = cat.translations as TranslationsJson
  return {
    title: pickLocaleField(cat.metaTitle ?? cat.name, tr, 'metaTitle', locale)
        ?? pickLocaleField(cat.name, tr, 'name', locale),
    description:
      pickLocaleField(cat.metaDescription ?? cat.description, tr, 'metaDescription', locale) ?? undefined,
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; slug: string }>
  searchParams: Promise<{ sub?: string }>
}) {
  const { locale, slug } = await params
  const { sub: subParam } = await searchParams
  setRequestLocale(locale)

  const productSelect = {
    id: true, name: true, slug: true, shortDescription: true,
    brand: true, model: true, price: true, currency: true, images: true,
    translations: true,
  } as const

  const [category, t, tCta, tCommon] = await Promise.all([
    db.category.findFirst({
      where: { slug, isPublished: true },
      include: {
        subCategories: {
          where: { isPublished: true },
          orderBy: { order: 'asc' },
          select: {
            id: true, name: true, slug: true, description: true,
            isAutresSlot: true, translations: true,
            products: {
              where: { isPublished: true },
              orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
              select: productSelect,
            },
          },
        },
      },
    }),
    getTranslations({ locale, namespace: 'category' }),
    getTranslations({ locale, namespace: 'cta' }),
    getTranslations({ locale, namespace: 'breadcrumb' }),
  ])
  if (!category) notFound()

  const catTr = category.translations as TranslationsJson
  const catName = pickLocaleField(category.name, catTr, 'name', locale)
  const catDesc = pickLocaleField(category.description, catTr, 'description', locale)

  const toCard = (p: {
    name: string; slug: string; shortDescription: string | null; brand: string | null
    model: string | null; price: unknown; currency: string; images: unknown; translations: unknown
  }): ProductCardData => {
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
      categoryColor: category.color,
    }
  }

  // Group products by sub-category (type), then ungrouped products as a trailing block
  const groups = category.subCategories
    .map((s) => ({
      id: s.id, slug: s.slug, isAutresSlot: s.isAutresSlot,
      name: pickLocaleField(s.name, s.translations as TranslationsJson, 'name', locale),
      products: s.products.map(toCard),
    }))
    .filter((g) => g.products.length > 0)

  const ungroupedRows = await db.product.findMany({
    where: { categoryId: category.id, isPublished: true, subCategoryId: null },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    select: productSelect,
  })
  const ungrouped = ungroupedRows.map(toCard)

  type Group = { id: string; slug: string; isAutresSlot: boolean; name: string; products: ProductCardData[] }
  const allGroups: Group[] = [
    ...groups,
    ...(ungrouped.length
      ? [{ id: 'autres', slug: 'autres', isAutresSlot: true, name: t('autresBadge'), products: ungrouped }]
      : []),
  ]
  const selected = allGroups.find((g) => g.slug === subParam) ?? allGroups[0]

  const isMetrologie = category.slug === 'metrologie'

  return (
    <>
      {/* Hero */}
      <section
        className="border-b border-border py-5 sm:py-6"
        style={{ background: `linear-gradient(135deg, ${category.color ?? '#185FA5'}10 0%, transparent 100%)` }}
      >
        <Container>
          <nav className="mb-3 text-xs text-muted-foreground">
            <Link href={withLocale('/', locale)} className="hover:text-foreground">{tCommon('home')}</Link> / {catName}
          </nav>
          <div className="grid items-center gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{catName}</h1>
              {catDesc && <p className="mt-3 text-base text-muted-foreground">{catDesc}</p>}
              {isMetrologie && (
                <div className="mt-5 inline-flex items-start gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
                  <IconCircleCheck size={16} className="mt-0.5 shrink-0 text-brand" />
                  <span dangerouslySetInnerHTML={{ __html: t.raw('metrologyNotice') }} />
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('asideTitle')}</p>
              <p className="mt-1 text-sm">{t('asideLead')}</p>
              <Button asChild className="mt-3 w-full">
                <Link href={withLocale('/devis', locale)}>{tCta('requestQuote')}</Link>
              </Button>
            </aside>
          </div>
        </Container>
      </section>

      {/* Sub-categories — select a type */}
      {allGroups.length > 1 && (
        <section className="border-b border-border py-4">
          <Container>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('subCategoriesTitle')}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {allGroups.map((g) => {
                const active = !!selected && g.slug === selected.slug
                return (
                  <li key={g.id}>
                    <Link
                      href={`${withLocale(`/${category.slug}`, locale)}?sub=${g.slug}`}
                      scroll={false}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? 'border-brand bg-brand text-white'
                          : 'border-border bg-card hover:border-brand/40 hover:bg-accent/40'
                      }`}
                    >
                      {g.name}
                      <span className={active ? 'text-xs text-white/80' : 'text-xs text-muted-foreground'}>
                        {g.products.length}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Container>
        </section>
      )}

      {/* Products of the selected type only */}
      <section className="py-8">
        <Container>
          <header className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">{t('selection')}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{selected ? selected.name : t('productsHeading')}</h2>
            </div>
            {selected && (
              <p className="text-xs text-muted-foreground">
                {selected.products.length > 1
                  ? t('shown', { n: selected.products.length })
                  : t('shownOne', { n: selected.products.length })}
              </p>
            )}
          </header>

          {!selected || selected.products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <p className="text-sm text-muted-foreground">{t('noProducts')}</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href={withLocale('/devis', locale)}>{t('noProductsCta')}</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {selected.products.map((p) => (
                <li key={p.slug}><ProductCard data={p} locale={locale} /></li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  )
}
