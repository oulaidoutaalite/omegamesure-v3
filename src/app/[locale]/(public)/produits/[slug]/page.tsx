import { IconDownload, IconPhoto } from '@tabler/icons-react'
import { type Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AddToQuoteButton } from '@/components/public/cart/AddToQuoteButton'
import { Container } from '@/components/public/Container'
import { Button } from '@/components/ui/button'
import { defaultLocale, type Locale } from '@/i18n'
import { db } from '@/lib/db'
import { pickLocaleField, type TranslationsJson } from '@/lib/i18n-helpers'

export const dynamic = 'force-dynamic'

type ImageJson = { url: string; alt?: string; isPrimary?: boolean }

function withLocale(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path
  return `/${locale}${path}`
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  const p = await db.product.findUnique({
    where: { slug },
    select: { name: true, shortDescription: true, metaTitle: true, metaDescription: true, translations: true },
  })
  if (!p) return { title: 'Produit introuvable' }
  const tr = p.translations as TranslationsJson
  return {
    title:
      pickLocaleField(p.metaTitle, tr, 'metaTitle', locale) ??
      pickLocaleField(p.name,      tr, 'name',      locale),
    description:
      pickLocaleField(p.metaDescription ?? p.shortDescription, tr, 'metaDescription', locale) ?? undefined,
  }
}

export default async function ProductPage({
  params,
}: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const [product, t, tCommon, tCta] = await Promise.all([
    db.product.findFirst({
      where: { slug, isPublished: true },
      include: {
        category: { select: { name: true, slug: true, color: true, translations: true } },
        subCategory: { select: { name: true, translations: true } },
      },
    }),
    getTranslations({ locale, namespace: 'product' }),
    getTranslations({ locale, namespace: 'breadcrumb' }),
    getTranslations({ locale, namespace: 'cta' }),
  ])
  if (!product) notFound()

  const tr = product.translations as TranslationsJson
  const name             = pickLocaleField(product.name,             tr, 'name',             locale)
  const shortDescription = pickLocaleField(product.shortDescription, tr, 'shortDescription', locale)
  const description      = pickLocaleField(product.description,      tr, 'description',      locale)

  const imgs   = Array.isArray(product.images) ? (product.images as unknown as ImageJson[]) : []
  const sorted = [...imgs].sort((a, b) => (a.isPrimary ? -1 : 0) - (b.isPrimary ? -1 : 0))
  const main   = sorted[0]

  const catName    = product.category    ? pickLocaleField(product.category.name,    product.category.translations    as TranslationsJson, 'name', locale) : null
  const subCatName = product.subCategory ? pickLocaleField(product.subCategory.name, product.subCategory.translations as TranslationsJson, 'name', locale) : null

  return (
    <Container className="py-10 lg:py-14">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href={withLocale('/', locale)} className="hover:text-foreground">{tCommon('home')}</Link>
        {product.category && (
          <>
            {' / '}
            <Link href={withLocale(`/${product.category.slug}`, locale)} className="hover:text-foreground">
              {catName}
            </Link>
          </>
        )}
        {' / '}{name}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="space-y-3">
          <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
            {main ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={main.url} alt={main.alt ?? name} className="h-full w-full object-cover" />
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
                  <img src={img.url} alt={img.alt ?? name} className="h-full w-full object-cover" />
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
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{name}</h1>
            {shortDescription && (
              <p className="mt-3 text-base text-muted-foreground">{shortDescription}</p>
            )}
          </div>

          {product.price !== null && (
            <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{t('from')}</p>
              <p className="mt-1 text-3xl font-bold text-brand">
                {Number(product.price).toLocaleString(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-US' : 'fr-FR')} {product.currency}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{t('shippingNote')}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`${withLocale('/devis', locale)}?productSlug=${product.slug}`}>{tCta('requestQuote')}</Link>
            </Button>
            <AddToQuoteButton
              variant="full"
              item={{ slug: product.slug, name, brand: product.brand, image: main?.url ?? null }}
            />
            {product.datasheetUrl && product.datasheetVisible && (
              <Button asChild size="lg" variant="outline">
                <a href={product.datasheetUrl} target="_blank" rel="noreferrer">
                  <IconDownload size={16} /> {t('datasheet')}
                </a>
              </Button>
            )}
          </div>

          {product.category && (
            <p className="text-xs text-muted-foreground">
              {t('categoryLabel')}{' '}
              <Link href={withLocale(`/${product.category.slug}`, locale)} className="text-brand hover:underline">
                {catName}
              </Link>
              {subCatName && <> · {subCatName}</>}
            </p>
          )}
        </div>
      </div>

      {description && (
        <section className="mt-12 rounded-2xl border border-border bg-card p-8">
          <h2 className="mb-4 text-base font-semibold">{t('descriptionTitle')}</h2>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
            {description}
          </div>
        </section>
      )}
    </Container>
  )
}
