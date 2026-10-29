'use client'

import { IconSearch } from '@tabler/icons-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useRouter } from '@/navigation'
import { cn } from '@/lib/utils'

export function SearchBar({ className }: { className?: string }) {
  const t = useTranslations('search')
  const router = useRouter()
  const [q, setQ] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    router.push(`/recherche?q=${encodeURIComponent(term)}`)
  }

  return (
    <form onSubmit={onSubmit} className={cn('flex w-full items-stretch', className)} role="search">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('placeholder')}
        aria-label={t('button')}
        // Le beige de l'ancien theme jurait avec le marine : un gris bleute tres
        // clair, borde, tient mieux a cote du bouton cyan. Et pas d'italique :
        // il donnait au champ un air de citation plutot que de champ de saisie.
        className="min-w-0 flex-1 border border-r-0 border-border bg-secondary px-5 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:border-cta focus:outline-none focus:ring-1 focus:ring-inset focus:ring-cta"
      />
      <button
        type="submit"
        aria-label={t('button')}
        className="grid shrink-0 place-items-center bg-cta px-5 text-white transition hover:bg-cta-600"
      >
        <IconSearch size={20} />
      </button>
    </form>
  )
}
