import fs from 'node:fs'
import { PrismaClient } from '@prisma/client'

// Use DIRECT_URL (session pooler, 5432) — the transaction pooler (6543) is flaky here.
function envVal(key) {
  const m = fs.readFileSync('.env', 'utf8').match(new RegExp('^' + key + '="?([^"\\n]*)"?', 'm'))
  return m ? m[1] : undefined
}
const url = envVal('DIRECT_URL') || envVal('DATABASE_URL')
const db = new PrismaClient({ datasources: { db: { url } } })

const SLUG = 'equipements-biomedical'
const NAME_FR = 'Équipements biomédicale'
const TR = { ar: { name: 'المعدات الطبية الحيوية' }, en: { name: 'Biomedical equipment' } }
const TR_NAV = { ar: { label: 'المعدات الطبية الحيوية' }, en: { label: 'Biomedical equipment' } }

try {
  // 1) The broken nav item currently points to /biom
  const nav = await db.navItem.findFirst({ where: { slug: 'biom' } })

  // 2) Create (or refresh) the real category page
  const cat = await db.category.upsert({
    where: { slug: SLUG },
    update: { name: NAME_FR, isPublished: true, translations: TR },
    create: {
      name: NAME_FR,
      slug: SLUG,
      color: '#0891B2',
      order: 6,
      isPublished: true,
      translations: TR,
    },
  })

  // 3) Repoint + relabel the menu item, and link it to the category
  let navUpdated = false
  if (nav) {
    await db.navItem.update({
      where: { id: nav.id },
      data: { slug: SLUG, label: NAME_FR, translations: TR_NAV },
    })
    await db.category.update({ where: { id: cat.id }, data: { navItemId: nav.id } })
    navUpdated = true
  }

  console.log('OK')
  console.log('  category:', cat.slug, '| published:', cat.isPublished, '| order:', cat.order)
  console.log('  nav repointed (biom ->', SLUG + '):', navUpdated)
  console.log('  new URL: /' + SLUG)
} catch (e) {
  console.error('FAILED:', (e && e.message ? e.message : String(e)).split('\n').slice(-3).join(' '))
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
