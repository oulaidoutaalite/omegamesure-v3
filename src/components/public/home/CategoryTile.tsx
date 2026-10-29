import { IconArrowRight } from '@tabler/icons-react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

/**
 * Vignette de categorie : une photo, un voile marine, l'intitule en bas.
 *
 * ⚠️ `object-cover` ici, et non `object-contain` comme sur les cartes produit.
 * Les deux images n'ont pas la meme nature : une carte produit montre un article
 * detoure, qu'il faut voir entier ; une vignette de categorie est une image
 * d'illustration, cadree, qui doit remplir son bloc. Les vignettes sont
 * d'ailleurs fabriquees au bon rapport (3/2) par `_vignettes-categories.cjs`.
 *
 * ⚠️ Le voile n'est pas un aplat uniforme mais un degrade qui ne s'assombrit
 * qu'en bas : sur un aplat, les produits clairs du haut de l'image
 * disparaissaient, et sans voile du tout le texte blanc devenait illisible des
 * que la photo etait pale — ce qui est le cas de presque toutes les notres,
 * detourees sur fond blanc.
 */
export function CategoryTile({
  href,
  name,
  count,
  countLabel,
  imageUrl,
  discoverLabel,
  size = 'default',
  className,
}: {
  href: string
  name: string
  count: number
  countLabel: string
  imageUrl: string | null
  discoverLabel: string
  size?: 'default' | 'large'
  className?: string
}) {
  return (
    <a
      href={href}
      className={cn(
        'group relative block overflow-hidden bg-ink-800',
        // ⚠️ La grande tuile n'impose PAS son rapport : elle s'etire sur les
        // deux rangees que la grille lui donne. Lui laisser `aspect-[16/10]`
        // la desalignait des quatre petites posees a sa droite.
        size === 'large' ? 'aspect-[3/2] lg:aspect-auto lg:h-full' : 'aspect-[3/2]',
        className,
      )}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={size === 'large' ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
          // Meme regle que pour les photos produit : les vignettes de
          // `/categories/` sont deja encodees en WebP au bon format, les faire
          // repasser par l'optimiseur ne gagnerait rien et consommerait le quota
          // de transformations de l'hebergeur.
          unoptimized={imageUrl.startsWith('/categories/')}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_30%,theme(colors.brand.500),theme(colors.brand.800))]" />
      )}

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-ink-900/35 to-transparent transition-opacity duration-300 group-hover:from-ink-900/95"
      />

      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h3
          className={cn(
            'font-semibold uppercase leading-tight tracking-wide text-white',
            size === 'large' ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg',
          )}
        >
          {name}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-[12px] text-white/75">
          {count > 0 && <span>{countLabel}</span>}
          <span className="inline-flex items-center gap-1 font-semibold text-cta-400 transition group-hover:gap-2">
            {discoverLabel}
            <IconArrowRight size={13} className="rtl:rotate-180" />
          </span>
        </div>
      </div>

      {/* Filet cyan qui se deploie au survol, en echo a la barre de navigation. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-cta transition-transform duration-300 group-hover:scale-x-100"
      />
    </a>
  )
}
