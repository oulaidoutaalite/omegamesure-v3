import {
  IconArrowRight,
  IconCertificate,
  IconCircleCheck,
  IconHeadset,
  IconMail,
  IconPackage,
  IconPhone,
  IconRuler,
} from '@tabler/icons-react'
import { type Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'

import { Container } from '@/components/public/Container'
import {
  CategoryCarousel,
  type CarouselItem,
} from '@/components/public/home/CategoryCarousel'
import { HeroCarousel, type HeroSlide } from '@/components/public/home/HeroCarousel'
import { JsonLd } from '@/components/public/JsonLd'
import { Button } from '@/components/ui/button'
import { defaultLocale, type Locale } from '@/i18n'
import { db } from '@/lib/db'
import { pickLocaleField, type TranslationsJson } from '@/lib/i18n-helpers'
import { graph, organizationSchema, webSiteSchema } from '@/lib/schema-org'
import { buildAlternates, buildSocial, getSeoBrand } from '@/lib/seo'
import { getContactConfig, loadAllConfig, pickConfigText } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

function withLocale(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path
  if (path === '/') return `/${locale}`
  return `/${locale}${path}`
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params
  const brand = await getSeoBrand(locale)
  // « nom — accroche » plutot que le nom seul : l'accroche porte l'activite reelle
  // (equipements de laboratoire, balances, metrologie) sans bourrage de mots-cles.
  const title = brand.tagline ? `${brand.siteName} — ${brand.tagline}` : brand.siteName
  return {
    title: { absolute: title },
    description: brand.description || undefined,
    alternates: await buildAlternates('/', locale),
    ...(await buildSocial({ path: '/', locale, title, description: brand.description })),
  }
}

export default async function HomePage({
  params,
}: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [categories, sousCategories, productCount, config, contact, t] = await Promise.all([
    db.category.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      take: 12,
      select: {
        id: true, name: true, slug: true, description: true, heroImageUrl: true,
        translations: true,
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    }),
    // Le carrousel balaie TOUTES les sous-categories qui ont au moins un produit
    // publie — parapluies comme feuilles (Testo, Elitech, Fluke, dimensionnelle…).
    //
    // ⚠️ Aucune des 372 sous-categories n'a d'`imageUrl` : les vignettes
    // composees n'existent que pour les dix familles. Plutot que d'en fabriquer
    // trois cents, chaque carte emprunte la photo d'un vrai produit de la
    // sous-categorie. C'est plus honnete qu'une illustration generique, et cela
    // ne demande aucun fichier nouveau.
    db.subCategory.findMany({
      where: { isPublished: true, products: { some: { isPublished: true } } },
      orderBy: [{ category: { order: 'asc' } }, { order: 'asc' }],
      select: {
        id: true, name: true, slug: true, translations: true,
        category: { select: { slug: true, name: true, translations: true } },
        parent: { select: { name: true, translations: true } },
        _count: { select: { products: { where: { isPublished: true } } } },
        products: {
          where: { isPublished: true },
          select: { images: true },
          orderBy: { publishedAt: 'desc' },
          take: 12,
        },
      },
    }),
    db.product.count({ where: { isPublished: true } }),
    loadAllConfig(),
    getContactConfig(),
    getTranslations({ locale, namespace: 'home' }),
  ])

  const tCta = await getTranslations({ locale, namespace: 'cta' })

  // Resolve any editorial text from config (per-locale, with the message file as
  // the ultimate fallback) so every string below can be overridden from the admin.
  const txt = (key: string, fallback = '') => pickConfigText(config, key, locale, fallback)

  const siteName    = (config['site.name'] as string) ?? 'Omega Mesure'
  const tagline     = txt('site.tagline')
  const description = txt('site.description')
  const certs       = Array.isArray(config['certifications'])
    ? (config['certifications'] as unknown[]).filter((v): v is string => typeof v === 'string')
    : []

  // ⚠️ Les categories sans aucun produit publie ne sont pas montrees : une tuile
  // qui promet une famille et ouvre sur une page vide est pire que son absence.
  // Elles restent accessibles par le menu.
  const avecProduits = categories.filter((c) => c._count.products > 0)
  const premiere = avecProduits[0]

  const ld = graph(await organizationSchema(locale), await webSiteSchema(locale))

  const nom = (c: { name: string; translations: unknown }) =>
    pickLocaleField(c.name, c.translations as TranslationsJson, 'name', locale)

  /** La premiere photo LOCALE parmi les produits d'une sous-categorie.
   *  ⚠️ On exige `/produits/` : les rares URL qui pointent encore le stockage
   *  Supabase repondent en HTTP 402 depuis l'incident de quota, et donneraient
   *  une carte a l'image cassee. */
  const photoLocale = (produits: { images: unknown }[]): string | null => {
    for (const p of produits) {
      const im = p.images
      if (!Array.isArray(im)) continue
      const u = (im[0] as { url?: string } | undefined)?.url
      if (typeof u === 'string' && u.startsWith('/produits/')) return u
    }
    return null
  }

  const cartes: CarouselItem[] = sousCategories.flatMap((s) => {
    const imageUrl = photoLocale(s.products)
    if (!imageUrl) return []
    return [{
      href: withLocale(`/${s.category.slug}/${s.slug}`, locale),
      name: nom(s),
      countLabel: t('productCount', { count: s._count.products }),
      imageUrl,
      // Le sur-titre de la carte : le parapluie quand il y en a un (« Fluke »),
      // la famille sinon (« Instruments de mesure »).
      famille: s.parent ? nom(s.parent) : nom(s.category),
    }]
  })

  const diapos: HeroSlide[] = avecProduits.map((c) => ({
    href: withLocale(`/${c.slug}`, locale),
    name: nom(c),
    lead: pickLocaleField(c.description ?? '', c.translations as TranslationsJson, 'description', locale),
    imageUrl: c.heroImageUrl,
    cta: tCta('viewCatalog'),
  }))

  return (
    <>
      <JsonLd data={ld} />

      {/* ── Héros ──────────────────────────────────────────────────────
          Sur le modèle carlroth.com : une carte blanche posée sur la page
          grise, l'image à gauche, le texte et le bouton à droite, des tirets
          en indicateurs et les flèches en dehors du cadre. */}
      <section className="pb-12 pt-6 sm:pt-8 lg:pb-16">
        <Container>
          {diapos.length > 0 ? (
            <HeroCarousel
              slides={diapos}
              labelPrev={tCta('previous')}
              labelNext={tCta('next')}
            />
          ) : (
            // Sans catégorie peuplée, pas de carrousel vide : on garde le nom et
            // l'accroche, qui restent vrais.
            <div className="rounded-lg bg-card px-8 py-14 shadow-card">
              <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">{siteName}</h1>
              {tagline && <p className="mt-4 text-lg text-ink-500">{tagline}</p>}
            </div>
          )}
        </Container>
      </section>

      {/* ── Chiffres du catalogue ─────────────────────────────────────── */}
      <section className="border-y border-border bg-card">
        <Container>
          <dl className="grid grid-cols-2 divide-x divide-border lg:grid-cols-4 rtl:divide-x-reverse">
            <Chiffre valeur={`${productCount}`} label={txt('home.statProducts', t('statProducts'))} />
            <Chiffre valeur={`${avecProduits.length}`} label={txt('home.statFamilies', t('statFamilies'))} />
            <Chiffre valeur={txt('home.statExperienceValue', '15+')} label={txt('home.statExperience', t('statExperience'))} />
            <Chiffre valeur={txt('home.statMetrologyValue', t('statMetrologyValue'))} label={txt('home.statMetrology', t('statMetrology'))} />
          </dl>
        </Container>
      </section>

      {/* ── Bande de confiance ────────────────────────────────────────── */}
      {certs.length > 0 && (
        <section className="border-b border-border bg-card">
          <Container>
            <div className="flex flex-col items-center gap-4 py-5 sm:flex-row sm:justify-between">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                <IconCertificate size={15} /> {txt('home.certsTitle', t('certsTitle'))}
              </p>
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {certs.map((c) => (
                  <li key={c} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                    <IconCircleCheck size={15} className="text-cta" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      )}

      {/* ── Carrousel des sous-catégories ─────────────────────────────── */}
      <section className="py-14 sm:py-16 lg:py-20">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <span className="eyebrow">{txt('home.statsTitle', t('statsTitle'))}</span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                {txt('home.statsHeading', t('statsHeading'))}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
                {txt('home.statsLead', t('statsLead'))}
              </p>
            </div>
            {premiere && (
              <Link
                href={withLocale(`/${premiere.slug}`, locale)}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-cta transition hover:gap-2.5"
              >
                {tCta('viewCatalog')} <IconArrowRight size={14} className="rtl:rotate-180" />
              </Link>
            )}
          </div>

          <CategoryCarousel
            items={cartes}
            labelPrev={tCta('previous')}
            labelNext={tCta('next')}
          />
        </Container>
      </section>

      {/* ── Services ──────────────────────────────────────────────────── */}
      <ServicesSection locale={locale} txt={txt} t={t} tCta={tCta} />

      {/* ── Devis & contact ───────────────────────────────────────────── */}
      <section className="bande-sombre">
        <Container>
          <div className="grid gap-px overflow-hidden bg-white/10 lg:grid-cols-2">
            <div className="bg-ink-800 px-7 py-12 sm:px-10 sm:py-14">
              <IconPackage size={28} className="text-cta-400" />
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {txt('home.ctaTitle', t('ctaTitle'))}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                {txt('home.ctaLead', t('ctaLead'))}
              </p>
              <Button asChild size="lg" className="mt-7 rounded-full bg-cta px-8 hover:bg-cta-600">
                <Link href={withLocale('/devis', locale)}>{tCta('requestQuote')}</Link>
              </Button>
            </div>

            <div className="bg-ink-900 px-7 py-12 sm:px-10 sm:py-14">
              <IconHeadset size={28} className="text-cta-400" />
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {txt('home.supportTitle', t('supportTitle'))}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/70">
                {txt('home.supportLead', t('supportLead'))}
              </p>
              <ul className="mt-7 space-y-2.5 text-[15px]">
                {contact.phone && (
                  <li>
                    <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="inline-flex items-center gap-2.5 font-semibold text-white transition hover:text-cta-400">
                      <IconPhone size={17} className="text-cta-400" /> {contact.phone}
                    </a>
                  </li>
                )}
                {contact.email && (
                  <li>
                    <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2.5 font-semibold text-white transition hover:text-cta-400">
                      <IconMail size={17} className="text-cta-400" /> {contact.email}
                    </a>
                  </li>
                )}
              </ul>
              <Link
                href={withLocale('/contact', locale)}
                className="mt-7 inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-cta-400 transition hover:gap-2.5"
              >
                {tCta('contactUs')} <IconArrowRight size={14} className="rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {description && (
        <section className="py-12">
          <Container>
            <p className="mx-auto max-w-3xl text-center text-[15px] leading-relaxed text-ink-500">
              {description}
            </p>
          </Container>
        </section>
      )}
    </>
  )
}

/* ── pièces ──────────────────────────────────────────────────────────── */

function Chiffre({ valeur, label }: { valeur: string; label: string }) {
  return (
    <div className="px-5 py-7 text-center sm:px-6">
      <dd className="text-2xl font-bold leading-none text-ink sm:text-3xl">{valeur}</dd>
      <dt className="mt-2.5 text-[11px] font-semibold uppercase leading-tight tracking-[0.12em] text-ink-400">
        {label}
      </dt>
    </div>
  )
}

/**
 * Les prestations — étalonnage, qualification, accompagnement.
 *
 * ⚠️ La liste vient de la configuration (`home.services`), jamais d'une liste
 * écrite en dur : annoncer une prestation que la maison n'assure pas serait du
 * remplissage, et c'est précisément ce que la règle du catalogue interdit. Sans
 * configuration, la section ne s'affiche pas.
 */
async function ServicesSection({
  locale, txt, t, tCta,
}: {
  locale: Locale
  txt: (k: string, f?: string) => string
  t: Awaited<ReturnType<typeof getTranslations>>
  tCta: Awaited<ReturnType<typeof getTranslations>>
}) {
  const services = await db.category.findMany({
    where: {
      isPublished: true,
      slug: { in: ['metrologie', 'qualification-validation', 'consulting'] },
    },
    orderBy: { order: 'asc' },
    select: { id: true, name: true, slug: true, description: true, translations: true },
  })
  if (!services.length) return null

  return (
    <section className="border-y border-border bg-card py-14 sm:py-16">
      <Container>
        <div className="mb-8 max-w-2xl">
          <span className="eyebrow">{txt('home.servicesTitle', t('servicesTitle'))}</span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {txt('home.servicesHeading', t('servicesHeading'))}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
            {txt('home.servicesLead', t('servicesLead'))}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const name = pickLocaleField(s.name, s.translations as TranslationsJson, 'name', locale)
            const desc = pickLocaleField(s.description, s.translations as TranslationsJson, 'description', locale)
            return (
              <Link
                key={s.id}
                href={withLocale(`/${s.slug}`, locale)}
                className="group rounded-lg border border-border bg-surface p-7 transition hover:border-cta/40 hover:bg-card hover:shadow-card"
              >
                <IconRuler size={24} className="text-cta" />
                <h3 className="mt-5 text-base font-semibold text-ink">{name}</h3>
                {desc && <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-ink-500">{desc}</p>}
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-cta transition group-hover:gap-2.5">
                  {tCta('discover')} <IconArrowRight size={14} className="rtl:rotate-180" />
                </span>
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
