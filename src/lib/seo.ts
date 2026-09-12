/**
 * Helpers SEO : URL canonique du site, chemins localisés et alternates hreflang.
 *
 * ⚠️ L'URL canonique vit dans SiteConfig (`site.url`) et NON dans une variable
 * d'environnement : le domaine de préversion Vercel sert exactement le même
 * contenu que omegamesure.com, et un canonical pointant vers le mauvais hôte
 * est PIRE que pas de canonical du tout.
 */
import type { Metadata } from 'next'
import { cache } from 'react'

import { defaultLocale, locales, type Locale } from '@/i18n'

import { db } from './db'
import { loadAllConfig } from './site-config'

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

// ─── Marque & partage social ────────────────────────────────────────────────


/** Codes Open Graph attendus par les réseaux sociaux (fr → fr_FR, etc.). */
const OG_LOCALE: Record<string, string> = { fr: 'fr_FR', ar: 'ar_MA', en: 'en_US' }

export type SeoBrand = {
  siteName: string
  tagline: string
  description: string
  ogImage: string | null
  logo: string | null
  phone: string | null
  email: string | null
  address: string | null
}

/** Identité du site, telle que saisie dans l'admin. Cachée pour la requête. */
export const getSeoBrand = cache(async (locale: Locale): Promise<SeoBrand> => {
  let cfg: Record<string, unknown> = {}
  try {
    cfg = await loadAllConfig()
  } catch {
    cfg = {}                                  // la base peut être injoignable : on ne casse pas la page
  }
  const s = (k: string) => {
    const v = cfg[k]
    return typeof v === 'string' && v.trim() ? v.trim() : null
  }
  const localized = (k: string) => s(`${k}.${locale}`) ?? s(k)
  return {
    siteName: s('site.name') ?? 'Omega Mesure',
    tagline: localized('site.tagline') ?? '',
    description: localized('site.description') ?? localized('seo.description') ?? '',
    ogImage: s('seo.ogImage') ?? s('branding.logo'),
    logo: s('branding.logo'),
    phone: s('contact.phone'),
    email: s('contact.email'),
    address: s('contact.address'),
  }
})

/**
 * Balises Open Graph + carte Twitter, à étaler dans le retour de `generateMetadata`.
 * `path` est le chemin NON préfixé ; l'URL et l'image sont rendues absolues.
 */
export async function buildSocial(opts: {
  path: string
  locale: Locale
  title: string
  description?: string | null
  /** visuel propre à la page (photo produit) ; sinon l'image OG du site */
  image?: string | null
  type?: 'website' | 'article'
}): Promise<Pick<Metadata, 'openGraph' | 'twitter'>> {
  const [base, brand] = await Promise.all([getSiteUrl(), getSeoBrand(opts.locale)])
  const url = base + localePath(opts.path, opts.locale)
  const description = opts.description?.trim() || brand.description || undefined
  // Priorité : visuel de la page (photo produit) > image OG choisie dans l'admin
  // > bannière générée. Le LOGO n'est plus servi tel quel : carré et recadré,
  // il fait un mauvais aperçu sur les réseaux.
  const raw = opts.image ?? (brand.ogImage && brand.ogImage !== brand.logo ? brand.ogImage : null)
  const fallback = `${base}/og?b=${encodeURIComponent(brand.siteName)}&t=${encodeURIComponent(opts.title)}`
  const images = [raw ? (raw.startsWith('http') ? raw : base + raw) : fallback]

  return {
    openGraph: {
      type: opts.type ?? 'website',
      url,
      siteName: brand.siteName,
      title: opts.title,
      description,
      images,
      locale: OG_LOCALE[opts.locale] ?? OG_LOCALE.fr,
      alternateLocale: locales.filter((l) => l !== opts.locale).map((l) => OG_LOCALE[l]).filter(Boolean),
    },
    twitter: {
      card: images ? 'summary_large_image' : 'summary',
      title: opts.title,
      description,
      images,
    },
  }
}

/**
 * Meta description d'une fiche produit, avec repli sur la description longue.
 *
 * Le problème : la description venait de `metaDescription ?? shortDescription`.
 * Or beaucoup de résumés sont des artefacts d'import (« 1 modèle », « 2 modèles »)
 * ou manquent tout à fait — mesuré sur le catalogue : 1 142 fiches publiées sur
 * 2 666 annonçaient à Google une description inutilisable ou aucune.
 *
 * La réponse : quand le résumé est trop mince pour faire un extrait de résultat,
 * on se rabat sur la description longue, tronquée proprement. Rien n'est réécrit
 * en base ; une fiche sans aucune matière reste simplement sans description.
 *
 * ⚠️ `metaDescription` est respecté tel quel quelle que soit sa longueur : il est
 * saisi à la main, donc délibéré.
 */
const SEUIL_RESUME = 50

export function metaDescriptionFrom(
  meta: string | null | undefined,
  court: string | null | undefined,
  long: string | null | undefined,
  max = 155,
): string | undefined {
  const net = (s: string | null | undefined) => String(s ?? '').replace(/\s+/g, ' ').trim()
  const m = net(meta)
  if (m) return m

  const c = net(court)
  if (c.length >= SEUIL_RESUME) return c

  const l = net(long)
  if (l) {
    if (l.length <= max) return l
    // couper sur un mot, pas au milieu — et jamais trop court si l'espace tombe mal
    const tranche = l.slice(0, max + 1)
    const esp = tranche.lastIndexOf(' ')
    const base = esp > 60 ? tranche.slice(0, esp) : l.slice(0, max)
    return base.replace(/[\s,;:.…-]+$/, '') + '…'
  }

  // mieux vaut un résumé maigre que rien du tout
  return c || undefined
}
