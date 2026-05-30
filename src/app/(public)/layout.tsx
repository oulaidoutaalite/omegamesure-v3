import { type ReactNode } from 'react'

import { Footer, type FooterCategory } from '@/components/public/Footer'
import { Header, type HeaderNavItem } from '@/components/public/Header'
import { db } from '@/lib/db'
import {
  getBrandConfig,
  getContactConfig,
  getSocialConfig,
  loadAllConfig,
} from '@/lib/site-config'

async function loadHeaderItems(): Promise<HeaderNavItem[]> {
  const rows = await db.navItem.findMany({
    where: { isPublished: true, parentId: null },
    orderBy: { order: 'asc' },
    select: { id: true, label: true, slug: true, href: true, isCta: true },
  })
  return rows.map((r) => ({
    id: r.id, label: r.label, slug: r.slug, href: r.href, isCta: r.isCta,
  }))
}

async function loadFooterCategories(): Promise<FooterCategory[]> {
  const rows = await db.category.findMany({
    where: { isPublished: true },
    orderBy: { order: 'asc' },
    take: 6,
    select: { name: true, slug: true },
  })
  return rows
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const [brand, contact, social, items, categories, config] = await Promise.all([
    getBrandConfig(),
    getContactConfig(),
    getSocialConfig(),
    loadHeaderItems(),
    loadFooterCategories(),
    loadAllConfig(),
  ])

  const certifications = (() => {
    const raw = config['certifications']
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string')
    return []
  })()

  return (
    <>
      <Header
        brand={{ siteName: brand.siteName, tagline: brand.tagline, logoUrl: brand.logoUrl }}
        items={items}
      />
      <main>{children}</main>
      <Footer
        siteName={brand.siteName}
        tagline={brand.tagline}
        certifications={certifications}
        contact={contact}
        social={social}
        categories={categories}
      />
    </>
  )
}
