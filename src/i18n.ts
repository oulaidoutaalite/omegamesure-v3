import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

export const locales = ['fr', 'ar', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'
export const rtlLocales: Locale[] = ['ar']

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound()
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
