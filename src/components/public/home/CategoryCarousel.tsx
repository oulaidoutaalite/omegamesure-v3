'use client'

import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

export type CarouselItem = {
  href: string
  name: string
  /** ⚠️ Libelle deja mis en forme cote serveur (« 97 produits »). Une fonction
   *  de formatage ne passe pas la frontiere serveur/client : elle n'est pas
   *  serialisable, et Next refuse le rendu. */
  countLabel: string
  imageUrl: string
  famille: string
}

/**
 * Le carrousel des sous-categories, sur le modele de carlroth.com : des cartes
 * blanches qui defilent, des fleches en dehors du cadre, defilement automatique
 * que le survol suspend.
 *
 * ⚠️ `object-contain`, et surtout PAS `object-cover`. L'image d'une carte n'est
 * pas une illustration cadree mais la photo d'un vrai produit de la
 * sous-categorie, detouree sur blanc : la rogner couperait l'instrument en deux.
 * C'est la difference avec `CategoryTile`, dont les vignettes sont fabriquees au
 * bon rapport et doivent, elles, remplir leur bloc.
 *
 * ⚠️ Le defilement s'appuie sur le scroll NATIF (`scroll-snap` + `scrollBy`) et
 * non sur un `transform`. C'est ce qui fait marcher du premier coup le geste
 * tactile, la molette, la navigation au clavier et la barre de defilement — un
 * carrousel en `translateX` aurait fallu les reimplementer tous les quatre.
 *
 * ⚠️ En arabe la page est en RTL, et `scrollLeft` y devient negatif : le sens
 * d'une fleche doit etre inverse, sinon « suivant » remonte le carrousel. D'ou
 * la lecture de `direction` calculee plutot qu'un signe code en dur.
 */
export function CategoryCarousel({
  items,
  labelPrev,
  labelNext,
  autoplayMs = 3800,
}: {
  items: CarouselItem[]
  labelPrev: string
  labelNext: string
  autoplayMs?: number
}) {
  const piste = useRef<HTMLUListElement>(null)
  const [enPause, setEnPause] = useState(false)
  const [peutReculer, setPeutReculer] = useState(false)
  const [peutAvancer, setPeutAvancer] = useState(true)

  /** Un « pas » = la largeur visible moins une carte, pour garder un repere. */
  const pas = useCallback(() => {
    const el = piste.current
    if (!el) return 0
    const carte = el.firstElementChild as HTMLElement | null
    const large = carte ? carte.offsetWidth + 16 : 240
    return Math.max(large, el.clientWidth - large)
  }, [])

  const rtl = useCallback(
    () => (piste.current ? getComputedStyle(piste.current).direction === 'rtl' : false),
    [],
  )

  const glisser = useCallback(
    (sens: 1 | -1) => {
      const el = piste.current
      if (!el) return
      el.scrollBy({ left: (rtl() ? -sens : sens) * pas(), behavior: 'smooth' })
    },
    [pas, rtl],
  )

  /** Met a jour l'etat des fleches, et reboucle quand on touche le bout. */
  const majBornes = useCallback(() => {
    const el = piste.current
    if (!el) return
    // ⚠️ `scrollLeft` est negatif en RTL sur les navigateurs recents : on le
    // ramene a une distance positive avant de comparer.
    const parcouru = Math.abs(el.scrollLeft)
    const reste = el.scrollWidth - el.clientWidth - parcouru
    setPeutReculer(parcouru > 8)
    setPeutAvancer(reste > 8)
  }, [])

  useEffect(() => {
    const el = piste.current
    if (!el) return
    majBornes()
    el.addEventListener('scroll', majBornes, { passive: true })
    window.addEventListener('resize', majBornes)
    return () => {
      el.removeEventListener('scroll', majBornes)
      window.removeEventListener('resize', majBornes)
    }
  }, [majBornes])

  useEffect(() => {
    // ⚠️ Pas de defilement automatique si la personne a demande moins
    // d'animations : un carrousel qui bouge seul est precisement ce que ce
    // reglage systeme vise.
    const sobre = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (sobre.matches || enPause || items.length < 3) return

    const t = setInterval(() => {
      const el = piste.current
      if (!el) return
      const parcouru = Math.abs(el.scrollLeft)
      const fini = el.scrollWidth - el.clientWidth - parcouru <= 8
      if (fini) el.scrollTo({ left: 0, behavior: 'smooth' })
      else glisser(1)
    }, autoplayMs)
    return () => clearInterval(t)
  }, [enPause, glisser, autoplayMs, items.length])

  if (!items.length) return null

  return (
    <div
      className="relative"
      onMouseEnter={() => setEnPause(true)}
      onMouseLeave={() => setEnPause(false)}
      onFocusCapture={() => setEnPause(true)}
      onBlurCapture={() => setEnPause(false)}
    >
      <Fleche cote="prev" label={labelPrev} actif={peutReculer} onClick={() => glisser(-1)} />
      <Fleche cote="next" label={labelNext} actif={peutAvancer} onClick={() => glisser(1)} />

      <ul
        ref={piste}
        // `scrollbar-width: none` cote CSS natif : la barre ferait doublon avec
        // les fleches, mais le defilement lui-meme reste bien natif.
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1
                   [-ms-overflow-style:none] [scrollbar-width:none]
                   [&::-webkit-scrollbar]:hidden"
      >
        {items.map((it) => (
          <li key={it.href} className="carte-piste">
            <a href={it.href} className="group carte-lien">
              <div className="aspect-square bg-white">
                {/* ⚠️ Pas de `fill` ici. Il fait injecter a Next un style EN LIGNE
                    d'environ 115 octets (`position:absolute;height:100%;...`) sur
                    chaque image — 37 Ko pour 323 cartes. Des dimensions
                    explicites donnent le meme rendu sans ce style. */}
                <Image
                  src={it.imageUrl}
                  alt=""
                  width={300}
                  height={300}
                  // Les photos de `/produits/` sont deja encodees en WebP a la
                  // bonne taille : les repasser par l'optimiseur consommerait le
                  // quota de transformations sans rien gagner.
                  unoptimized={it.imageUrl.startsWith('/produits/')}
                  className="carte-photo"
                />
              </div>

              <div className="carte-corps">
                <p className="carte-famille">{it.famille}</p>
                <h3 className="carte-titre">{it.name}</h3>
                <p className="carte-compte">{it.countLabel}</p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Les fleches de Carl Roth : fines, grises, POSEES EN DEHORS du cadre.
 *
 * ⚠️ Elles restent dans le flux (pas de `display:none` quand elles sont
 * inactives) : les faire disparaitre en bout de course decalait le carrousel
 * d'une quarantaine de pixels a chaque extremite.
 */
function Fleche({
  cote, label, actif, onClick,
}: {
  cote: 'prev' | 'next'
  label: string
  actif: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={!actif}
      className={cn(
        'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center',
        'rounded-full border border-border bg-white text-ink-500 shadow-sm transition',
        'hover:border-cta/40 hover:text-cta disabled:opacity-30 disabled:shadow-none sm:inline-flex',
        // En RTL les deux fleches echangent leur bord ET leur dessin : `start`
        // et `end` s'en chargent, `rtl:rotate-180` retourne le chevron.
        cote === 'prev' ? '-start-4 lg:-start-6' : '-end-4 lg:-end-6',
      )}
    >
      {cote === 'prev' ? (
        <IconChevronLeft size={20} className="rtl:rotate-180" />
      ) : (
        <IconChevronRight size={20} className="rtl:rotate-180" />
      )}
    </button>
  )
}
