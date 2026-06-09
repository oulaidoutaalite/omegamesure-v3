/**
 * One-time setup endpoint.
 *
 * Visit `/api/setup?token=<SETUP_TOKEN>` after the first deployment to seed
 * the admin user, locales, navigation, categories and demo items.
 *
 * Re-running it is safe — every operation uses `upsert`, so calling it again
 * will only refresh the admin password / restore missing rows.
 *
 * The endpoint is disabled unless the `SETUP_TOKEN` env var is configured.
 */
import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SERVICES_TREE = [
  {
    slug: 'equipements-labo', name: 'Équipements labo & biomédicales', color: '#185FA5',
    subs: [
      { slug: 'analyse-controle-qualite', name: 'Analyse & contrôle qualité (HPLC, GC, spectro, dissolution)' },
      { slug: 'conservation',             name: 'Conservation (enceintes climatiques, congélateurs −80 °C)' },
      { slug: 'securite-ventilation',     name: 'Sécurité & ventilation (PSM classe II, hottes flux laminaire)' },
      { slug: 'biomedical',               name: 'Biomédical (monitoring patient, IVD, imagerie)' },
      { slug: 'instruments-mesure',       name: 'Instruments de mesure (T°, pression, dimensionnel, pH)' },
      { slug: 'autres',                   name: 'Autres', isAutres: true },
    ],
  },
  {
    slug: 'balances-bascules', name: 'Balances & bascules', color: '#0EA5A4',
    subs: [
      { slug: 'analytiques',     name: 'Analytiques (0,0001 g)' },
      { slug: 'precision',       name: 'De précision (0,01 à 0,001 g)' },
      { slug: 'industrielles',   name: 'Industrielles (jusqu\'à 600 kg)' },
      { slug: 'ponts-bascules',  name: 'Ponts-bascules (1 t à 60 t)' },
      { slug: 'autres',          name: 'Autres', isAutres: true },
    ],
  },
  {
    slug: 'consommables', name: 'Consommables', color: '#F06A5C',
    subs: [
      { slug: 'colonnes-chromato',   name: 'Colonnes chromatographie (HPLC, GC, SPE)' },
      { slug: 'reactifs-standards',  name: 'Réactifs & standards (USP/EP)' },
      { slug: 'verrerie-filtration', name: 'Verrerie & filtration' },
      { slug: 'epi-hygiene',         name: 'EPI & hygiène labo' },
      { slug: 'autres',              name: 'Autres', isAutres: true },
    ],
  },
  {
    slug: 'metrologie', name: 'Métrologie', color: '#7C3AED',
    subs: [
      { slug: 'temperature',  name: 'Étalonnage température' },
      { slug: 'pression',     name: 'Étalonnage pression' },
      { slug: 'masse',        name: 'Masse & balances (étalons OIML)' },
      { slug: 'dimensionnel', name: 'Dimensionnel' },
      { slug: 'autres',       name: 'Autres', isAutres: true },
    ],
  },
  {
    slug: 'consulting', name: 'Consulting', color: '#185FA5',
    subs: [
      { slug: 'qualification', name: 'Qualification équipements (IQ, OQ, PQ)' },
      { slug: 'validation',    name: 'Validation procédés' },
      { slug: 'bpf-gmp',       name: 'BPF / GMP (audit, procédures)' },
      { slug: 'formation',     name: 'Formation & support' },
      { slug: 'autres',        name: 'Autres', isAutres: true },
    ],
  },
] as const

const NAV_ITEMS = [
  { slug: 'accueil',           label: 'Accueil',                       icon: 'IconHome' },
  { slug: 'equipements-labo',  label: 'Équipements labo & biomédicales', icon: 'IconFlask' },
  { slug: 'balances-bascules', label: 'Balances & bascules',           icon: 'IconScale' },
  { slug: 'consommables',      label: 'Consommables',                  icon: 'IconBottle' },
  { slug: 'metrologie',        label: 'Métrologie',                    icon: 'IconRuler' },
  { slug: 'consulting',        label: 'Consulting',                    icon: 'IconBriefcase' },
  { slug: 'contact',           label: 'Contact us',                    icon: 'IconMail' },
  { slug: 'devis',             label: 'Demander un devis',             icon: 'IconFileInvoice', isCta: true },
] as const

const SITE_CONFIG: Array<{ key: string; category: string; value: unknown; label: string }> = [
  { key: 'site.name',         category: 'general',  value: 'Omega Mesure',                                                                                                                  label: 'Nom du site' },
  { key: 'site.tagline',      category: 'general',  value: 'Votre partenaire scientifique & industriel',                                                                                    label: 'Slogan' },
  { key: 'contact.address',   category: 'contact',  value: 'N°35 Lotissement Doha 1er étage Bouskoura, Maroc',                                                                              label: 'Adresse' },
  { key: 'contact.phone',     category: 'contact',  value: '+212 664 323 049',                                                                                                              label: 'Téléphone' },
  { key: 'contact.email',     category: 'contact',  value: 'contact@omegamesure.com',                                                                                                       label: 'Email contact' },
  { key: 'contact.hours',     category: 'contact',  value: 'Lundi – Vendredi · 08h00 – 18h00',                                                                                              label: 'Horaires' },
  { key: 'branding.primary',  category: 'branding', value: '#185FA5',                                                                                                                       label: 'Couleur primaire' },
  { key: 'seo.description',   category: 'seo',      value: 'Fournisseur d\'équipements de laboratoire, balances industrielles, consommables, métrologie COFRAC et consulting réglementaire au Maroc.', label: 'Meta description globale' },
  { key: 'certifications',    category: 'general',  value: ['ISO 17025'],                                                                                                                   label: 'Certifications affichées' },
]

export async function GET(req: Request) {
  const expected = process.env.SETUP_TOKEN
  if (!expected || expected.length < 16) {
    return NextResponse.json(
      { ok: false, error: 'SETUP_TOKEN is not configured (set a long random value in your env).' },
      { status: 500 },
    )
  }
  const url = new URL(req.url)
  const provided = url.searchParams.get('token')
  if (provided !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const log: string[] = []
  const t0 = Date.now()

  try {
    // ─── Locales ─────────────────────────────────────────────────────────
    for (const l of [
      { code: 'fr', name: 'French',  nativeName: 'Français', isDefault: true,  isRtl: false, order: 0 },
      { code: 'ar', name: 'Arabic',  nativeName: 'العربية',  isDefault: false, isRtl: true,  order: 1 },
      { code: 'en', name: 'English', nativeName: 'English',  isDefault: false, isRtl: false, order: 2 },
    ]) {
      await db.locale.upsert({
        where: { code: l.code },
        update: {},
        create: { ...l, isActive: true },
      })
    }
    log.push('✓ Locales (fr, ar, en)')

    // ─── Admin user ──────────────────────────────────────────────────────
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'oulaid.outaalite@gmail.com'
    const adminPassword = process.env.SEED_ADMIN_PASSWORD
    if (!adminPassword || adminPassword.length < 8) {
      return NextResponse.json(
        { ok: false, error: 'SEED_ADMIN_PASSWORD env var is required (min 8 chars).' },
        { status: 500 },
      )
    }
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await db.user.upsert({
      where: { email: adminEmail },
      // Never reset an existing admin's password on re-run — only ensure role/active.
      update: { role: Role.SUPER_ADMIN, isActive: true },
      create: {
        email:    adminEmail,
        password: passwordHash,
        name:     process.env.SEED_ADMIN_NAME ?? 'Oulaid Outaalite',
        role:     Role.SUPER_ADMIN,
      },
    })
    log.push(`✓ Admin user: ${adminEmail}`)

    // ─── Site config ─────────────────────────────────────────────────────
    for (const c of SITE_CONFIG) {
      await db.siteConfig.upsert({
        where:  { key: c.key },
        update: { value: c.value as never, category: c.category, label: c.label },
        create: { key: c.key, value: c.value as never, category: c.category, label: c.label },
      })
    }
    log.push(`✓ Site config (${SITE_CONFIG.length} keys)`)

    // ─── Navigation ──────────────────────────────────────────────────────
    for (let i = 0; i < NAV_ITEMS.length; i++) {
      const n = NAV_ITEMS[i]
      const isCta = 'isCta' in n ? !!n.isCta : false
      await db.navItem.upsert({
        where: { slug: n.slug },
        update: { label: n.label, icon: n.icon, order: i, isCta },
        create: { label: n.label, slug: n.slug, icon: n.icon, order: i, isCta, isPublished: true },
      })
    }
    log.push(`✓ Navigation (${NAV_ITEMS.length} items)`)

    // ─── Categories + sub-categories ────────────────────────────────────
    for (let i = 0; i < SERVICES_TREE.length; i++) {
      const t = SERVICES_TREE[i]
      const nav = await db.navItem.findUnique({ where: { slug: t.slug } })
      const cat = await db.category.upsert({
        where: { slug: t.slug },
        update: { name: t.name, color: t.color, order: i, navItemId: nav?.id ?? undefined },
        create: { name: t.name, slug: t.slug, color: t.color, order: i, navItemId: nav?.id ?? undefined, isPublished: true },
      })
      for (let j = 0; j < t.subs.length; j++) {
        const s = t.subs[j]
        const isAutres = 'isAutres' in s ? !!s.isAutres : false
        await db.subCategory.upsert({
          where:  { categoryId_slug: { categoryId: cat.id, slug: s.slug } },
          update: { name: s.name, order: j, isAutresSlot: isAutres },
          create: { name: s.name, slug: s.slug, order: j, categoryId: cat.id, isAutresSlot: isAutres, isPublished: true },
        })
      }
    }
    log.push(`✓ Categories (${SERVICES_TREE.length}) + sub-categories`)

    return NextResponse.json({
      ok: true,
      log,
      adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'oulaid.outaalite@gmail.com',
      tookMs: Date.now() - t0,
      message: 'Setup complete. You can now log in at /admin/login.',
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok:    false,
        error: err instanceof Error ? err.message : 'unknown',
        log,
      },
      { status: 500 },
    )
  }
}
