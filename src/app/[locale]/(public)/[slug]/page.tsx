import { IconCircleCheck } from '@tabler/icons-react'
import { type Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { ColumnConfigurator } from '@/components/public/ColumnConfigurator'
import { Container } from '@/components/public/Container'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'
import { Button } from '@/components/ui/button'
import { defaultLocale, type Locale } from '@/i18n'
import { db } from '@/lib/db'
import { pickLocaleField, type TranslationsJson } from '@/lib/i18n-helpers'
import { buildAlternates } from '@/lib/seo'

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
  // ⚠️ pickLocaleField renvoie sa valeur par défaut quand le champ demandé n'est pas traduit.
  // Lui passer `metaTitle ?? name` en défaut renverrait donc le nom FRANÇAIS sur /en/ et /ar/
  // (aucune catégorie n'a de metaTitle) et court-circuiterait le repli sur le nom traduit.
  return {
    title: pickLocaleField(cat.metaTitle, tr, 'metaTitle', locale)
        ?? pickLocaleField(cat.name, tr, 'name', locale),
    description:
      pickLocaleField(cat.metaDescription, tr, 'metaDescription', locale)
      ?? pickLocaleField(cat.description, tr, 'description', locale)
      ?? undefined,
    alternates: await buildAlternates(`/${slug}`, locale),
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
            parentId: true, isAutresSlot: true, translations: true,
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

  // ── Build a (possibly 2-level) sub-category tree ──────────────────────────
  // Leaves hold products; umbrellas (parentId === null with children) group leaves.
  // Categories without any parent/child links keep the previous flat behaviour.
  type Leaf = { slug: string; isAutresSlot: boolean; name: string; products: ProductCardData[] }
  type Top = { slug: string; name: string; count: number; children: Leaf[]; leaf?: Leaf }

  const subs = category.subCategories.map((s) => ({
    id: s.id, slug: s.slug, parentId: s.parentId, isAutresSlot: s.isAutresSlot,
    name: pickLocaleField(s.name, s.translations as TranslationsJson, 'name', locale),
    products: s.products.map(toCard),
  }))
  const childrenOf = (pid: string) => subs.filter((x) => x.parentId === pid)

  const ungroupedRows = await db.product.findMany({
    where: { categoryId: category.id, isPublished: true, subCategoryId: null },
    orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
    select: productSelect,
  })
  const ungrouped = ungroupedRows.map(toCard)

  // Ces catégories proposent des PRESTATIONS ou un configurateur, pas un catalogue figé :
  // leurs sous-catégories sont volontairement sans produit et doivent rester sélectionnables,
  // sinon la structure de l'offre n'apparaît nulle part sur le site.
  const quoteOnly = ['consommables', 'colonnes-chromatographie', 'metrologie', 'qualification-validation', 'consulting'].includes(category.slug)

  const tops: Top[] = []
  for (const s of subs.filter((x) => !x.parentId)) {
    const kids = childrenOf(s.id).filter((k) => k.products.length > 0)
      .map((k) => ({ slug: k.slug, isAutresSlot: k.isAutresSlot, name: k.name, products: k.products }))
    if (kids.length) {
      tops.push({ slug: s.slug, name: s.name, count: kids.reduce((n, k) => n + k.products.length, 0), children: kids })
    } else if (s.products.length || quoteOnly) {
      tops.push({ slug: s.slug, name: s.name, count: s.products.length, children: [], leaf: { slug: s.slug, isAutresSlot: s.isAutresSlot, name: s.name, products: s.products } })
    }
  }
  if (ungrouped.length) {
    const leaf = { slug: 'autres', isAutresSlot: true, name: t('autresBadge'), products: ungrouped }
    tops.push({ slug: 'autres', name: leaf.name, count: ungrouped.length, children: [], leaf })
  }

  const allLeaves: Leaf[] = tops.flatMap((tp) => (tp.children.length ? tp.children : tp.leaf ? [tp.leaf] : []))
  // Sans ?sub=, on ouvre sur la première sous-catégorie QUI A des produits : sinon une catégorie
  // bien fournie peut s'ouvrir sur une pastille vide et afficher « aucun produit ».
  const selected =
    allLeaves.find((g) => g.slug === subParam) ??
    allLeaves.find((g) => g.products.length > 0) ??
    allLeaves[0]
  const activeTop =
    tops.find((tp) => tp.children.some((k) => k.slug === selected?.slug)) ??
    tops.find((tp) => tp.slug === selected?.slug) ?? tops[0]
  const row2 = activeTop?.children ?? []
  // Colonnes chromatographie = configurateur (le client décrit sa colonne) au lieu d'un catalogue figé.
  const isColumnConfigurator = category.slug === 'colonnes-chromatographie' && selected?.slug === 'colonnes-chromato'

  const isMetrologie = category.slug === 'metrologie'

  return (
    <>
      {/* Hero */}
      <section
        className="border-b border-border py-4 sm:py-5"
        style={{ background: `linear-gradient(135deg, ${category.color ?? '#185FA5'}10 0%, transparent 100%)` }}
      >
        <Container>
          <nav className="mb-2 text-xs text-muted-foreground">
            <Link href={withLocale('/', locale)} className="hover:text-foreground">{tCommon('home')}</Link> / {catName}
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{catName}</h1>
              {catDesc && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{catDesc}</p>}
            </div>
            <Button asChild variant="outline" className="shrink-0">
              <Link href={withLocale('/devis', locale)}>{tCta('requestQuote')}</Link>
            </Button>
          </div>
          {isMetrologie && (
            <div className="mt-4 inline-flex items-start gap-2 rounded-lg border border-brand/20 bg-brand/5 p-3 text-sm">
              <IconCircleCheck size={16} className="mt-0.5 shrink-0 text-brand" />
              <span dangerouslySetInnerHTML={{ __html: t.raw('metrologyNotice') }} />
            </div>
          )}
        </Container>
      </section>

      {/* Sub-categories — level 1 (umbrellas / types) then level 2 (types) */}
      {tops.length > 1 && (
        <section className="border-b border-border py-4">
          <Container>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('subCategoriesTitle')}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {tops.map((tp) => {
                const active = tp.slug === activeTop?.slug
                const target = tp.children.length ? tp.children[0].slug : tp.slug
                return (
                  <li key={tp.slug}>
                    <Link
                      href={`${withLocale(`/${category.slug}`, locale)}?sub=${target}`}
                      scroll={false}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                        active
                          ? 'border-brand bg-brand text-white'
                          : 'border-border bg-card hover:border-brand/40 hover:bg-accent/40'
                      }`}
                    >
                      {tp.name}
                      {/* pas de « 0 » sur les sous-catégories de prestations, vides par nature */}
                      {tp.count > 0 && (
                        <span className={active ? 'text-xs text-white/80' : 'text-xs text-muted-foreground'}>
                          {tp.count}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
            {row2.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2 border-t border-dashed border-border pt-3">
                {row2.map((c) => {
                  const active = !!selected && c.slug === selected.slug
                  return (
                    <li key={c.slug}>
                      <Link
                        href={`${withLocale(`/${category.slug}`, locale)}?sub=${c.slug}`}
                        scroll={false}
                        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition ${
                          active
                            ? 'border-brand bg-brand/10 font-semibold text-brand'
                            : 'border-border bg-card text-muted-foreground hover:border-brand/40 hover:text-foreground'
                        }`}
                      >
                        {c.name}
                        {c.products.length > 0 && <span className="text-xs opacity-70">{c.products.length}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
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
            {selected && !isColumnConfigurator && selected.products.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selected.products.length > 1
                  ? t('shown', { n: selected.products.length })
                  : t('shownOne', { n: selected.products.length })}
              </p>
            )}
          </header>

          {isColumnConfigurator ? (
            <ColumnConfigurator />
          ) : !selected || selected.products.length === 0 ? (
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
