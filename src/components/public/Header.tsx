'use client'

import { IconMail, IconMenu2, IconPhone, IconX } from '@tabler/icons-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

import { CartWidget } from '@/components/public/cart/CartWidget'
import { Container } from '@/components/public/Container'
import { LocaleSwitcher } from '@/components/public/LocaleSwitcher'
import { SearchBar } from '@/components/public/SearchBar'
import { Button } from '@/components/ui/button'
import { Link, usePathname } from '@/navigation'
import { cn } from '@/lib/utils'

export type HeaderNavItem = {
  id: string
  label: string
  slug: string
  href: string | null
  isCta: boolean
}

export type HeaderBrand = {
  siteName: string
  tagline: string
  logoUrl: string
}

type Props = {
  brand: HeaderBrand
  items: HeaderNavItem[]
  /** Telephone et courriel, affiches dans la barre de service. */
  contact?: { phone?: string; email?: string }
}

/** Locale-agnostic path for a nav item (next-intl's Link adds the locale). */
function itemPath(item: HeaderNavItem): string {
  if (item.href) return item.href
  if (item.slug === 'accueil') return '/'
  return `/${item.slug}`
}

/**
 * L'en-tete, sur la structure de carlroth.com : une fine barre de service, puis
 * un bandeau blanc qui porte le logo, la baseline, la grande pilule de recherche
 * et les ronds d'icones, et enfin une barre de navigation en texte simple.
 *
 * ⚠️ La barre de navigation n'est PLUS un aplat de couleur. Le modele pose des
 * liens noirs sur blanc entre deux filets gris ; un bandeau colore sous le
 * bandeau blanc faisait deux barres empilees, et le rouge y aurait concurrence
 * les boutons d'action — or dans ce theme le rouge ne sert qu'a agir.
 */
export function Header({ brand, items, contact }: Props) {
  const pathname = usePathname() ?? '/'
  const [open, setOpen]         = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const cta   = items.find((i) => i.isCta)
  const links = items.filter((i) => !i.isCta)

  // Le logo est heberge hors du site, et le stockage Supabase repond en HTTP 402
  // depuis l'incident de quota : le repli n'est pas theorique, c'est ce qui
  // s'affiche aujourd'hui.
  //
  // ⚠️ On n'attend PAS `onError` pour basculer. Teste : l'image echoue avant que
  // React n'ait attache son gestionnaire, et le navigateur laissait sa vignette
  // d'image cassee en haut de chaque page. On fait l'inverse — la pastille Ω est
  // la par defaut, et l'image ne prend sa place qu'une fois CHARGEE.
  const [logoCharge, setLogoCharge] = useState(false)

  return (
    <header
      className={cn(
        'relative z-40 w-full bg-card transition-shadow',
        scrolled && 'shadow-sm',
      )}
    >
      {/* ── Barre de service ──────────────────────────────────────────────
          Masquee sous `sm` : sur un telephone, ces deux lignes mangeaient un
          tiers du premier ecran. */}
      <div className="hidden border-b border-border bg-surface text-ink-500 sm:block">
        <Container>
          <div className="flex h-9 items-center justify-between gap-4 text-[12px]">
            <div className="flex items-center gap-5">
              {contact?.phone && (
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1.5 transition hover:text-cta">
                  <IconPhone size={13} /> {contact.phone}
                </a>
              )}
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 transition hover:text-cta">
                  <IconMail size={13} /> {contact.email}
                </a>
              )}
            </div>
            <LocaleSwitcher />
          </div>
        </Container>
      </div>

      {/* ── Bandeau principal ─────────────────────────────────────────── */}
      <Container>
        <div className="flex min-h-[5.5rem] items-center gap-4 py-3 lg:gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <span className="relative grid h-16 place-items-center sm:h-[4.5rem]">
              {/* Le repli : un carre rouge frappe d'un Ω, dans l'esprit du carre
                  de marque du modele. Il tient la place tant que le vrai logo
                  n'est pas la — et il la garde si le logo ne vient jamais. */}
              {!logoCharge && (
                <span className="grid h-14 w-14 place-items-center rounded-md bg-cta text-2xl font-bold text-white">
                  Ω
                </span>
              )}
              {brand.logoUrl && (
                // 397x320 px a la source, affiche a 64 px de haut : sans
                // optimisation on telechargeait le logo pleine taille sur CHAQUE
                // page. `priority` car il est au-dessus de la ligne de flottaison.
                <Image
                  src={brand.logoUrl}
                  alt={brand.siteName}
                  width={397}
                  height={320}
                  priority
                  onLoad={(e) => {
                    // Une image en erreur peut quand meme declencher `load` sur
                    // certains navigateurs : on ne bascule que si elle a de
                    // vraies dimensions.
                    if (e.currentTarget.naturalWidth > 0) setLogoCharge(true)
                  }}
                  className={cn(
                    'h-16 w-auto object-contain sm:h-[4.5rem]',
                    logoCharge ? 'block' : 'absolute opacity-0',
                  )}
                />
              )}
            </span>
          </Link>

          {/* La baseline, en rouge et en italique gras comme chez le modele.
              Elle tient au-dessus de la recherche sur grand ecran, et disparait
              en dessous de `lg` ou la place manque. */}
          <div className="hidden min-w-0 flex-1 flex-col gap-2 lg:flex">
            {brand.tagline && (
              <p className="truncate text-[17px] font-bold italic leading-none text-cta">
                {brand.tagline}
              </p>
            )}
            <SearchBar className="max-w-2xl" />
          </div>

          <div className="ms-auto flex shrink-0 items-center gap-2">
            <CartWidget />
            {cta && (
              <Button
                asChild
                className="hidden whitespace-nowrap rounded-full bg-cta px-6 text-white hover:bg-cta-600 sm:inline-flex"
              >
                <Link href={itemPath(cta)}>{cta.label}</Link>
              </Button>
            )}
            <button
              type="button"
              onClick={() => setOpen((s) => !s)}
              className="rond-icone lg:hidden"
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </button>
          </div>
        </div>
      </Container>

      {/* La recherche sur sa propre ligne en dessous de `lg`, pour ne jamais
          entrer en collision avec les actions. */}
      <div className="border-t border-border lg:hidden">
        <Container>
          <div className="py-2.5">
            <SearchBar />
          </div>
        </Container>
      </div>

      {/* ── Barre de navigation ───────────────────────────────────────────
          Texte simple entre deux filets, comme « Assortment · Sale · New … »
          chez le modele. Elle colle seule en haut, pour que le contenu ne
          disparaisse jamais derriere le haut bandeau du logo. */}
      <div className="hidden border-y border-border bg-card lg:sticky lg:top-0 lg:z-40 lg:block">
        <Container>
          <nav className="flex flex-wrap items-stretch gap-x-2">
            {links.map((it) => {
              const path = itemPath(it)
              const isActive = pathname === path || (path !== '/' && pathname.startsWith(path))
              return (
                <Link
                  key={it.id}
                  href={path}
                  className={cn(
                    // Le filet rouge sous l'onglet actif : il raccroche la barre
                    // a la page sans rien ajouter au survol, et tient dans 3 px.
                    'relative whitespace-nowrap px-3 py-4 text-[15px] transition',
                    'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:transition-colors',
                    isActive
                      ? 'font-semibold text-ink after:bg-cta'
                      : 'text-ink-600 after:bg-transparent hover:text-cta hover:after:bg-cta/30',
                  )}
                >
                  {it.label}
                </Link>
              )
            })}
          </nav>
        </Container>
      </div>

      {/* ── Menu mobile ───────────────────────────────────────────────── */}
      {open && (
        <nav className="border-t border-border bg-card lg:hidden">
          <Container>
            <ul className="py-3">
              {links.map((it) => {
                const path = itemPath(it)
                const isActive = pathname === path || (path !== '/' && pathname.startsWith(path))
                return (
                  <li key={it.id}>
                    <Link
                      href={path}
                      className={cn(
                        'block border-s-[3px] px-4 py-2.5 text-[15px] transition',
                        isActive
                          ? 'border-cta bg-accent font-semibold text-ink'
                          : 'border-transparent text-ink-600 hover:bg-accent hover:text-ink',
                      )}
                    >
                      {it.label}
                    </Link>
                  </li>
                )
              })}
              {cta && (
                <li className="px-4 pb-1 pt-3">
                  <Button asChild className="w-full rounded-full">
                    <Link href={itemPath(cta)}>{cta.label}</Link>
                  </Button>
                </li>
              )}
            </ul>
          </Container>
        </nav>
      )}
    </header>
  )
}
