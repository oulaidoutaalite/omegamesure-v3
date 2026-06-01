# Omega Mesure — Site B2B multilingue + dashboard admin

Site professionnel pour **Omega Mesure et instrumentation** : équipements de
laboratoire pharmaceutique, balances industrielles, consommables, métrologie
COFRAC et consulting réglementaire.

Le projet inclut :

- un **site public** (FR / AR-RTL / EN) avec catalogue, fiches produit,
  formulaires de devis et de contact
- un **dashboard admin** complet permettant de gérer 100 % du contenu
  (navigation, catégories, produits, médias, devis, configuration, langues,
  utilisateurs) sans toucher au code

> **Slogan** : Votre partenaire scientifique & industriel

## Sommaire

- [Stack technique](#stack-technique)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts npm](#scripts-npm)
- [Architecture](#architecture)
- [Modules admin](#modules-admin)
- [Internationalisation](#internationalisation)
- [Déploiement](#déploiement)
- [Roadmap](#roadmap)

## Stack technique

| Couche | Outils |
|---|---|
| Framework | **Next.js 14** (App Router, server actions) + TypeScript |
| Base de données | **PostgreSQL** via **Prisma ORM** |
| Auth admin | **NextAuth.js v4** (credentials + JWT, bcrypt) |
| UI | **Tailwind CSS v3** + **shadcn/ui** + Radix primitives + Tabler icons |
| Multi-langue | **next-intl** (`localePrefix: as-needed`) + `translations` JSON par contenu |
| Drag & drop | **@dnd-kit** (navigation, catégories, sous-cats) |
| Formulaires | **react-hook-form** + **zod** |
| Email transactionnel | **Resend** (fallback gracieux si pas configuré) |
| Stockage médias | Disque local `public/uploads/` + **sharp** pour les métadonnées image |
| Notifications UI | **sonner** |
| Rich text (futur Blog) | **Tiptap** |
| Tests | **Vitest** |

## Démarrage rapide

Prérequis : Node ≥ 20, PostgreSQL ≥ 14 (local ou hébergé).

```bash
git clone <repo>
cd omegamesure-v3

# 1. Variables d'environnement
cp .env.example .env
# → édite DATABASE_URL et NEXTAUTH_SECRET au minimum

# 2. Dépendances
npm install

# 3. Base de données
npm run db:migrate    # crée le schéma
npm run db:seed       # admin user + locales + nav + 5 catégories + produits demo

# 4. Dev
npm run dev
# → http://localhost:3000             site public
# → http://localhost:3000/admin/login dashboard
```

Identifiants admin par défaut (changez le mot de passe immédiatement) :

```
Email     admin@omegamesure.com
Password  ChangeMe2026!
```

## Variables d'environnement

Voir `.env.example` pour la liste complète. Variables critiques :

| Clé | Rôle |
|---|---|
| `DATABASE_URL` | Connexion PostgreSQL Prisma |
| `NEXTAUTH_SECRET` | Signature JWT (≥ 32 caractères aléatoires) |
| `NEXTAUTH_URL` | URL publique du site (utilisée par NextAuth) |
| `NEXT_PUBLIC_SITE_URL` | URL publique exposée au client |
| `RESEND_API_KEY` | Optionnel — sans, les emails sont loggés et retournent `skipped: true` |
| `EMAIL_FROM` | Expéditeur affiché |
| `EMAIL_QUOTE_RECIPIENT` | Email de réception des devis et messages contact |
| `UPLOAD_DIR` | Répertoire de stockage des médias (défaut `public/uploads`) |
| `MAX_UPLOAD_SIZE_MB` | Taille max par fichier (défaut 8) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Compte créé par le seed |

## Scripts npm

| Script | Description |
|---|---|
| `npm run dev` | Démarrage en mode développement (hot reload) |
| `npm run build` | Génère le client Prisma puis build Next.js |
| `npm run start` | Démarre le serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier en mode écriture |
| `npm run test` | Vitest une fois |
| `npm run test:watch` | Vitest en mode watch |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | Migrations Prisma en dev |
| `npm run db:migrate:deploy` | Migrations en production |
| `npm run db:push` | Sync schéma sans migration (rapide, non recommandé en prod) |
| `npm run db:seed` | Re-exécute le seed (idempotent) |
| `npm run db:studio` | UI Prisma Studio |
| `npm run db:reset` | Drop + migrate + seed (**DESTRUCTIF**) |

## Architecture

```
src/
├── app/
│   ├── layout.tsx                 ← root html/body
│   ├── [locale]/                  ← site public (fr/ar/en)
│   │   ├── layout.tsx             ← NextIntlClientProvider + RTL
│   │   └── (public)/
│   │       ├── layout.tsx         ← Header + Footer
│   │       ├── page.tsx           ← Home (hero, stats, cards, certifs)
│   │       ├── [slug]/page.tsx    ← Catégorie dynamique
│   │       ├── produits/[slug]/   ← Fiche produit
│   │       ├── contact/page.tsx
│   │       └── devis/page.tsx
│   ├── admin/                     ← Dashboard (single-locale FR)
│   │   ├── (public)/login/
│   │   └── (authenticated)/
│   │       ├── page.tsx           ← Dashboard avec stats
│   │       ├── navigation/        ← CRUD nav items (drag&drop)
│   │       ├── categories/        ← + sous-cats inline (drag&drop)
│   │       ├── products/          ← Multi-image + datasheet
│   │       ├── media/             ← Bibliothèque (drag&drop upload)
│   │       ├── quotes/            ← Workflow devis (NEW → WON/LOST)
│   │       ├── messages/          ← Contact (NEW → REPLIED)
│   │       ├── config/            ← Settings tabbed
│   │       ├── users/             ← SUPER_ADMIN only
│   │       └── languages/         ← Activer FR/AR/EN
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── health/                ← Liveness + DB readiness
│       ├── media/list/            ← Pour le MediaPicker
│       └── quotes/export.csv/
├── components/
│   ├── ui/                        ← Primitives shadcn
│   ├── public/                    ← Header, Footer, ProductCard, forms publics, LocaleSwitcher
│   └── admin/                     ← UIs spécifiques au dashboard
├── lib/
│   ├── db.ts                      ← Singleton Prisma
│   ├── auth.ts                    ← NextAuth options (credentials + JWT)
│   ├── auth-helpers.ts            ← requireAuth / requireRole / can
│   ├── email.ts                   ← Resend client + helpers HTML
│   ├── upload.ts                  ← Stockage disque (sharp metadata)
│   ├── activity.ts                ← Audit log
│   ├── site-config.ts             ← Lecture cachée de SiteConfig
│   ├── locales.ts                 ← Lecture des locales actives
│   ├── i18n-helpers.ts            ← pickLocaleField / localize
│   ├── actions/                   ← Server actions (CRUD)
│   └── validations/               ← Schémas zod
├── messages/
│   ├── fr.json                    ← UI strings français (default)
│   ├── ar.json                    ← Arabe (RTL)
│   └── en.json                    ← English
├── i18n.ts                        ← getRequestConfig next-intl
└── middleware.ts                  ← Compose NextAuth + next-intl
```

## Modules admin

| Module | URL | Permissions |
|---|---|---|
| Tableau de bord | `/admin` | toute personne connectée |
| Navigation | `/admin/navigation` | `ADMIN+` |
| Catégories | `/admin/categories` | `ADMIN+` |
| Produits | `/admin/products` | `EDITOR+` |
| Médias | `/admin/media` | `EDITOR+` |
| Devis | `/admin/quotes` | `EDITOR+` |
| Messages contact | `/admin/messages` | `EDITOR+` |
| Configuration | `/admin/config` | `ADMIN+` |
| Langues | `/admin/languages` | `ADMIN+` |
| Utilisateurs | `/admin/users` | `SUPER_ADMIN` |

Voir [`docs/ADMIN.md`](docs/ADMIN.md) pour le guide d'utilisation détaillé.

## Internationalisation

- 3 locales : **`fr`** (défaut, sans préfixe), **`ar`** (RTL), **`en`**
- Routes : `/` (fr), `/ar/...`, `/en/...`
- **UI strings** : `src/messages/{fr,ar,en}.json` (ICU plurals supportés)
- **Contenus DB** : chaque modèle a un champ `translations` JSON. Les
  formulaires admin exposent un éditeur multi-onglets pour saisir les
  variantes AR/EN. Le helper `pickLocaleField(default, translations, key, locale)`
  effectue le fallback automatiquement.
- L'admin reste mono-langue (FR) — le matcher exclut `/admin` de
  l'i18n middleware.

## Déploiement

Voir [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) pour les guides détaillés :

- **Vercel + Supabase** (recommandé, le plus rapide)
- **Vercel + Railway** (PostgreSQL managé)
- **VPS/Docker** (pour contrôle total)

Health check de production : `GET /api/health` retourne `200` si la DB
répond, `503` sinon.

## Tests

```bash
npm run test          # exécution unique
npm run test:watch    # mode watch
```

Couverture initiale : helpers purs (`utils`, `i18n-helpers`, `email`).
Voir [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) pour l'extension de la suite
(e2e Playwright, snapshots, server-action mocks).

## Roadmap

✅ Implémenté (8 commits)

- Scaffold Next.js 14 + Prisma + NextAuth
- Modèles : User, NavItem, Category, SubCategory, Product, QuoteRequest,
  ContactMessage, SiteConfig, Media, Locale, Translation, BlogPost
- CRUD Navigation + Catégories + Sous-catégories (drag&drop)
- CRUD Produits avec multi-image + datasheet PDF
- Bibliothèque médias (drag&drop upload, filtres, picker réutilisable)
- Devis : workflow complet + emails Resend + export CSV
- Contact : workflow + emails
- Configuration site (tabbed)
- Utilisateurs admin (RBAC complet)
- Site public : Home + 5 catégories + fiche produit + Contact + Devis
- i18n FR/AR/EN avec RTL + LocaleSwitcher
- Éditeur de traductions admin (NavItem, Category, SubCategory, Product)
- Gestion des langues actives + langue par défaut
- Health check + tests unitaires

🚧 Optionnel (non bloquant)

- Module Blog/Articles (Tiptap) — `BlogPost` / `BlogCategory` déjà en DB
- Éditeur homepage par blocs drag&drop
- Page `/admin/activity` pour consulter l'audit log
- E2E tests (Playwright)

## Crédits

Conçu pour **Omega Mesure et instrumentation** (Bouskoura, Maroc).
Stack assemblée avec Next.js, Prisma, NextAuth, shadcn/ui et next-intl.
