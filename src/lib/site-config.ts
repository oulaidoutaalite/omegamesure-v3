/**
 * Server-side helper for reading site configuration values.
 * Uses React 18 server-side caching for the lifetime of a request.
 */
import { cache } from 'react'

import { db } from './db'

type ConfigMap = Record<string, unknown>

/** Load all SiteConfig rows as a plain map. Cached per request. */
export const loadAllConfig = cache(async (): Promise<ConfigMap> => {
  const rows = await db.siteConfig.findMany({ select: { key: true, value: true } })
  const map: ConfigMap = {}
  for (const r of rows) map[r.key] = r.value
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

/** Convenience: shortcut for common values. */
export async function getBrandConfig() {
  const all = await loadAllConfig()
  return {
    siteName:   (all['site.name']        as string)  ?? 'Omega Mesure',
    tagline:    (all['site.tagline']     as string)  ?? '',
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
