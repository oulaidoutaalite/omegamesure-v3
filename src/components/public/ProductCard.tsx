import { IconArrowRight, IconPhoto } from '@tabler/icons-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { AddToQuoteButton } from '@/components/public/cart/AddToQuoteButton'
import { defaultLocale, type Locale } from '@/i18n'
import { cn } from '@/lib/utils'

export type ProductCardData = {
  slug: string
  name: string
  shortDescription: string | null
  brand: string | null
  model: string | null
  price: number | null
  currency: string
  imageUrl: string | null
  categoryColor?: string | null
}

function withLocale(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path
  return `/${locale}${path}`
}

export async function ProductCard({
  data, locale, className,
}: {
  data: ProductCardData
  locale: Locale
  className?: string
}) {
  const t = await getTranslations({ locale, namespace: 'product' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  return (
    <Link
      href={withLocale(`/produits/${data.slug}`, locale)}
      className={cn(
        'group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-md',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {data.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.imageUrl}
            alt={data.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            <IconPhoto size={36} />
          </div>
        )}
        {data.categoryColor && (
          <span
            className="absolute left-3 top-3 inline-block h-2 w-2 rounded-full ring-2 ring-white"
            style={{ background: data.categoryColor }}
            aria-hidden
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        {(data.brand || data.model) && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {[data.brand, data.model].filter(Boolean).join(' · ')}
          </p>
        )}
        <h3 className="text-sm font-semibold leading-tight">{data.name}</h3>
        {data.shortDescription && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{data.shortDescription}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {data.price !== null ? (
            <span className="text-sm font-semibold text-brand">
              {data.price.toLocaleString(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-US' : 'fr-FR')} {data.currency}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{t('onRequest')}</span>
          )}
          <div className="flex items-center gap-2">
            <AddToQuoteButton
              variant="card"
              item={{ slug: data.slug, name: data.name, brand: data.brand, image: data.imageUrl }}
            />
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
              {tCommon('details')} <IconArrowRight size={12} className="transition group-hover:translate-x-0.5 rtl:rotate-180" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
