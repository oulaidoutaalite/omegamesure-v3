import { IconArrowRight, IconPhoto } from '@tabler/icons-react'
import Link from 'next/link'

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

export function ProductCard({ data, className }: { data: ProductCardData; className?: string }) {
  return (
    <Link
      href={`/produits/${data.slug}`}
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
        <div className="mt-auto flex items-center justify-between pt-3">
          {data.price !== null ? (
            <span className="text-sm font-semibold text-brand">
              {data.price.toLocaleString('fr-FR')} {data.currency}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Prix sur demande</span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
            Détails <IconArrowRight size={12} className="transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}
