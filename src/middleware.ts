import { withAuth } from 'next-auth/middleware'

/**
 * Protect every route under `/admin` except `/admin/login`.
 * Uses NextAuth's JWT token in the request cookies to gate access.
 */
export default withAuth(
  function middleware() {
    // Allow request through — `authorized` callback already gated it.
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Public routes inside /admin (login, error pages)
        if (req.nextUrl.pathname.startsWith('/admin/login')) return true
        // Everything else requires a valid JWT
        return !!token
      },
    },
    pages: { signIn: '/admin/login' },
  },
)

export const config = {
  matcher: ['/admin/:path*'],
}
