import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx,js,jsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // shadcn CSS-variable tokens
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:   'hsl(var(--primary))',
          foreground:'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:   'hsl(var(--secondary))',
          foreground:'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:   'hsl(var(--destructive))',
          foreground:'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:   'hsl(var(--muted))',
          foreground:'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:   'hsl(var(--accent))',
          foreground:'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:   'hsl(var(--popover))',
          foreground:'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:   'hsl(var(--card))',
          foreground:'hsl(var(--card-foreground))',
        },

        // Brand palette — Omega Mesure.
        // Bleu marine profond, la couleur des catalogues d'instrumentation : elle
        // tient sur de grands aplats sans fatiguer, et laisse les photos de
        // produits (presque toutes detourees sur blanc) ressortir franchement.
        brand: {
          DEFAULT: '#172D51',
          50:  '#f2f6fb',
          100: '#e3ebf4',
          200: '#c3d3e5',
          300: '#8fa9c7',
          400: '#3c5b8e',
          500: '#24406e',
          600: '#172D51',  // marine principal
          700: '#112340',
          800: '#0b1830',
          900: '#060e1e',
        },

        // Accent d'action. ⚠️ La clef s'appelait `orange`, puis a porte du cyan :
        // le nom disait la COULEUR, si bien qu'il a fallu reecrire chaque usage a
        // chaque changement de teinte. `cta` dit la FONCTION — c'est ce qui permet
        // de passer ici du cyan au rouge brique sans toucher un seul appel.
        //
        // Rouge brique sobre, volontairement distinct du rouge vif de Carl Roth
        // (#C8102E) : meme registre, mais ce n'est pas leur marque.
        // ⚠️ `cta` ne sert nulle part dans l'admin (verifie) : le changer ne
        // repeint que le site public.
        cta: {
          DEFAULT: '#9E2A2B',
          50:  '#fdf4f4',
          100: '#fae4e4',
          200: '#f2c3c3',
          400: '#c0433f',
          500: '#9E2A2B',
          600: '#862324',
          700: '#6b1c1d',
          900: '#3f1011',
        },

        // Encre — les gris neutres du texte et des aplats du site public.
        // ⚠️ Ne PAS reutiliser `brand` pour cela : `brand` (marine) habille les
        // 23 fichiers de l'administration, et en changer la teinte repeindrait
        // une interface que personne n'a demande de refaire.
        ink: {
          DEFAULT: '#1f2328',
          50:  '#f7f8f8',
          100: '#eceef0',
          200: '#d9dde1',
          300: '#b4bbc2',
          400: '#78818b',
          500: '#4d555e',
          600: '#343b42',
          700: '#272c32',
          800: '#1f2328',
          900: '#14171a',
        },

        // Le fond de page : le gris tres clair de carlroth.com, releve sur leur
        // site (rgb(243,244,245)). Les cartes restent blanches par-dessus.
        surface: '#f3f4f5',

        // Accents de section, pour differencier les familles du catalogue.
        teal:   { DEFAULT: '#0EA5A4' },
        coral:  { DEFAULT: '#F06A5C' },
        purple: { DEFAULT: '#7C3AED' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        arabic: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Ombres basses et larges : une carte posee sur la page, pas flottante.
        card: '0 1px 2px rgb(23 45 81 / 0.06), 0 8px 24px -12px rgb(23 45 81 / 0.18)',
        'card-hover': '0 2px 4px rgb(23 45 81 / 0.08), 0 16px 40px -16px rgb(23 45 81 / 0.28)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { transform: 'translateY(12px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.4s ease-out',
        'slide-up':       'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [animate],
}

export default config
