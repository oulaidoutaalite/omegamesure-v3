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
  // Le logo est heberge hors du site : s'il ne charge pas, on retombe sur la
  // pastille Ω plutot que d'afficher l'icone d'image cassee du navigateur.
  const [logoCasse, setLogoCasse] = useState(false)

  return (
    <header
      className={cn(
        // The header itself is not sticky (the tall logo row scrolls away);
        // only the navy menu bar below sticks to the top — see its classes.
        'relative z-40 w-full transition-shadow',
        scrolled
          ? 'border-b border-border bg-background/95 shadow-sm backdrop-blur'
          : 'bg-background/95 backdrop-blur',
      )}
    >
      {/* ── Barre de service ──────────────────────────────────────────────
          Le marine le plus sombre de la palette, pour que le bandeau logo
          blanc qui suit paraisse poser dessus. Masquee sous `sm` : sur un
          telephone, ces deux lignes mangeaient un tiers du premier ecran. */}
      <div className="hidden bg-brand-800 text-white/80 sm:block">
        <Container>
          <div className="flex h-9 items-center justify-between gap-4 text-[12px]">
            <div className="flex items-center gap-5">
              {contact?.phone && (
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-1.5 transition hover:text-white">
                  <IconPhone size={13} /> {contact.phone}
                </a>
              )}
              {contact?.email && (
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 transition hover:text-white">
                  <IconMail size={13} /> {contact.email}
                </a>
              )}
            </div>
            {brand.tagline && (
              <span className="hidden truncate text-white/60 lg:block">{brand.tagline}</span>
            )}
          </div>
        </Container>
      </div>

      <Container>
        <div className="flex min-h-16 items-center justify-between gap-4 py-2">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {brand.logoUrl && !logoCasse ? (
              // 397x320 px et 191 ko a la source, affiche a 96 px de haut : sans
              // optimisation on telechargeait le logo pleine taille sur CHAQUE page.
              // `priority` car il est au-dessus de la ligne de flottaison.
              <Image
                src={brand.logoUrl}
                alt={brand.siteName}
                width={397}
                height={320}
                priority
                onError={() => setLogoCasse(true)}
                className="h-24 w-auto object-contain sm:h-28"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-base font-bold text-white">
                Ω
              </span>
            )}
            {/* Le nom seul : l'accroche est remontee dans la barre de service,
                ou elle ne concurrence plus le logo. */}
            <span className="hidden text-sm font-bold uppercase tracking-wide text-brand md:block">
              {brand.siteName}
            </span>
          </Link>

          {/* Search bar (Reagecon-style), centered between logo and actions.
              Shown inline only on desktop (lg+). On tablet/mobile it moves to its
              own full-width row just below (so it never collides with the actions). */}
          <div className="hidden flex-1 justify-center px-4 lg:flex">
            <SearchBar className="max-w-xl" />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CartWidget />
            <LocaleSwitcher />
            {cta && (
              <Button
                asChild
                className="hidden whitespace-nowrap bg-cta uppercase tracking-wide text-white hover:bg-cta-600 sm:inline-flex"
              >
                <Link href={itemPath(cta)}>{cta.label}</Link>
              </Button>
            )}
            <button
              type="button"
              onClick={() => setOpen((s) => !s)}
              className="grid h-10 w-10 place-items-center rounded-lg text-foreground hover:bg-accent lg:hidden"
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Search row for tablet/mobile (< lg): full width, always visible,
          so the search stays prominent without crowding the actions row. */}
      <div className="border-t border-border lg:hidden">
        <Container>
          <div className="py-2">
            <SearchBar />
          </div>
        </Container>
      </div>

      {/* Desktop menu bar — navy, full width (Reagecon-style).
          Sticks to the top alone so the page content is never hidden
          behind the tall logo row. */}
      <div className="hidden bg-brand shadow-sm lg:sticky lg:top-0 lg:z-40 lg:block">
        <Container>
          <nav className="flex flex-wrap items-stretch">
            {links.map((it) => {
              const path = itemPath(it)
              const isActive = pathname === path || (path !== '/' && pathname.startsWith(path))
              return (
                <Link
                  key={it.id}
                  href={path}
                  className={cn(
                    // Le filet cyan sous l'onglet actif remplace la pastille
                    // arrondie : il raccroche la barre a la page sans rien
                    // ajouter au survol, et tient dans 2 px de hauteur.
                    'relative whitespace-nowrap px-4 py-3.5 text-[13px] font-semibold uppercase tracking-wide transition',
                    'after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:transition-colors',
                    isActive
                      ? 'text-white after:bg-cta'
                      : 'text-white/80 after:bg-transparent hover:text-white hover:after:bg-white/30',
                  )}
                >
                  {it.label}
                </Link>
              )
            })}
          </nav>
        </Container>
      </div>

      {/* ── Menu mobile ───────────────────────────────────────────────────
          Sur fond marine, comme la barre de navigation du bureau : c'est le
          meme menu, il doit se reconnaitre. Et le filet cyan a gauche de
          l'entree active reprend celui qui souligne l'onglet sur grand ecran. */}
      {open && (
        <nav className="bg-brand lg:hidden">
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
                        'block border-s-[3px] px-4 py-2.5 text-sm font-semibold uppercase tracking-wide transition',
                        isActive
                          ? 'border-cta bg-white/5 text-white'
                          : 'border-transparent text-white/75 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      {it.label}
                    </Link>
                  </li>
                )
              })}
              {cta && (
                <li className="px-4 pb-1 pt-3">
                  <Button asChild className="w-full uppercase tracking-wide">
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
