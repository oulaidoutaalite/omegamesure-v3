/**
 * Server-side helper for reading site configuration values.
 * Uses React 18 server-side caching for the lifetime of a request.
 */
import { cache } from 'react'

import { db } from './db'

type ConfigMap = Record<string, unknown>

/** Keys never exposed through the config loader (secrets read elsewhere). */
const PRIVATE_CONFIG_PREFIXES = ['storage.']

/** Load all SiteConfig rows as a plain map. Cached per request.
 *  Secret keys (e.g. `storage.*`) are excluded so they can never leak into
 *  data that may reach the client. */
export const loadAllConfig = cache(async (): Promise<ConfigMap> => {
  const rows = await db.siteConfig.findMany({ select: { key: true, value: true } })
  const map: ConfigMap = {}
  for (const r of rows) {
    if (PRIVATE_CONFIG_PREFIXES.some((p) => r.key.startsWith(p))) continue
    map[r.key] = r.value
  }
  return map
})

export async function getConfig<T = unknown>(key: string, fallback?: T): Promise<T> {
  const all = await loadAllConfig()
  const v = all[key]
  return (v === undefined || v === null) ? (fallback as T) : (v as T)
}

export async function getConfigGroup(category: string): Promise<ConfigMap> {
  const rows = await db.siteConfig.findMany({
    where: { category },
    select: { key: true, value: true },
  })
  const map: ConfigMap = {}
  for (const r of rows) map[r.key] = r.value
  return map
}

/** Convenience: shortcut for common values.
 *  Pass a locale to get the localized tagline (falls back to the default
 *  `site.tagline` when `site.tagline.<locale>` is not set). The site name
 *  is a brand name and stays identical across locales. */
export async function getBrandConfig(locale?: string) {
  const all = await loadAllConfig()
  const localizedTagline =
    locale && typeof all[`site.tagline.${locale}`] === 'string' && (all[`site.tagline.${locale}`] as string).trim()
      ? (all[`site.tagline.${locale}`] as string)
      : (all['site.tagline'] as string) ?? ''
  return {
    siteName:   (all['site.name']        as string)  ?? 'Omega Mesure',
    tagline:    localizedTagline,
    primary:    (all['branding.primary'] as string)  ?? '#185FA5',
    logoUrl:    (all['branding.logo']    as string)  ?? '',
    faviconUrl: (all['branding.favicon'] as string)  ?? '',
  }
}

export async function getContactConfig() {
  const all = await loadAllConfig()
  return {
    address: (all['contact.address'] as string) ?? '',
    phone:   (all['contact.phone']   as string) ?? '',
    email:   (all['contact.email']   as string) ?? '',
    hours:   (all['contact.hours']   as string) ?? '',
  }
}

export async function getSocialConfig() {
  const all = await loadAllConfig()
  return {
    linkedin:  (all['social.linkedin']  as string) ?? '',
    facebook:  (all['social.facebook']  as string) ?? '',
    instagram: (all['social.instagram'] as string) ?? '',
    youtube:   (all['social.youtube']   as string) ?? '',
    twitter:   (all['social.twitter']   as string) ?? '',
  }
}
