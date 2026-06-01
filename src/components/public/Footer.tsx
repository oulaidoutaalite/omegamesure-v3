import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandX,
  IconBrandYoutube,
  IconMail,
  IconMapPin,
  IconPhone,
} from '@tabler/icons-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { type ReactNode } from 'react'

import { Container } from '@/components/public/Container'
import { defaultLocale, type Locale } from '@/i18n'

export type FooterContact = {
  address: string
  phone: string
  email: string
  hours: string
}

export type FooterSocial = {
  linkedin: string
  facebook: string
  instagram: string
  youtube: string
  twitter: string
}

export type FooterCategory = { name: string; slug: string }

type Props = {
  siteName: string
  tagline: string
  locale: Locale
  certifications: string[]
  contact: FooterContact
  social: FooterSocial
  categories: FooterCategory[]
}

function withLocale(path: string, locale: Locale): string {
  if (locale === defaultLocale) return path
  if (path === '/') return `/${locale}`
  return `/${locale}${path}`
}

export async function Footer({
  siteName, tagline, locale, certifications, contact, social, categories,
}: Props) {
  const t = await getTranslations({ locale, namespace: 'footer' })
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-slate-50">
      <Container className="py-12">
        <div className="grid gap-10 lg:grid-cols-6">
          {/* Col 1 — Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-base font-bold text-white">Ω</span>
              <span className="text-sm font-bold text-brand">{siteName}</span>
            </div>
            {tagline && <p className="mt-2 text-sm text-muted-foreground">{tagline}</p>}

            {contact.address && (
              <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <IconMapPin size={14} className="mt-0.5 shrink-0" />
                <span className="whitespace-pre-line">{contact.address}</span>
              </p>
            )}
            {contact.phone && (
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <IconPhone size={14} />
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="hover:text-foreground">{contact.phone}</a>
              </p>
            )}
            {contact.email && (
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <IconMail size={14} />
                <a href={`mailto:${contact.email}`} className="hover:text-foreground">{contact.email}</a>
              </p>
            )}

            <Socials links={social} />
          </div>

          {/* Col 2 — Catalogue */}
          <FooterCol title={t('catalogue')}>
            {categories.map((c) => (
              <FooterLink key={c.slug} href={withLocale(`/${c.slug}`, locale)}>{c.name}</FooterLink>
            ))}
          </FooterCol>

          {/* Col 3 — Services */}
          <FooterCol title={t('services')}>
            <FooterLink href={withLocale('/metrologie', locale)}>{(await getTranslations({ locale, namespace: 'navbar' }))('metrology')}</FooterLink>
            <FooterLink href={withLocale('/consulting', locale)}>{(await getTranslations({ locale, namespace: 'navbar' }))('consulting')}</FooterLink>
            <FooterLink href={withLocale('/devis', locale)}>{(await getTranslations({ locale, namespace: 'cta' }))('requestQuote')}</FooterLink>
          </FooterCol>

          {/* Col 4 — Entreprise */}
          <FooterCol title={t('enterprise')}>
            <FooterLink href={withLocale('/contact', locale)}>{t('contact')}</FooterLink>
            <FooterLink href={withLocale('/devis', locale)}>{(await getTranslations({ locale, namespace: 'cta' }))('requestQuote')}</FooterLink>
          </FooterCol>

          {/* Col 5 — Certifications */}
          <FooterCol title={t('certifications')}>
            {certifications.length === 0
              ? <li className="text-xs text-muted-foreground">—</li>
              : certifications.map((cert) => (
                  <li key={cert} className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 font-medium text-brand">
                      {cert}
                    </span>
                  </li>
                ))}
          </FooterCol>
        </div>

        <hr className="my-8 border-border" />

        <div className="flex flex-col-reverse items-start justify-between gap-4 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>{t('rights', { year, name: siteName })}</p>
          {contact.hours && <p>{contact.hours}</p>}
        </div>
      </Container>
    </footer>
  )
}

function FooterCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h4>
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-xs text-muted-foreground transition hover:text-brand">
        {children}
      </Link>
    </li>
  )
}

function Socials({ links }: { links: FooterSocial }) {
  const items: Array<{ url: string; Icon: typeof IconBrandLinkedin; label: string }> = [
    { url: links.linkedin,  Icon: IconBrandLinkedin,  label: 'LinkedIn' },
    { url: links.facebook,  Icon: IconBrandFacebook,  label: 'Facebook' },
    { url: links.instagram, Icon: IconBrandInstagram, label: 'Instagram' },
    { url: links.youtube,   Icon: IconBrandYoutube,   label: 'YouTube' },
    { url: links.twitter,   Icon: IconBrandX,         label: 'X' },
  ].filter((i) => !!i.url)

  if (items.length === 0) return null
  return (
    <div className="mt-4 flex items-center gap-2">
      {items.map(({ url, Icon, label }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          className="grid h-8 w-8 place-items-center rounded-md border border-border bg-card text-muted-foreground transition hover:border-brand hover:text-brand"
        >
          <Icon size={14} />
        </a>
      ))}
    </div>
  )
}
