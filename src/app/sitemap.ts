import type { MetadataRoute } from 'next'

import { db } from '@/lib/db'
import { getSiteUrl, languageAlternates } from '@/lib/seo'

// Le catalogue change par écriture directe en base (pas de redéploiement) :
// le sitemap doit donc être calculé à la demande, pas figé au build.
export const dynamic = 'force-dynamic'

/** Pages éditoriales fixes, hors catalogue. */
const STATIC_PATHS: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' }> = [
  { path: '/', priority: 1, changeFrequency: 'weekly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/devis', priority: 0.7, changeFrequency: 'monthly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await getSiteUrl()

  const [cats, prods] = await Promise.all([
    db.category.findMany({ where: { isPublished: true }, orderBy: { order: 'asc' }, select: { slug: true, updatedAt: true } }),
    db.product.findMany({ where: { isPublished: true }, orderBy: { name: 'asc' }, select: { slug: true, updatedAt: true } }),
  ])

  // Une entrée par page, portée par l'URL française (locale par défaut, sans préfixe),
  // avec les trois variantes déclarées en hreflang plutôt qu'en entrées séparées.
  const entry = (
    path: string,
    lastModified: Date | undefined,
    priority: number,
    changeFrequency: 'daily' | 'weekly' | 'monthly',
  ) => ({
    url: base + path,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages: languageAlternates(base, path) },
  })

  return [
    ...STATIC_PATHS.map((s) => entry(s.path, undefined, s.priority, s.changeFrequency)),
    ...cats.map((c) => entry(`/${c.slug}`, c.updatedAt, 0.8, 'weekly' as const)),
    ...prods.map((p) => entry(`/produits/${p.slug}`, p.updatedAt, 0.6, 'monthly' as const)),
  ]
}
