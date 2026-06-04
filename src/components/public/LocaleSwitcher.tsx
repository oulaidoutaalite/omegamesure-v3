'use client'

import { IconWorld } from '@tabler/icons-react'
import { useLocale } from 'next-intl'
import { useEffect, useRef, useState, useTransition } from 'react'

import { locales, type Locale } from '@/i18n'
import { usePathname, useRouter } from '@/navigation'
import { cn } from '@/lib/utils'

const LABELS: Record<Locale, { native: string; flag: string }> = {
  fr: { native: 'Français', flag: '🇫🇷' },
  ar: { native: 'العربية',  flag: '🇲🇦' },
  en: { native: 'English',  flag: '🇬🇧' },
}

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale
  // next-intl-aware pathname: locale-agnostic (no prefix), e.g. "/metrologie"
  const pathname = usePathname()
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

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

  function switchTo(target: Locale) {
    setOpen(false)
    if (target === currentLocale) return
    // Re-render the SAME page in the chosen locale.
    startTransition(() => {
      router.replace(pathname, { locale: target })
    })
  }

  const current = LABELS[currentLocale] ?? LABELS.fr

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-foreground/80 hover:bg-accent hover:text-foreground disabled:opacity-60"
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
                  <button
                    type="button"
                    onClick={() => switchTo(l)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-accent',
                      isActive ? 'text-brand font-medium' : 'text-foreground',
                    )}
                  >
                    <span>{def.flag}</span>
                    <span>{def.native}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
