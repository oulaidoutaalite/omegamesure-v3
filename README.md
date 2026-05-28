# Omega Mesure v3

Site B2B multilingue (FR / AR / EN) avec dashboard admin complet pour la gestion sans code de la navigation, des catégories, produits, devis, messages, médias et traductions.

> **Slogan** : Votre partenaire scientifique & industriel

---

## Stack

| Couche | Technologie |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui (Radix primitives) |
| DB | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v4 (credentials + JWT) |
| i18n | next-intl (FR / AR-RTL / EN) |
| Forms | react-hook-form + zod |
| Drag & drop | @dnd-kit |
| Rich text | Tiptap |
| Email | Resend |
| Médias | Stockage local `/public/uploads` (Cloudinary en option) |
| Icônes | Tabler Icons + Lucide |

---

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Copier la config d'environnement
cp .env.example .env
# Remplir DATABASE_URL, NEXTAUTH_SECRET, etc.

# 3. Initialiser la base de données
npm run db:migrate   # crée le schéma
npm run db:seed      # admin + catégories + 2 produits de démo

# 4. Lancer le dev server
npm run dev
```

Site : <http://localhost:3000>
Admin : <http://localhost:3000/admin> · `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`

---

## Scripts npm

| Script | Description |
|---|---|
| `dev` | Démarre le serveur de développement |
| `build` | Build de production (génère Prisma + Next) |
| `start` | Lance le build de production |
| `lint` | ESLint |
| `typecheck` | Vérification TypeScript stricte |
| `format` | Prettier |
| `db:migrate` | Crée/applique une migration Prisma (dev) |
| `db:migrate:deploy` | Applique les migrations (prod) |
| `db:push` | Push direct sans migration (prototype only) |
| `db:studio` | Ouvre Prisma Studio |
| `db:seed` | Lance le seed `prisma/seed.ts` |
| `db:reset` | ⚠️ Drop + recreate + reseed (dev only) |
| `test` | Vitest |

---

## Architecture des dossiers

```
omegamesure-v3/
├── prisma/
│   ├── schema.prisma        ← Schéma complet (User, NavItem, Category, …)
│   └── seed.ts              ← Données de démo
├── public/
│   └── uploads/             ← Médias uploadés (gitignored)
├── src/
│   ├── app/
│   │   ├── globals.css      ← Tailwind + shadcn tokens (light/dark)
│   │   ├── layout.tsx       ← Layout racine + Inter font
│   │   └── page.tsx         ← Placeholder (à remplacer par redirect vers [locale])
│   ├── components/
│   │   ├── ui/              ← shadcn primitives (à générer)
│   │   ├── public/          ← Header, Footer, sections du site public
│   │   └── admin/           ← Sidebar admin, tables, forms
│   ├── lib/
│   │   ├── db.ts            ← Prisma singleton
│   │   └── utils.ts         ← cn(), slugify(), formatQuoteReference()
│   ├── messages/            ← Traductions next-intl (fr.json, ar.json, en.json)
│   ├── types/
│   └── i18n.ts              ← Config next-intl
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## Modèle de données (résumé)

| Modèle | Rôle |
|---|---|
| `User` | Compte admin (rôles: `SUPER_ADMIN`, `ADMIN`, `EDITOR`) |
| `ActivityLog` | Audit log des actions admin |
| `NavItem` | Items de la navbar (configurable, drag&drop, parent/enfant) |
| `Category` | Une par section principale (Équipements, Balances, …) |
| `SubCategory` | Sous-section (avec slot "Autres" configurable) |
| `Product` | Produit (images JSON, datasheetUrl, brouillon/publié) |
| `QuoteRequest` | Devis reçu — workflow `NEW → IN_PROGRESS → QUOTE_SENT → WON\|LOST` |
| `ContactMessage` | Messages du formulaire de contact |
| `SiteConfig` | Key-value store (logo, couleurs, coordonnées, SEO) |
| `Media` | Bibliothèque médias (fichiers locaux) |
| `Locale` | Langues activées + langue par défaut + RTL flag |
| `Translation` | Strings UI statiques par namespace / clé / locale |
| `BlogCategory` / `BlogPost` | Module actualités (Tiptap, brouillon/publié/planifié) |

Voir `prisma/schema.prisma` pour le détail complet.

---

## Variables d'environnement

Voir `.env.example`. Variables critiques :

- `DATABASE_URL` — connexion PostgreSQL
- `NEXTAUTH_SECRET` — secret JWT (32+ caractères aléatoires)
- `NEXTAUTH_URL` — URL publique du site
- `RESEND_API_KEY` — API key Resend pour l'envoi d'emails
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — compte admin créé au seed

---

## Roadmap d'implémentation

| Étape | Statut |
|---|---|
| 1. Initialisation projet + schéma Prisma | ✅ Fait |
| 2. NextAuth.js (login admin + middleware de protection) | ⏳ À venir |
| 3. Layout admin (sidebar + topbar + breadcrumbs) | ⏳ À venir |
| 4. CRUD NavItem (drag&drop, icônes, toggle publication) | ⏳ À venir |
| 5. CRUD Category + SubCategory | ⏳ À venir |
| 6. CRUD Product (multi-images, datasheet PDF, filtres) | ⏳ À venir |
| 7. Page d'accueil — édition par blocs | ⏳ À venir |
| 8. Bibliothèque médias (upload + dossiers + tags) | ⏳ À venir |
| 9. Devis — workflow + réponse par email | ⏳ À venir |
| 10. Messages contact | ⏳ À venir |
| 11. Config site (key/value, branding) | ⏳ À venir |
| 12. i18n — gestion des locales + Translation | ⏳ À venir |
| 13. Utilisateurs admin + logs d'activité | ⏳ À venir |
| 14. Blog (Tiptap, planification) | ⏳ Optionnel |
| 15. Site public — sections, hero, footer | ⏳ À venir |
| 16. Formulaire devis (public) + email Resend | ⏳ À venir |
| 17. Tests + docs admin | ⏳ À venir |
| 18. Déploiement (Vercel + Postgres managé) | ⏳ À venir |

---

## Informations entreprise (utilisées par le seed)

- **Nom** : Omega Mesure et instrumentation
- **Slogan** : Votre partenaire scientifique & industriel
- **Adresse** : N°35 Lotissement Doha 1er étage Bouskoura, Maroc
- **Téléphone** : +212 664 323 049
- **Email** : contact@omegamesure.com
- **Horaires** : Lundi – Vendredi · 08h00 – 18h00
- **Certifications** : ISO 17025
