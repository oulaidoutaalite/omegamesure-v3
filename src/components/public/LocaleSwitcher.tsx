'use client'

import { IconWorld } from '@tabler/icons-react'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { defaultLocale, locales, type Locale } from '@/i18n'
import { cn } from '@/lib/utils'

const LABELS: Record<Locale, { native: string; flag: string }> = {
  fr: { native: 'Français', flag: '🇫🇷' },
  ar: { native: 'العربية',  flag: '🇲🇦' },
  en: { native: 'English',  flag: '🇬🇧' },
}

/** Strip a leading locale prefix (if any) from a pathname. */
function stripLocalePrefix(pathname: string): string {
  for (const l of locales) {
    if (l === defaultLocale) continue
    if (pathname === `/${l}` || pathname.startsWith(`/${l}/`)) {
      return pathname.replace(`/${l}`, '') || '/'
    }
  }
  return pathname || '/'
}

/** Compute the URL that swaps the current locale. */
function localizedHref(basePath: string, target: Locale): string {
  if (target === defaultLocale) return basePath || '/'
  return `/${target}${basePath === '/' ? '' : basePath}`
}

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale
  const pathname = usePathname() ?? '/'
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const basePath = stripLocalePrefix(pathname)
  const current = LABELS[currentLocale] ?? LABELS[defaultLocale]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-foreground/80 hover:bg-accent hover:text-foreground"
      >
        <IconWorld size={14} />
        <span className="hidden sm:inline">{current.native}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-border bg-card shadow-md"
        >
          <ul className="py-1">
            {locales.map((l) => {
              const isActive = l === currentLocale
              const def = LABELS[l]
              return (
                <li key={l}>
                  <Link
                    href={localizedHref(basePath, l)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-accent',
                      isActive ? 'text-brand' : 'text-foreground',
                    )}
                  >
                    <span>{def.flag}</span>
                    <span>{def.native}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
