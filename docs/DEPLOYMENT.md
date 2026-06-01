# Déploiement — Omega Mesure

Trois recettes éprouvées, du plus rapide au plus contrôlé.

## Pré-requis communs

1. Node ≥ 20
2. PostgreSQL ≥ 14
3. Domaine + certificat TLS
4. (Optionnel mais recommandé) clé API Resend pour les emails

Avant tout déploiement, **générer un `NEXTAUTH_SECRET` aléatoire** :

```bash
openssl rand -base64 32
```

## Option A — Vercel + Supabase (le plus rapide)

Le run-time Next.js sur Vercel + Postgres managé Supabase. Idéal pour
démarrer rapidement.

### 1. Provisionner Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Dans **Settings → Database**, copiez la « Connection string » du mode
   `Transaction` (recommandé pour Prisma avec PgBouncer)
3. Notez aussi la string `Session` mode pour les migrations

### 2. Configurer Vercel

1. `vercel link` puis `vercel env add` pour chaque variable :
   ```
   DATABASE_URL              # Supabase Transaction URL (port 6543) avec ?pgbouncer=true&connection_limit=1
   DIRECT_DATABASE_URL       # Supabase Session URL (port 5432) — pour les migrations
   NEXTAUTH_SECRET
   NEXTAUTH_URL              # https://votre-domaine.com
   NEXT_PUBLIC_SITE_URL
   RESEND_API_KEY
   EMAIL_FROM
   EMAIL_QUOTE_RECIPIENT
   SEED_ADMIN_EMAIL
   SEED_ADMIN_PASSWORD
   ```

2. Ajoutez `directUrl` dans `prisma/schema.prisma` pour que les migrations
   bypass PgBouncer :
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_DATABASE_URL")
   }
   ```

3. **Stockage médias** : Vercel est éphémère, `public/uploads` est perdu
   à chaque déploiement. Deux options :
   - **Supabase Storage** : adapte `lib/upload.ts` pour pousser vers un
     bucket Supabase (signature présignée + URL publique) — voir leur SDK.
   - **Cloudinary** : alternative recommandée, tier gratuit généreux.

### 3. Déployer

```bash
git push     # déclenche le build Vercel
```

Premier déploiement :

```bash
# Sur votre machine, avec DATABASE_URL=DIRECT_DATABASE_URL pointant vers Supabase
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

### 4. Vérifier

```bash
curl https://votre-domaine.com/api/health
# { "status": "ok", "db": "ok", ... }
```

## Option B — Vercel + Railway

Identique à l'option A mais Postgres sur Railway. Avantages : connection
pooling intégré, dashboard très lisible, prix prévisible.

1. Créez un service PostgreSQL sur [railway.app](https://railway.app)
2. Copiez `DATABASE_URL` depuis l'onglet Variables
3. Pas besoin de `directUrl` (Railway expose une seule URL avec pooling natif)
4. Le reste identique à l'option A

## Option C — VPS / Docker (contrôle total)

Pour un VPS Hetzner / OVH / Scaleway avec un build standalone Next.js.

### `Dockerfile` minimal

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init && \
    addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
USER nextjs
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

Activez `output: 'standalone'` dans `next.config.mjs`.

### `docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER:     omega
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB:       omegamesure
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U omega"]
      interval: 5s

  app:
    build: .
    env_file: .env.prod
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - uploads:/app/public/uploads

volumes:
  pgdata:
  uploads:
```

### Nginx + Certbot

```nginx
server {
  listen 443 ssl http2;
  server_name omegamesure.com www.omegamesure.com;
  ssl_certificate     /etc/letsencrypt/live/omegamesure.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/omegamesure.com/privkey.pem;

  client_max_body_size 16M;       # Permettre upload média (> MAX_UPLOAD_SIZE_MB)

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Migrations en production

```bash
docker compose run --rm app npx prisma migrate deploy
docker compose run --rm app npx tsx prisma/seed.ts   # seed initial (idempotent)
```

## Sauvegardes

PostgreSQL :

```bash
# Quotidien via cron
pg_dump $DATABASE_URL | gzip > /backups/omegamesure-$(date +%F).sql.gz
```

Médias :

```bash
# Sync vers S3-compatible
rsync -avz public/uploads/ /backups/uploads/
```

## Monitoring

- `/api/health` → 200 quand la DB répond. Branchez-le sur UptimeRobot,
  BetterStack ou Vercel Checks.
- Logs : `vercel logs` ou `docker compose logs -f app`
- Métriques DB : Supabase / Railway / pg_stat_activity selon hébergement

## Liste de vérification avant mise en prod

- [ ] `NEXTAUTH_SECRET` aléatoire (≥ 32 caractères)
- [ ] Mot de passe admin par défaut **changé**
- [ ] `RESEND_API_KEY` valide et domaine vérifié dans Resend
- [ ] `EMAIL_QUOTE_RECIPIENT` pointé vers l'email commercial réel
- [ ] Configuration `/admin/config` remplie (logo, coordonnées, social)
- [ ] Catégories et navigation revues
- [ ] Au moins 2-3 produits publiés
- [ ] Traductions AR/EN saisies pour les contenus principaux
- [ ] Robots/sitemap : à ajouter en complément (`/robots.txt`, `/sitemap.xml`)
- [ ] CSP / headers de sécurité : déjà configurés dans `next.config.mjs`
