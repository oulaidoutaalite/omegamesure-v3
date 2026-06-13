import { IconArrowRight, IconCircleCheck } from '@tabler/icons-react'
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
}: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params
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
  const totalProducts = groups.reduce((n, g) => n + g.products.length, 0) + ungrouped.length

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
            <Link href={withLocale('/', locale)} className="hover:text-foreground">{tCommon('home')}</Link> / {catName}
          </nav>
          <div className="grid gap-6 lg:grid-cols-3">
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

            <aside className="rounded-2xl border border-border bg-card p-6">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('asideTitle')}</p>
              <p className="mt-1 text-sm">{t('asideLead')}</p>
              <Button asChild className="mt-4 w-full">
                <Link href={withLocale('/devis', locale)}>{tCta('requestQuote')}</Link>
              </Button>
            </aside>
          </div>
        </Container>
      </section>

      {/* Sub-categories nav */}
      {groups.length > 1 && (
        <section className="border-b border-border py-10">
          <Container>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('subCategoriesTitle')}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link
                    href={`${withLocale(`/${category.slug}`, locale)}#${g.slug}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition hover:border-brand/40 hover:bg-accent/40"
                  >
                    <span className="text-sm font-medium">
                      {g.name}
                      {g.isAutresSlot && (
                        <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                          {t('autresBadge')}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('productCountLabel', { n: g.products.length })} <IconArrowRight size={12} className="inline rtl:rotate-180" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Products grouped by sub-category (type) */}
      <section className="py-16">
        <Container>
          <header className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">{t('selection')}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{t('productsHeading')}</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {totalProducts > 1 ? t('shown', { n: totalProducts }) : t('shownOne', { n: totalProducts })}
            </p>
          </header>

          {totalProducts === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <p className="text-sm text-muted-foreground">{t('noProducts')}</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href={withLocale('/devis', locale)}>{t('noProductsCta')}</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-14">
              {groups.map((g) => (
                <div key={g.id} id={g.slug} className="scroll-mt-24">
                  <div className="mb-5 flex items-center gap-3">
                    <h3 className="text-lg font-bold tracking-tight">{g.name}</h3>
                    <span className="h-px flex-1 bg-border" />
                    <span className="shrink-0 text-xs text-muted-foreground">{t('productCountLabel', { n: g.products.length })}</span>
                  </div>
                  <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {g.products.map((p) => (
                      <li key={p.slug}><ProductCard data={p} locale={locale} /></li>
                    ))}
                  </ul>
                </div>
              ))}
              {ungrouped.length > 0 && (
                <div className="scroll-mt-24">
                  {groups.length > 0 && (
                    <div className="mb-5 flex items-center gap-3">
                      <h3 className="text-lg font-bold tracking-tight">{t('autresBadge')}</h3>
                      <span className="h-px flex-1 bg-border" />
                      <span className="shrink-0 text-xs text-muted-foreground">{t('productCountLabel', { n: ungrouped.length })}</span>
                    </div>
                  )}
                  <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {ungrouped.map((p) => (
                      <li key={p.slug}><ProductCard data={p} locale={locale} /></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
