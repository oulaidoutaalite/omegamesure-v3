/**
 * Helpers SEO : URL canonique du site, chemins localisés et alternates hreflang.
 *
 * ⚠️ L'URL canonique vit dans SiteConfig (`site.url`) et NON dans une variable
 * d'environnement : le domaine de préversion Vercel sert exactement le même
 * contenu que omegamesure.com, et un canonical pointant vers le mauvais hôte
 * est PIRE que pas de canonical du tout.
 */
import { cache } from 'react'

import { defaultLocale, locales, type Locale } from '@/i18n'

import { db } from './db'

const FALLBACK_SITE_URL = 'https://omegamesure.com'

/** URL canonique du site, sans slash final. Mise en cache pour la requête. */
export const getSiteUrl = cache(async (): Promise<string> => {
  let stored: unknown
  try {
    const row = await db.siteConfig.findUnique({ where: { key: 'site.url' }, select: { value: true } })
    stored = row?.value
  } catch {
    stored = undefined                      // la base peut être injoignable : on ne casse pas la page
  }
  const raw =
    (typeof stored === 'string' && stored.trim() ? stored.trim() : null) ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    FALLBACK_SITE_URL
  return raw.replace(/\/+$/, '')
})

/** Chemin localisé — le français est la locale par défaut et n'a PAS de préfixe. */
export function localePath(path: string, locale: Locale | string): string {
  if (locale === defaultLocale) return path
  if (path === '/') return `/${locale}`
  return `/${locale}${path}`
}

/** Toutes les variantes linguistiques d'un chemin, en URL absolues. */
export function languageAlternates(base: string, path: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const l of locales) out[l] = base + localePath(path, l)
  out['x-default'] = base + localePath(path, defaultLocale)
  return out
}

/**
 * `alternates` prêt pour `generateMetadata` : canonical de la locale courante
 * + hreflang vers les trois versions. `path` est le chemin NON préfixé.
 */
export async function buildAlternates(path: string, locale: Locale) {
  const base = await getSiteUrl()
  return { canonical: base + localePath(path, locale), languages: languageAlternates(base, path) }
}
