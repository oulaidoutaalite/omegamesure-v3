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
            _count: { select: { products: { where: { isPublished: true } } } },
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

  // Fetch products for this category
  const productRows = await db.product.findMany({
    where: { categoryId: category.id, isPublished: true },
    orderBy: [{ isFeatured: 'desc' }, { updatedAt: 'desc' }],
    take: 24,
    select: {
      id: true, name: true, slug: true, shortDescription: true,
      brand: true, model: true, price: true, currency: true, images: true,
      translations: true,
    },
  })

  const products: ProductCardData[] = productRows.map((p) => {
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

      {/* Sub-categories */}
      {category.subCategories.length > 0 && (
        <section className="border-b border-border py-10">
          <Container>
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('subCategoriesTitle')}
            </h2>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {category.subCategories.map((s) => {
                const sTr = s.translations as TranslationsJson
                const sName = pickLocaleField(s.name, sTr, 'name', locale)
                return (
                  <li key={s.id}>
                    <Link
                      href={`${withLocale(`/${category.slug}`, locale)}#${s.slug}`}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 transition hover:border-brand/40 hover:bg-accent/40"
                    >
                      <div>
                        <span className="text-sm font-medium">{sName}</span>
                        {s.isAutresSlot && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                            {t('autresBadge')}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {t('productCountLabel', { n: s._count.products })} <IconArrowRight size={12} className="inline rtl:rotate-180" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Container>
        </section>
      )}

      {/* Products */}
      <section className="py-16">
        <Container>
          <header className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand">{t('selection')}</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{t('productsHeading')}</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              {productRows.length > 1 ? t('shown', { n: productRows.length }) : t('shownOne', { n: productRows.length })}
            </p>
          </header>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
              <p className="text-sm text-muted-foreground">{t('noProducts')}</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href={withLocale('/devis', locale)}>{t('noProductsCta')}</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <li key={p.slug}><ProductCard data={p} locale={locale} /></li>
              ))}
            </ul>
          )}
        </Container>
      </section>
    </>
  )
}
