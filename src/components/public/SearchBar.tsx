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
        className="min-w-0 flex-1 bg-[#e7e1d9] px-5 py-3 text-[15px] italic text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange/50"
      />
      <button
        type="submit"
        aria-label={t('button')}
        className="grid shrink-0 place-items-center bg-orange px-5 text-white transition hover:bg-orange-600"
      >
        <IconSearch size={20} />
      </button>
    </form>
  )
}
