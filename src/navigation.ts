import { createSharedPathnamesNavigation } from 'next-intl/navigation'

import { locales } from './i18n'

/**
 * next-intl-aware navigation helpers. Using these (instead of next/navigation
 * + next/link directly) ensures the active locale prefix is handled correctly
 * — both when reading the current pathname and when switching locales — with
 * `localePrefix: 'as-needed'` (default locale has no prefix).
 */
export const { Link, usePathname, useRouter, redirect } = createSharedPathnamesNavigation({
  locales,
  localePrefix: 'as-needed',
})
