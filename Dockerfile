# Image de production d'omegamesure-v3.
#
# Sert aussi bien sur un Droplet (avec docker-compose) que sur App Platform,
# qui sait construire depuis un Dockerfile.
#
# ⚠️ Trois etages, et chacun a sa raison :
#   deps    — les dependances seules, pour que le cache Docker survive a toute
#             modification du code (c'est l'etape longue : ~1 500 paquets).
#   builder — la compilation Next.
#   runner  — l'image finale, sans `node_modules` de build ni sources.
#
# ⚠️ `prisma generate` doit tourner DANS l'image, pas seulement sur la machine
# de build : le client Prisma embarque un moteur compile pour la plateforme
# cible, et celui genere sous Windows ne fonctionne pas sous Linux.

FROM node:20-alpine AS deps
WORKDIR /app
# `libc6-compat` : les binaires precompiles de Prisma et de sharp sont lies a
# la glibc, absente d'Alpine par defaut.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# `npm ci` et non `npm install` : il respecte le lockfile a la lettre, donc
# l'image construite aujourd'hui sera identique dans six mois.
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ⚠️ Prisma exige une URL a la generation, mais ne s'y connecte PAS : une valeur
# factice suffit, et evite d'avoir a passer les vrais identifiants au build.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DIRECT_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npx next build

FROM node:20-alpine AS runner
WORKDIR /app
# ⚠️ `openssl` n'est pas decoratif : le moteur de requetes Prisma s'y lie AU
# DEMARRAGE. Sans lui, l'image se construit sans erreur, le conteneur demarre,
# et chaque page rend un HTTP 500. Le symptome n'apparait donc qu'en production.
RUN apk add --no-cache libc6-compat openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Ne pas tourner en root.
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# ⚠️ L'ordre compte. `standalone` n'embarque ni `public/` ni `.next/static` :
# sans ces deux lignes, le site demarre mais sort sans aucune image ni CSS.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
