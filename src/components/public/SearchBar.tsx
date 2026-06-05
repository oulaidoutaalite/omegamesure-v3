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
        className="min-w-0 flex-1 rounded-l-md border border-r-0 border-input bg-muted/50 px-4 py-2.5 text-sm italic text-foreground placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-orange/40"
      />
      <button
        type="submit"
        aria-label={t('button')}
        className="grid shrink-0 place-items-center rounded-r-md bg-orange px-4 text-white transition hover:bg-orange-600"
      >
        <IconSearch size={18} />
      </button>
    </form>
  )
}
