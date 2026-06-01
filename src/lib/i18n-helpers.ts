import { defaultLocale, type Locale } from '@/i18n'

/**
 * Generic shape of the `translations` JSON column on content models:
 *   { ar: { name: '…', description: '…' }, en: { name: '…' } }
 */
export type TranslationsJson =
  | Record<string, Record<string, string | null | undefined> | undefined>
  | null
  | undefined

/**
 * Pick a localized field value with fallback chain:
 *   translations[locale][field] → translations[defaultLocale][field] → defaultValue
 *
 * Empty strings are treated as missing so partial translations fall through.
 */
export function pickLocaleField<T extends string | null | undefined>(
  defaultValue: T,
  translations: TranslationsJson,
  field: string,
  locale: Locale | string,
): T {
  if (locale === defaultLocale) return defaultValue
  if (!translations || typeof translations !== 'object') return defaultValue

  const localized = translations[locale as string]
  if (localized && typeof localized === 'object') {
    const v = localized[field]
    if (typeof v === 'string' && v.trim().length > 0) return v as T
  }
  return defaultValue
}

/** Convenience: apply the helper across multiple fields at once. */
export function localize<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  translations: TranslationsJson,
  fields: readonly K[],
  locale: Locale | string,
): T {
  if (locale === defaultLocale) return obj
  const out: Record<string, unknown> = { ...obj }
  for (const f of fields) {
    const original = obj[f]
    if (typeof original === 'string') {
      out[f as string] = pickLocaleField(original, translations, f as string, locale)
    }
  }
  return out as T
}
