'use client'

import { IconMenu2, IconX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

import { Container } from '@/components/public/Container'
import { LocaleSwitcher } from '@/components/public/LocaleSwitcher'
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
}

/** Locale-agnostic path for a nav item (next-intl's Link adds the locale). */
function itemPath(item: HeaderNavItem): string {
  if (item.href) return item.href
  if (item.slug === 'accueil') return '/'
  return `/${item.slug}`
}

export function Header({ brand, items }: Props) {
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

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-shadow',
        scrolled
          ? 'border-b border-border bg-background/95 shadow-sm backdrop-blur'
          : 'bg-background/95 backdrop-blur',
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt={brand.siteName} className="h-9 w-auto" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-base font-bold text-white">
                Ω
              </span>
            )}
            {/* Brand name shown from md; tagline only on very wide screens to
                leave maximum room for the menu. */}
            <span className="hidden flex-col leading-tight md:flex">
              <span className="text-sm font-bold text-brand">{brand.siteName}</span>
              {brand.tagline && (
                <span className="hidden text-[10px] text-muted-foreground 2xl:block">{brand.tagline}</span>
              )}
            </span>
          </Link>

          {/* Auto-aligning menu: every item stays on a single line; the row
              scrolls horizontally if more items are added than fit. */}
          <nav
            className="hidden min-w-0 flex-1 items-center justify-start gap-0.5 overflow-x-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex"
          >
            {links.map((it) => {
              const path = itemPath(it)
              const isActive = pathname === path || (path !== '/' && pathname.startsWith(path))
              return (
                <Link
                  key={it.id}
                  href={path}
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-md px-2.5 py-2 text-[13px] font-medium leading-none transition',
                    isActive
                      ? 'text-brand'
                      : 'text-foreground/80 hover:bg-accent hover:text-foreground',
                  )}
                >
                  {it.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <LocaleSwitcher />
            {cta && (
              <Button asChild className="hidden whitespace-nowrap sm:inline-flex">
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

        {/* Mobile menu */}
        {open && (
          <nav className="border-t border-border py-3 lg:hidden">
            <ul className="space-y-1">
              {links.map((it) => {
                const path = itemPath(it)
                const isActive = pathname === path || (path !== '/' && pathname.startsWith(path))
                return (
                  <li key={it.id}>
                    <Link
                      href={path}
                      className={cn(
                        'block rounded-md px-3 py-2 text-sm font-medium',
                        isActive ? 'bg-brand/10 text-brand' : 'text-foreground hover:bg-accent',
                      )}
                    >
                      {it.label}
                    </Link>
                  </li>
                )
              })}
              {cta && (
                <li className="pt-2">
                  <Button asChild className="w-full">
                    <Link href={itemPath(cta)}>{cta.label}</Link>
                  </Button>
                </li>
              )}
            </ul>
          </nav>
        )}
      </Container>
    </header>
  )
}
