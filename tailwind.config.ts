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

        // Accent d'action — cyan. ⚠️ La clef s'appelait `orange` : le nom disait
        // la couleur, si bien qu'il a fallu reecrire chaque usage en changeant de
        // teinte. `cta` dit la FONCTION, et traversera le prochain changement.
        cta: {
          DEFAULT: '#0187AC',
          50:  '#e6f5fa',
          100: '#c7e9f3',
          400: '#19a3c9',
          500: '#0187AC',
          600: '#01708f',
          700: '#015a74',
        },

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
