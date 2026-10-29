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
import { CategoryTile } from '@/components/public/home/CategoryTile'
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

  const [categories, productCount, config, contact, t] = await Promise.all([
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

  // ⚠️ Les categories sans aucun produit publie ne sont pas montrees en
  // vignette : une tuile qui promet une famille et ouvre sur une page vide est
  // pire que son absence. Elles restent accessibles par le menu.
  const avecProduits = categories.filter((c) => c._count.products > 0)
  const [premiere, ...suivantes] = avecProduits

  const ld = graph(await organizationSchema(locale), await webSiteSchema(locale))

  const nom = (c: (typeof categories)[number]) =>
    pickLocaleField(c.name, c.translations as TranslationsJson, 'name', locale)

  return (
    <>
      <JsonLd data={ld} />

      {/* ── Héros ──────────────────────────────────────────────────────
          Bande marine pleine largeur. Pas de photo de fond : les nôtres sont
          des détourés sur blanc, illisibles sous un titre, et une photo
          d'ambiance achetée dirait moins que les chiffres du catalogue. */}
      <section className="bande-marine">
        <Container>
          <div className="grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div>
              <span className="eyebrow !text-cta-400">
                {txt('home.heroBadge', t('heroBadge'))}
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
                {siteName}
              </h1>
              {tagline && (
                <p className="mt-4 text-xl font-medium text-cta-100 sm:text-2xl">{tagline}</p>
              )}
              {description && (
                <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/75">{description}</p>
              )}
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-cta uppercase tracking-wide hover:bg-cta-600">
                  <Link href={withLocale('/devis', locale)}>{tCta('requestQuote')}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent uppercase tracking-wide text-white hover:bg-white hover:text-brand"
                >
                  <Link href={withLocale(`/${premiere?.slug ?? 'equipements-labo'}`, locale)}>
                    {tCta('viewCatalog')} <IconArrowRight size={16} className="rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Les chiffres du catalogue, en vis-à-vis du titre : ils disent
                l'étendue de l'offre mieux qu'une phrase. */}
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-white/15 ring-1 ring-white/15">
              <Chiffre valeur={`${productCount}`} label={txt('home.statProducts', t('statProducts'))} />
              <Chiffre valeur={`${avecProduits.length}`} label={txt('home.statFamilies', t('statFamilies'))} />
              <Chiffre valeur={txt('home.statExperienceValue', '15+')} label={txt('home.statExperience', t('statExperience'))} />
              <Chiffre valeur={txt('home.statMetrologyValue', t('statMetrologyValue'))} label={txt('home.statMetrology', t('statMetrology'))} />
            </dl>
          </div>
        </Container>
      </section>

      {/* ── Bande de confiance ────────────────────────────────────────── */}
      {certs.length > 0 && (
        <section className="border-b border-border bg-brand-50">
          <Container>
            <div className="flex flex-col items-center gap-4 py-5 sm:flex-row sm:justify-between">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-400">
                <IconCertificate size={15} /> {txt('home.certsTitle', t('certsTitle'))}
              </p>
              <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {certs.map((c) => (
                  <li key={c} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand">
                    <IconCircleCheck size={15} className="text-cta" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      )}

      {/* ── Catégories ────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mb-10 max-w-2xl">
            <span className="eyebrow">{txt('home.statsTitle', t('statsTitle'))}</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand sm:text-4xl">
              {txt('home.statsHeading', t('statsHeading'))}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              {txt('home.statsLead', t('statsLead'))}
            </p>
          </div>

          {/* ⚠️ UNE seule grille, pas deux blocs empiles. Decoupee en « la
              premiere » puis « les suivantes », la mise en page laissait la
              sixieme famille seule sur une rangee de trois, au tiers de largeur :
              un trou au milieu de la section. Ici la grande tuile occupe deux
              colonnes et deux rangees, et les autres se rangent autour — six
              familles remplissent exactement la grille, et le compte peut
              changer sans laisser d'orpheline. */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {avecProduits.map((c, i) => (
              <CategoryTile
                key={c.id}
                size={i === 0 ? 'large' : 'default'}
                className={i === 0 ? 'sm:col-span-2 lg:row-span-2' : undefined}
                href={withLocale(`/${c.slug}`, locale)}
                name={nom(c)}
                count={c._count.products}
                countLabel={t('productCount', { count: c._count.products })}
                imageUrl={c.heroImageUrl}
                discoverLabel={tCta('discover')}
              />
            ))}
          </div>
        </Container>
      </section>

      {/* ── Services ──────────────────────────────────────────────────── */}
      <ServicesSection locale={locale} txt={txt} t={t} tCta={tCta} />

      {/* ── Devis & contact ───────────────────────────────────────────── */}
      <section className="bande-marine">
        <Container>
          <div className="grid gap-px overflow-hidden bg-white/15 py-0 lg:grid-cols-2">
            <div className="bg-brand px-7 py-12 sm:px-10 sm:py-14">
              <IconPackage size={28} className="text-cta-400" />
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {txt('home.ctaTitle', t('ctaTitle'))}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/75">
                {txt('home.ctaLead', t('ctaLead'))}
              </p>
              <Button asChild size="lg" className="mt-7 bg-cta uppercase tracking-wide hover:bg-cta-600">
                <Link href={withLocale('/devis', locale)}>{tCta('requestQuote')}</Link>
              </Button>
            </div>

            <div className="bg-brand-700 px-7 py-12 sm:px-10 sm:py-14">
              <IconHeadset size={28} className="text-cta-400" />
              <h2 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {txt('home.supportTitle', t('supportTitle'))}
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-white/75">
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
    </>
  )
}

/* ── pièces ──────────────────────────────────────────────────────────── */

function Chiffre({ valeur, label }: { valeur: string; label: string }) {
  return (
    <div className="bg-brand px-5 py-7 text-center sm:px-6 sm:py-8">
      <dd className="text-3xl font-bold leading-none text-white sm:text-4xl">{valeur}</dd>
      <dt className="mt-2.5 text-[11px] font-semibold uppercase leading-tight tracking-[0.12em] text-white/60">
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
    <section className="border-y border-border bg-brand-50 py-16 sm:py-20">
      <Container>
        <div className="mb-10 max-w-2xl">
          <span className="eyebrow">{txt('home.servicesTitle', t('servicesTitle'))}</span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-brand sm:text-4xl">
            {txt('home.servicesHeading', t('servicesHeading'))}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
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
                className="group border border-border bg-card p-7 transition hover:border-cta/50 hover:shadow-card"
              >
                <IconRuler size={24} className="text-cta" />
                <h3 className="mt-5 text-base font-semibold uppercase tracking-wide text-brand">{name}</h3>
                {desc && <p className="mt-2.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>}
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
