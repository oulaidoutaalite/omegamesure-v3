/**
 * Database seed — Omega Mesure v3
 * Run with: `npm run db:seed`
 *
 * Idempotent: re-running updates instead of duplicating.
 */
import crypto from 'node:crypto'

import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Omega Mesure v3 database…\n')

  // ─── 1. Locales ──────────────────────────────────────────────────────────
  await db.locale.upsert({
    where: { code: 'fr' },
    update: {},
    create: { code: 'fr', name: 'French',  nativeName: 'Français', isDefault: true,  isActive: true, isRtl: false, order: 0 },
  })
  await db.locale.upsert({
    where: { code: 'ar' },
    update: {},
    create: { code: 'ar', name: 'Arabic',  nativeName: 'العربية',  isDefault: false, isActive: true, isRtl: true,  order: 1 },
  })
  await db.locale.upsert({
    where: { code: 'en' },
    update: {},
    create: { code: 'en', name: 'English', nativeName: 'English',  isDefault: false, isActive: true, isRtl: false, order: 2 },
  })
  console.log('✓ Locales (fr, ar, en)')

  // ─── 2. Admin user ───────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'oulaid.outaalite@gmail.com'
  // Never commit a default credential: use SEED_ADMIN_PASSWORD, otherwise generate
  // a strong random password and print it once below.
  const generatedPassword = !process.env.SEED_ADMIN_PASSWORD
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? crypto.randomBytes(12).toString('base64url')
  const passwordHash = await bcrypt.hash(adminPassword, 12)
  await db.user.upsert({
    where: { email: adminEmail },
    update: {
      password: passwordHash, // refresh password on re-seed if value changed
      role:     Role.SUPER_ADMIN,
      isActive: true,
    },
    create: {
      email:    adminEmail,
      password: passwordHash,
      name:     process.env.SEED_ADMIN_NAME ?? 'Oulaid Outaalite',
      role:     Role.SUPER_ADMIN,
    },
  })
  console.log(`✓ Admin user: ${adminEmail}`)

  // ─── 3. Site config (key/value) ──────────────────────────────────────────
  const siteConfig: Array<{ key: string; category: string; value: unknown; label: string }> = [
    { key: 'site.name',         category: 'general',  value: 'Omega Mesure',                           label: 'Nom du site' },
    { key: 'site.tagline',      category: 'general',  value: 'Votre partenaire scientifique & industriel', label: 'Slogan' },
    { key: 'contact.address',   category: 'contact',  value: 'N°35 Lotissement Doha 1er étage Bouskoura, Maroc', label: 'Adresse' },
    { key: 'contact.phone',     category: 'contact',  value: '+212 664 323 049',                        label: 'Téléphone' },
    { key: 'contact.email',     category: 'contact',  value: 'contact@omegamesure.com',                 label: 'Email contact' },
    { key: 'contact.hours',     category: 'contact',  value: 'Lundi – Vendredi · 08h00 – 18h00',        label: 'Horaires' },
    { key: 'branding.primary',  category: 'branding', value: '#185FA5',                                 label: 'Couleur primaire' },
    { key: 'social.linkedin',   category: 'social',   value: '',                                        label: 'LinkedIn URL' },
    { key: 'seo.description',   category: 'seo',      value: 'Fournisseur d\'équipements de laboratoire, balances industrielles, consommables, métrologie et consulting réglementaire au Maroc.', label: 'Meta description globale' },
    { key: 'certifications',    category: 'general',  value: ['ISO 17025'],                             label: 'Certifications affichées' },
  ]
  for (const c of siteConfig) {
    await db.siteConfig.upsert({
      where:  { key: c.key },
      update: { value: c.value as never, category: c.category, label: c.label },
      create: { key: c.key, value: c.value as never, category: c.category, label: c.label },
    })
  }
  console.log(`✓ Site config (${siteConfig.length} keys)`)

  // ─── 4. Navigation ───────────────────────────────────────────────────────
  const navItems: Array<{ slug: string; label: string; icon: string; isCta?: boolean }> = [
    { slug: 'accueil',                  label: 'Accueil',                       icon: 'IconHome' },
    { slug: 'equipements-labo',         label: 'Équipements labo & biomédicales', icon: 'IconFlask' },
    { slug: 'balances-bascules',        label: 'Balances & bascules',           icon: 'IconScale' },
    { slug: 'consommables',             label: 'Consommables',                  icon: 'IconBottle' },
    { slug: 'metrologie',               label: 'Métrologie',                    icon: 'IconRuler' },
    { slug: 'consulting',               label: 'Consulting',                    icon: 'IconBriefcase' },
    { slug: 'contact',                  label: 'Contact us',                    icon: 'IconMail' },
    { slug: 'devis',                    label: 'Demander un devis',             icon: 'IconFileInvoice', isCta: true },
  ]
  for (let i = 0; i < navItems.length; i++) {
    const n = navItems[i]
    await db.navItem.upsert({
      where: { slug: n.slug },
      update: { label: n.label, icon: n.icon, order: i, isCta: n.isCta ?? false },
      create: { label: n.label, slug: n.slug, icon: n.icon, order: i, isCta: n.isCta ?? false, isPublished: true },
    })
  }
  console.log(`✓ Navigation (${navItems.length} items)`)

  // ─── 5. Categories + sub-categories ──────────────────────────────────────
  const tree: Array<{ slug: string; name: string; color: string; subs: Array<{ slug: string; name: string; isAutres?: boolean }> }> = [
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
  ]
  for (let i = 0; i < tree.length; i++) {
    const t = tree[i]
    const nav = await db.navItem.findUnique({ where: { slug: t.slug } })
    const cat = await db.category.upsert({
      where: { slug: t.slug },
      update: { name: t.name, color: t.color, order: i, navItemId: nav?.id ?? undefined },
      create: { name: t.name, slug: t.slug, color: t.color, order: i, navItemId: nav?.id ?? undefined, isPublished: true },
    })
    for (let j = 0; j < t.subs.length; j++) {
      const s = t.subs[j]
      await db.subCategory.upsert({
        where:  { categoryId_slug: { categoryId: cat.id, slug: s.slug } },
        update: { name: s.name, order: j, isAutresSlot: s.isAutres ?? false },
        create: { name: s.name, slug: s.slug, order: j, categoryId: cat.id, isAutresSlot: s.isAutres ?? false, isPublished: true },
      })
    }
  }
  console.log(`✓ Categories (${tree.length}) + sub-categories`)

  // ─── 6. A few demo products + services ───────────────────────────────────
  const balanceCat   = await db.category.findUnique({ where: { slug: 'balances-bascules' } })
  const balanceSubAn = balanceCat ? await db.subCategory.findFirst({ where: { categoryId: balanceCat.id, slug: 'analytiques' } }) : null

  if (balanceCat && balanceSubAn) {
    await db.product.upsert({
      where: { slug: 'balance-analytique-mb220' },
      update: { kind: 'PRODUCT' },
      create: {
        name:             'Balance analytique MB220',
        slug:             'balance-analytique-mb220',
        kind:             'PRODUCT',
        shortDescription: 'Balance analytique 220 g · résolution 0,0001 g',
        description:      'Balance analytique haute précision avec calibration interne automatique, écran tactile, conformité USP/EP.',
        brand:            'OmegaMet',
        model:            'MB220',
        price:            42000,
        currency:         'MAD',
        categoryId:       balanceCat.id,
        subCategoryId:    balanceSubAn.id,
        isPublished:      true,
        isFeatured:       true,
        publishedAt:      new Date(),
      },
    })
  }

  const consumablesCat = await db.category.findUnique({ where: { slug: 'consommables' } })
  const colonnesSub    = consumablesCat ? await db.subCategory.findFirst({ where: { categoryId: consumablesCat.id, slug: 'colonnes-chromato' } }) : null
  if (consumablesCat && colonnesSub) {
    await db.product.upsert({
      where: { slug: 'colonne-hplc-c18-150x46' },
      update: { kind: 'PRODUCT' },
      create: {
        name:          'Colonne HPLC C18 150×4,6 mm',
        slug:          'colonne-hplc-c18-150x46',
        kind:          'PRODUCT',
        shortDescription: 'Colonne phase inverse C18, particules 5 µm',
        description:   'Colonne chromatographique haute performance, conforme USP L1.',
        brand:         'ChromaPro',
        model:         'C18-5',
        price:         2200,
        categoryId:    consumablesCat.id,
        subCategoryId: colonnesSub.id,
        isPublished:   true,
      },
    })
  }

  // Demo services (Métrologie + Consulting)
  const metrologieCat = await db.category.findUnique({ where: { slug: 'metrologie' } })
  const tempSub       = metrologieCat ? await db.subCategory.findFirst({ where: { categoryId: metrologieCat.id, slug: 'temperature' } }) : null
  if (metrologieCat && tempSub) {
    await db.product.upsert({
      where: { slug: 'etalonnage-temperature' },
      update: { kind: 'SERVICE' },
      create: {
        name:             'Étalonnage température',
        slug:             'etalonnage-temperature',
        kind:             'SERVICE',
        shortDescription: 'Étalonnage sur site ou en laboratoire pour enceintes, sondes, thermomètres.',
        description:      'Étalonnage : raccordement aux étalons nationaux, certificat normalisé, validation des moyens de mesure. Délai 5 jours ouvrés.',
        brand:            'Labo Omega Mesure',
        model:            'ETAL-T',
        categoryId:       metrologieCat.id,
        subCategoryId:    tempSub.id,
        isPublished:      true,
        isFeatured:       true,
        publishedAt:      new Date(),
      },
    })
  }

  const consultingCat = await db.category.findUnique({ where: { slug: 'consulting' } })
  const qualifSub     = consultingCat ? await db.subCategory.findFirst({ where: { categoryId: consultingCat.id, slug: 'qualification' } }) : null
  if (consultingCat && qualifSub) {
    await db.product.upsert({
      where: { slug: 'qualification-iqoqpq' },
      update: { kind: 'SERVICE' },
      create: {
        name:             'Qualification IQ / OQ / PQ',
        slug:             'qualification-iqoqpq',
        kind:             'SERVICE',
        shortDescription: 'Qualification d\'installation, opérationnelle et de performance des équipements GMP.',
        description:      'Protocoles, exécution sur site, rapports normalisés conformes GAMP 5 / FDA / EMA. Intervient sur enceintes, autoclaves, balances, équipements de production.',
        brand:            'Consulting Omega',
        model:            'QUAL-IQOQPQ',
        categoryId:       consultingCat.id,
        subCategoryId:    qualifSub.id,
        isPublished:      true,
        publishedAt:      new Date(),
      },
    })
  }

  console.log('✓ Demo items: 2 produits + 2 services')

  console.log('\n✅ Seed complete!')
  console.log(`   Login → /admin    ${adminEmail}`)
  if (generatedPassword) {
    console.log(`   Generated admin password (shown once, save it): ${adminPassword}`)
  } else {
    console.log('   Admin password: (from SEED_ADMIN_PASSWORD env)')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
