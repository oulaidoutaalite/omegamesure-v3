import {
  IconArrowRight,
  IconBriefcase,
  IconBuildingFactory2,
  IconCalendarTime,
  IconCircleCheck,
  IconFlask,
  IconHome,
  IconPackage,
  IconRuler,
  IconScale,
} from '@tabler/icons-react'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'

import { Container } from '@/components/public/Container'
import { Button } from '@/components/ui/button'
import { defaultLocale, type Locale } from '@/i18n'
import { db } from '@/lib/db'
import { pickLocaleField, type TranslationsJson } from '@/lib/i18n-helpers'
import { loadAllConfig, pickConfigText } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

const ICONS: Record<string, typeof IconFlask> = {
  IconFlask, IconScale, IconRuler, IconBriefcase, IconPackage, IconHome,
}

function withLocale(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path
  if (path === '/') return `/${locale}`
  return `/${locale}${path}`
}

export default async function HomePage({
  params,
}: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const [categories, productCount, config, t] = await Promise.all([
    db.category.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      take: 8,
      select: {
        id: true, name: true, slug: true, description: true, icon: true, color: true,
        translations: true,
        _count: { select: { products: { where: { isPublished: true } } } },
      },
    }),
    db.product.count({ where: { isPublished: true } }),
    loadAllConfig(),
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

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-background to-background py-16 sm:py-24">
        <div aria-hidden className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
        <Container>
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
              <IconCircleCheck size={14} /> {txt('home.heroBadge', t('heroBadge'))}
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {siteName}
              {tagline && (
                <span className="mt-2 block text-2xl font-semibold text-brand sm:text-3xl">{tagline}</span>
              )}
            </h1>
            {description && (
              <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">{description}</p>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href={withLocale('/devis', locale)}>{tCta('requestQuote')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={withLocale('/equipements-labo', locale)}>
                  {tCta('viewCatalog')} <IconArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="border-y border-border bg-card">
        <Container className="grid gap-px overflow-hidden rounded-none border-x border-border bg-border sm:grid-cols-3">
          <StatCard label={txt('home.statProducts', t('statProducts'))}     value={txt('home.statProductsValue', `${productCount}+`)} icon={IconPackage} />
          <StatCard label={txt('home.statExperience', t('statExperience'))} value={txt('home.statExperienceValue', '15+')} icon={IconCalendarTime} />
          <StatCard label={txt('home.statMetrology', t('statMetrology'))}   value={txt('home.statMetrologyValue', t('statMetrologyValue'))} icon={IconRuler} />
        </Container>
      </section>

      {/* ── Quick nav cards ────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand">{txt('home.statsTitle', t('statsTitle'))}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">{txt('home.statsHeading', t('statsHeading'))}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">{txt('home.statsLead', t('statsLead'))}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const Icon = (c.icon && ICONS[c.icon]) || IconFlask
              const name = pickLocaleField(c.name, c.translations as TranslationsJson, 'name', locale)
              const desc = pickLocaleField(c.description, c.translations as TranslationsJson, 'description', locale)
              return (
                <Link
                  key={c.id}
                  href={withLocale(`/${c.slug}`, locale)}
                  className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl text-white"
                      style={{ background: c.color ?? '#185FA5' }}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('productCount', { count: c._count.products })}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{name}</h3>
                  {desc && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{desc}</p>}
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
                    {tCta('discover')} <IconArrowRight size={14} className="transition group-hover:translate-x-0.5 rtl:rotate-180" />
                  </div>
                </Link>
              )
            })}
          </div>
        </Container>
      </section>

      {/* ── Certifications strip ──────────────────────────────── */}
      {certs.length > 0 && (
        <section className="border-y border-border bg-slate-50 py-10">
          <Container>
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {txt('home.certsTitle', t('certsTitle'))}
              </p>
              <ul className="flex flex-wrap items-center justify-center gap-3">
                {certs.map((c) => (
                  <li key={c} className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">
                    <IconCircleCheck size={14} /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      )}

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <Container size="narrow" className="text-center">
          <IconBuildingFactory2 className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{txt('home.ctaTitle', t('ctaTitle'))}</h2>
          <p className="mt-3 text-sm text-muted-foreground">{txt('home.ctaLead', t('ctaLead'))}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href={withLocale('/devis', locale)}>{tCta('requestQuote')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={withLocale('/contact', locale)}>{tCta('contactUs')}</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  )
}

function StatCard({
  label, value, icon: Icon,
}: { label: string; value: string; icon: typeof IconFlask }) {
  return (
    <div className="bg-card px-6 py-8 text-center">
      <Icon className="mx-auto h-7 w-7 text-brand" />
      <div className="mt-3 text-3xl font-bold text-brand">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  )
}
