/**
 * Constructeurs de données structurées Schema.org.
 *
 * Principe : on ne déclare QUE ce qui est vérifiable dans la base. Un produit
 * sans prix ne reçoit pas d'`offers` — inventer un prix ou une disponibilité
 * pour décrocher un extrait enrichi serait une fausse déclaration.
 */
import { type Locale } from '@/i18n'

import { getSeoBrand, getSiteUrl, localePath } from './seo'

type Node = Record<string, unknown>

/** L'entreprise elle-même : sert de `publisher` / `brand` aux autres nœuds. */
export async function organizationSchema(locale: Locale): Promise<Node> {
  const [base, brand] = await Promise.all([getSiteUrl(), getSeoBrand(locale)])
  const node: Node = {
    '@type': 'Organization',
    '@id': `${base}/#organization`,
    name: brand.siteName,
    url: base,
    description: brand.description || undefined,
    logo: brand.logo || undefined,
  }
  if (brand.phone || brand.email) {
    node.contactPoint = {
      '@type': 'ContactPoint',
      contactType: 'sales',
      telephone: brand.phone || undefined,
      email: brand.email || undefined,
      areaServed: 'MA',
      availableLanguage: ['fr', 'ar', 'en'],
    }
  }
  if (brand.address) {
    node.address = { '@type': 'PostalAddress', streetAddress: brand.address, addressCountry: 'MA' }
  }
  return node
}

/** Le site + son moteur de recherche interne (/recherche?q=…). */
export async function webSiteSchema(locale: Locale): Promise<Node> {
  const [base, brand] = await Promise.all([getSiteUrl(), getSeoBrand(locale)])
  const search = base + localePath('/recherche', locale)
  return {
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    url: base,
    name: brand.siteName,
    description: brand.description || undefined,
    publisher: { '@id': `${base}/#organization` },
    inLanguage: locale,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${search}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** Fil d'Ariane. `trail` = [{ name, path }] du plus général au plus précis. */
export async function breadcrumbSchema(
  locale: Locale,
  trail: Array<{ name: string; path: string }>,
): Promise<Node> {
  const base = await getSiteUrl()
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: base + localePath(item.path, locale),
    })),
  }
}

/** Page catégorie : liste ordonnée des produits affichés. */
export async function itemListSchema(
  locale: Locale,
  items: Array<{ name: string; slug: string }>,
): Promise<Node> {
  const base = await getSiteUrl()
  return {
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: p.name,
      url: base + localePath(`/produits/${p.slug}`, locale),
    })),
  }
}

/** Fiche produit. `offers` n'est émis QUE si un prix réel existe. */
export async function productSchema(
  locale: Locale,
  p: {
    name: string
    slug: string
    description?: string | null
    image?: string | null
    brand?: string | null
    model?: string | null
    price?: number | null
    currency?: string | null
    categoryName?: string | null
  },
): Promise<Node> {
  const base = await getSiteUrl()
  const url = base + localePath(`/produits/${p.slug}`, locale)
  const node: Node = {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: p.name,
    url,
    description: p.description?.trim() || undefined,
    image: p.image || undefined,
    sku: p.model || undefined,
    mpn: p.model || undefined,
    category: p.categoryName || undefined,
    brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
    seller: { '@id': `${base}/#organization` },
  }
  // Prix « sur demande » : on n'invente NI prix NI disponibilité.
  if (typeof p.price === 'number' && p.price > 0) {
    node.offers = {
      '@type': 'Offer',
      url,
      price: p.price,
      priceCurrency: p.currency || 'MAD',
      availability: 'https://schema.org/InStock',
      seller: { '@id': `${base}/#organization` },
    }
  }
  return node
}

/** Assemble plusieurs nœuds en un seul graphe JSON-LD. */
export function graph(...nodes: Array<Node | null | undefined>): Node {
  return { '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) as Node[] }
}
