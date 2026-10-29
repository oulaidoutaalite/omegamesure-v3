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
    <form onSubmit={onSubmit} className={cn('pilule-recherche w-full', className)} role="search">
      {/* La pilule du modele carlroth.com : un champ blanc, une loupe discrete au
          bout, et le tout borde d'un seul trait arrondi.
          ⚠️ L'ancien dessin posait un gros bouton plein a droite ; ici le trait
          arrondi est porte par le FORMULAIRE (`.pilule-recherche`), pas par le
          champ, sinon le coin interieur du bouton depassait de la pilule. */}
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('placeholder')}
        aria-label={t('button')}
        className="min-w-0 flex-1 rounded-full bg-transparent px-6 py-3 text-[15px] text-foreground placeholder:text-ink-400 focus:outline-none"
      />
      <button
        type="submit"
        aria-label={t('button')}
        className="me-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-400 transition hover:bg-ink-100 hover:text-cta"
      >
        <IconSearch size={20} />
      </button>
    </form>
  )
}
