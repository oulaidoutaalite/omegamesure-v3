import type { MetadataRoute } from 'next'

import { getSiteUrl } from '@/lib/seo'

export const dynamic = 'force-dynamic'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await getSiteUrl()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: `${base}/sitemap.xml`,
    // le site est aussi servi sur le domaine de préversion Vercel : on désigne l'hôte de référence
    host: base,
  }
}
