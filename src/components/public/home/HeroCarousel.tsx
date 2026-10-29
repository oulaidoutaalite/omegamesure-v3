'use client'

import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

export type HeroSlide = {
  href: string
  name: string
  lead: string
  imageUrl: string | null
  cta: string
}

/**
 * Le heros du modele carlroth.com : une carte blanche posee sur la page grise,
 * l'image a gauche, le titre / l'accroche / le bouton a droite, des tirets en
 * guise d'indicateurs et deux fleches fines POSEES EN DEHORS de la carte.
 *
 * ⚠️ Ici on change de diapositive par opacite, pas par defilement : chaque
 * diapositive est une mise en page complete (image + colonne de texte), et un
 * `scroll-snap` sur des blocs aussi larges donnait un demi-glissement visible au
 * moindre redimensionnement. Le carrousel des sous-categories, lui, fait defiler
 * des cartes de meme largeur — c'est pourquoi il s'appuie, LUI, sur le scroll
 * natif. Les deux composants ont des besoins differents, pas une duplication.
 *
 * ⚠️ Les indicateurs sont des TIRETS, pas des pastilles : au-dela de trois ou
 * quatre diapositives les pastilles deviennent illisibles, et c'est le parti
 * qu'a pris le modele.
 */
export function HeroCarousel({
  slides,
  labelPrev,
  labelNext,
  autoplayMs = 6000,
}: {
  slides: HeroSlide[]
  labelPrev: string
  labelNext: string
  autoplayMs?: number
}) {
  const [i, setI] = useState(0)
  const [enPause, setEnPause] = useState(false)
  const n = slides.length

  const aller = useCallback((k: number) => setI(((k % n) + n) % n), [n])

  useEffect(() => {
    const sobre = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (sobre.matches || enPause || n < 2) return
    const t = setInterval(() => setI((k) => (k + 1) % n), autoplayMs)
    return () => clearInterval(t)
  }, [enPause, n, autoplayMs])

  if (!n) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setEnPause(true)}
      onMouseLeave={() => setEnPause(false)}
      onFocusCapture={() => setEnPause(true)}
      onBlurCapture={() => setEnPause(false)}
    >
      {n > 1 && (
        <>
          <FlecheHero cote="prev" label={labelPrev} onClick={() => aller(i - 1)} />
          <FlecheHero cote="next" label={labelNext} onClick={() => aller(i + 1)} />
        </>
      )}

      <div className="overflow-hidden rounded-lg bg-card shadow-card">
        <div className="grid lg:grid-cols-2">
          {/* Le volet image. Toutes les diapositives sont empilees et seule
              l'active est opaque : on evite le saut de hauteur d'un rendu
              conditionnel, et la transition reste franche. */}
          <div className="relative aspect-[4/3] bg-ink-900 lg:aspect-auto lg:min-h-[26rem]">
            {slides.map((s, k) =>
              s.imageUrl ? (
                <Image
                  key={s.href}
                  src={s.imageUrl}
                  alt=""
                  fill
                  priority={k === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  unoptimized={s.imageUrl.startsWith('/categories/')}
                  className={cn(
                    'object-cover transition-opacity duration-700',
                    k === i ? 'opacity-100' : 'opacity-0',
                  )}
                />
              ) : null,
            )}
          </div>

          {/* Le volet texte. */}
          <div className="flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-14 lg:px-12">
            <h1 className="text-3xl font-bold leading-[1.15] tracking-tight text-ink sm:text-4xl lg:text-[2.6rem]">
              {slides[i].name}
            </h1>
            {slides[i].lead && (
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-500">
                {slides[i].lead}
              </p>
            )}

            <div className="mt-8">
              <a
                href={slides[i].href}
                className="inline-flex items-center justify-center rounded-full bg-cta px-8 py-3.5
                           text-sm font-semibold text-white transition hover:bg-cta-600"
              >
                {slides[i].cta}
              </a>
            </div>

            {n > 1 && (
              <div className="mt-10 flex gap-2.5">
                {slides.map((s, k) => (
                  <button
                    key={s.href}
                    type="button"
                    onClick={() => aller(k)}
                    aria-label={s.name}
                    aria-current={k === i}
                    className={cn(
                      'h-[3px] w-10 rounded-full transition-colors',
                      k === i ? 'bg-ink' : 'bg-ink-200 hover:bg-ink-300',
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FlecheHero({
  cote, label, onClick,
}: {
  cote: 'prev' | 'next'
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'absolute top-1/2 z-10 hidden -translate-y-1/2 p-2 text-ink-300 transition',
        'hover:text-ink lg:block',
        cote === 'prev' ? '-start-8 xl:-start-11' : '-end-8 xl:-end-11',
      )}
    >
      {cote === 'prev' ? (
        <IconChevronLeft size={38} stroke={1.4} className="rtl:rotate-180" />
      ) : (
        <IconChevronRight size={38} stroke={1.4} className="rtl:rotate-180" />
      )}
    </button>
  )
}
