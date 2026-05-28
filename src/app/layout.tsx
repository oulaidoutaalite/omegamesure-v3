import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import type { ReactNode } from 'react'
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
    'Équipements de laboratoire pharmaceutique, balances industrielles, consommables, métrologie COFRAC et consulting réglementaire.',
}

// Pass-through root layout — html/body are provided by [locale]/layout.tsx
// so `dir` and `lang` can be set per locale (FR, AR-RTL, EN).
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
