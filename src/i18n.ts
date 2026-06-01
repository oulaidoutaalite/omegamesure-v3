import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

export const locales = ['fr', 'ar', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'fr'
export const rtlLocales: Locale[] = ['ar']

export function isRtl(locale: string): boolean {
  return rtlLocales.includes(locale as Locale)
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

export default getRequestConfig(async ({ locale }) => {
  if (!isLocale(locale)) notFound()
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
