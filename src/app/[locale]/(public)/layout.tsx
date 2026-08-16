import { type ReactNode } from 'react'

import { CartProvider } from '@/components/public/cart/CartProvider'
import { Footer, type FooterCategory } from '@/components/public/Footer'
import { Header, type HeaderNavItem } from '@/components/public/Header'
import { type Locale } from '@/i18n'
import { db } from '@/lib/db'
import { pickLocaleField, type TranslationsJson } from '@/lib/i18n-helpers'
import {
  getBrandConfig,
  getContactConfig,
  getSocialConfig,
  loadAllConfig,
} from '@/lib/site-config'

async function loadHeaderItems(locale: Locale): Promise<HeaderNavItem[]> {
  const rows = await db.navItem.findMany({
    where: { isPublished: true, parentId: null },
    orderBy: { order: 'asc' },
    select: { id: true, label: true, slug: true, href: true, isCta: true, translations: true },
  })
  return rows.map((r) => ({
    id: r.id,
    label: pickLocaleField(r.label, r.translations as TranslationsJson, 'label', locale),
    slug: r.slug,
    href: r.href,
    isCta: r.isCta,
  }))
}

async function loadFooterCategories(locale: Locale): Promise<FooterCategory[]> {
  const rows = await db.category.findMany({
    // Les catégories de prestations vivent dans la colonne « Services » du pied de page :
    // on les exclut ici pour ne pas les lister deux fois (et libérer des places catalogue).
    where: { isPublished: true, slug: { notIn: ['metrologie', 'qualification-validation', 'consulting'] } },
    orderBy: { order: 'asc' },
    take: 8,                      // 6 catégories catalogue aujourd'hui : marge pour ne rien tronquer
    select: { name: true, slug: true, translations: true },
  })
  return rows.map((r) => ({
    name: pickLocaleField(r.name, r.translations as TranslationsJson, 'name', locale),
    slug: r.slug,
  }))
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params

  const [brand, contact, social, items, categories, config] = await Promise.all([
    getBrandConfig(locale),
    getContactConfig(),
    getSocialConfig(),
    loadHeaderItems(locale),
    loadFooterCategories(locale),
    loadAllConfig(),
  ])

  const certifications = (() => {
    const raw = config['certifications']
    return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : []
  })()

  return (
    <CartProvider>
      <Header
        brand={{ siteName: brand.siteName, tagline: brand.tagline, logoUrl: brand.logoUrl }}
        items={items}
      />
      <main>{children}</main>
      <Footer
        siteName={brand.siteName}
        tagline={brand.tagline}
        locale={locale}
        certifications={certifications}
        contact={contact}
        social={social}
        categories={categories}
      />
    </CartProvider>
  )
}
