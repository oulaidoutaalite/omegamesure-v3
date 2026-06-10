import fs from 'node:fs'
import { PrismaClient } from '@prisma/client'

function envVal(key) {
  const m = fs.readFileSync('.env', 'utf8').match(new RegExp('^' + key + '="?([^"\\n]*)"?', 'm'))
  return m ? m[1] : undefined
}
const url = envVal('DIRECT_URL') || envVal('DATABASE_URL')
const db = new PrismaClient({ datasources: { db: { url } } })

// Current home-page texts (from the message files) → seeded so the admin shows
// the real content and the public page renders identically from config.
const HOME = {
  'home.heroBadge': {
    fr: 'Maroc · Distributeur agréé multi-marques',
    ar: 'المغرب · موزع معتمد متعدد العلامات التجارية',
    en: 'Morocco · Authorized multi-brand distributor',
  },
  'home.statProducts':        { fr: 'Produits référencés', ar: 'منتجات مدرجة', en: 'Listed products' },
  'home.statExperience':      { fr: "Années d'expérience", ar: 'سنوات من الخبرة', en: 'Years of experience' },
  'home.statExperienceValue': { fr: '15+', ar: '15+', en: '15+' },
  'home.statMetrology':       { fr: 'Métrologie sur site', ar: 'معايرة في الموقع', en: 'On-site metrology' },
  'home.statMetrologyValue':  { fr: 'Toutes marques', ar: 'جميع العلامات', en: 'All brands' },
  'home.statsTitle':   { fr: 'Nos univers', ar: 'مجالاتنا', en: 'Our offering' },
  'home.statsHeading': { fr: 'Catalogue & services', ar: 'الكتالوج والخدمات', en: 'Catalog & services' },
  'home.statsLead': {
    fr: 'Équipements pharmaceutiques, balances industrielles, consommables, étalonnage et accompagnement BPF.',
    ar: 'معدات صيدلانية، موازين صناعية، مستهلكات، معايرة ومرافقة BPF.',
    en: 'Pharmaceutical equipment, industrial scales, consumables, calibration and GMP support.',
  },
  'home.certsTitle': { fr: 'Qualité & conformité', ar: 'الجودة والمطابقة', en: 'Quality & compliance' },
  'home.ctaTitle': {
    fr: 'Un besoin précis ? Parlons-en.',
    ar: 'هل لديك حاجة محددة؟ لنتحدث.',
    en: "Got a specific need? Let's talk.",
  },
  'home.ctaLead': {
    fr: 'Décrivez-nous votre projet — équipement, étalonnage, qualification — et nous revenons vers vous sous 48 h ouvrées.',
    ar: 'صف لنا مشروعك — معدات، معايرة، مؤهلات — وسنرد عليك خلال 48 ساعة عمل.',
    en: "Tell us about your project — equipment, calibration, qualification — and we'll get back to you within 48 business hours.",
  },
}

const FR_DESC =
  "Fournisseur d'équipements de laboratoire, balances industrielles, consommables, étalonnage et conseil réglementaire au Maroc."

try {
  let created = 0
  for (const [baseKey, vals] of Object.entries(HOME)) {
    for (const [code, val] of [['', vals.fr], ['ar', vals.ar], ['en', vals.en]]) {
      const key = code ? `${baseKey}.${code}` : baseKey
      const res = await db.siteConfig.upsert({
        where: { key },
        update: {}, // never clobber a value the admin may have edited
        create: { key, value: val, category: 'content', label: baseKey },
      })
      if (res) created++
    }
  }
  console.log(`Seed contenu accueil : ${Object.keys(HOME).length} textes × 3 langues traités.`)

  // Fix the discordance: fill the empty FR hero description (AR/EN already set).
  const sd = await db.siteConfig.findUnique({ where: { key: 'site.description' } })
  if (!sd || !(typeof sd.value === 'string' && sd.value.trim())) {
    await db.siteConfig.upsert({
      where: { key: 'site.description' },
      update: { value: FR_DESC },
      create: { key: 'site.description', value: FR_DESC, category: 'content', label: 'Hero — description' },
    })
    console.log('  ✓ Description FR (vide) remplie → discordance corrigée.')
  } else {
    console.log('  Description FR déjà remplie, inchangée.')
  }
} catch (e) {
  console.error('FAILED:', (e && e.message ? e.message : String(e)).split('\n').slice(-2).join(' '))
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
