import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { type ReactNode } from 'react'

import { isLocale, isRtl, locales } from '@/i18n'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  // Required for next-intl server rendering (App Router).
  setRequestLocale(locale)

  const messages = await getMessages({ locale })

  // We can't set <html lang dir> from a nested layout, so we rely on
  // setting them on document.documentElement at runtime via a script tag.
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        // Apply lang/dir on <html> before content paints (no FOUC).
        dangerouslySetInnerHTML={{
          __html: `(function(){var d=document.documentElement;d.lang=${JSON.stringify(locale)};d.dir=${JSON.stringify(isRtl(locale) ? 'rtl' : 'ltr')};})();`,
        }}
      />
      {children}
    </NextIntlClientProvider>
  )
}
