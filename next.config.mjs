import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Les branches create/update des formulaires admin ont ete reecrites : le
  // projet compile a zero erreur, on remet donc le garde-fou. `eslint` reste
  // tolere (avertissements de style uniquement).
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: true },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage (photos produit, fiches techniques, identite…)
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    formats: ['image/avif', 'image/webp'],

    // ⚠️ ECONOMIE DE BANDE PASSANTE A LA SOURCE.
    // Chaque variante generee declenche UN telechargement de l'original chez
    // l'hebergeur des medias. Par defaut Next propose jusqu'a 3840 px : sur des
    // originaux de 1450 px affiches a ~400 px, ces grandes variantes ne servent
    // a rien et multiplient le trafic. On plafonne a 1200 px, largement suffisant
    // meme sur ecran haute densite.
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384],

    // Duree MINIMALE de conservation de l'image optimisee. Sans elle, Next
    // retombe sur le `Cache-Control` de l'origine — parfois quelques minutes —
    // et rappelle l'original en boucle. Un an : l'original n'est retelecharge
    // qu'une fois, ce qui divise le trafic sortant d'autant.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '8mb', // file uploads via server actions
      // Explicitly allow the production hostnames so Server Actions are not
      // rejected by the Origin check when served behind Vercel's proxy and,
      // later, the custom domain.
      allowedOrigins: [
        'omegamesure-v3.vercel.app',
        'omegamesure-v3-git-main-outaalite-s-projects.vercel.app',
        'omegamesure.com',
        'www.omegamesure.com',
      ],
    },
  },

  async redirects() {
    return [
      // The biomedical category used to live at the placeholder slug /biom.
      // Redirect any old link/bookmark to its real page.
      { source: '/biom', destination: '/equipements-biomedical', permanent: true },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default withNextIntl(nextConfig)
