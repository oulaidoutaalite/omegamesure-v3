import { withAuth } from 'next-auth/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'

import { defaultLocale, locales } from './i18n'

// ─── i18n middleware (public site) ──────────────────────────────────────────
const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'as-needed', // default-locale URLs have no /fr prefix
  localeDetection: true,
})

// ─── auth middleware (admin) — unchanged from initial scaffold ──────────────
const authMiddleware = withAuth(
  function noop() {
    /* allowed by `authorized` callback */
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        if (req.nextUrl.pathname.startsWith('/admin/login')) return true
        return !!token
      },
    },
    pages: { signIn: '/admin/login' },
  },
)

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Admin routes go through NextAuth; everything else (public site) through next-intl.
  if (pathname.startsWith('/admin')) {
    // `withAuth` returns a NextMiddleware that accepts a NextRequest.
    return (authMiddleware as unknown as (r: NextRequest) => Response | undefined)(req)
  }
  return intlMiddleware(req)
}

export const config = {
  // Skip API, Next internals, static files, and uploaded media.
  matcher: [
    '/((?!api|_next|_vercel|uploads|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\..*).*)',
  ],
}
