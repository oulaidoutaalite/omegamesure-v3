import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { defaultLocale, isLocale, isRtl } from '@/i18n'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Omega Mesure — Votre partenaire scientifique & industriel',
    template: '%s | Omega Mesure',
  },
  description:
    'Équipements de laboratoire pharmaceutique, balances industrielles, consommables, métrologie et consulting réglementaire.',
}

// En-tête posé par le middleware next-intl sur les pages du site public.
const EN_TETE_LOCALE = 'X-NEXT-INTL-LOCALE'

/**
 * `<html>` est rendu ICI, hors du segment `[locale]` : c'est donc le seul
 * endroit où `lang` et `dir` peuvent être justes DANS LE HTML SERVI.
 *
 * ⚠️ Le layout de locale les corrige déjà, mais par un script exécuté au premier
 * paint : les robots d'indexation et les lecteurs d'écran qui n'exécutent pas ce
 * script voyaient `lang="fr"` sur /en/ et sur /ar/, et l'arabe rendu en LTR.
 *
 * On lit donc l'en-tête du middleware plutôt que `getLocale()` de next-intl :
 * `getLocale()` passe par la config de requête, qui appelle `notFound()` quand
 * aucune locale n'est résolue — ce qui casserait /admin, hors middleware i18n.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  const brut = headers().get(EN_TETE_LOCALE)
  const locale = isLocale(brut) ? brut : defaultLocale

  return (
    <html
      lang={locale}
      dir={isRtl(locale) ? 'rtl' : 'ltr'}
      className={inter.variable}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  )
}
