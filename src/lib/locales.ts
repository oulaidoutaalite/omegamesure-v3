import { cache } from 'react'

import { defaultLocale } from '@/i18n'
import { db } from '@/lib/db'

export type LocaleRow = {
  code: string
  name: string
  nativeName: string
  isDefault: boolean
  isActive: boolean
  isRtl: boolean
  order: number
}

const FLAGS: Record<string, string> = {
  fr: '🇫🇷', ar: '🇲🇦', en: '🇬🇧', es: '🇪🇸', de: '🇩🇪', it: '🇮🇹',
}

/** All locales known to the DB (active + inactive), cached per request. */
export const loadLocales = cache(async (): Promise<LocaleRow[]> => {
  const rows = await db.locale.findMany({ orderBy: { order: 'asc' } })
  return rows
})

/** Active locales excluding the default — what an admin translates into. */
export async function loadTranslatableLocales(): Promise<
  Array<{ code: string; nativeName: string; flag: string; isRtl: boolean }>
> {
  const rows = await loadLocales()
  return rows
    .filter((l) => l.isActive && l.code !== defaultLocale)
    .map((l) => ({
      code:       l.code,
      nativeName: l.nativeName,
      flag:       FLAGS[l.code] ?? '🏳️',
      isRtl:      l.isRtl,
    }))
}

export function getFlag(code: string): string {
  return FLAGS[code] ?? '🏳️'
}
