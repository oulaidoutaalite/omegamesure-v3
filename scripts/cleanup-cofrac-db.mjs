import fs from 'node:fs'
import { PrismaClient } from '@prisma/client'

function envVal(key) {
  const m = fs.readFileSync('.env', 'utf8').match(new RegExp('^' + key + '="?([^"\\n]*)"?', 'm'))
  return m ? m[1] : undefined
}
const url = envVal('DIRECT_URL') || envVal('DATABASE_URL')
const db = new PrismaClient({ datasources: { db: { url } } })

const stripCofrac = (s) =>
  s.replace(/Prestation COFRAC \(ISO 17025\)\s*:/i, 'Étalonnage :').replace(/\s*COFRAC/gi, '').trim()

try {
  // 1) Dormant SEO config
  const cfg = await db.siteConfig.findUnique({ where: { key: 'seo.description' } })
  if (cfg && typeof cfg.value === 'string' && /COFRAC/i.test(cfg.value)) {
    await db.siteConfig.update({ where: { key: 'seo.description' }, data: { value: stripCofrac(cfg.value) } })
    console.log('seo.description config: COFRAC retiré ✓')
  } else {
    console.log('seo.description config:', cfg ? 'pas de COFRAC (ok)' : 'absent')
  }

  // 2) Any product mentioning COFRAC
  const prods = await db.product.findMany({
    where: {
      OR: [
        { name: { contains: 'COFRAC', mode: 'insensitive' } },
        { shortDescription: { contains: 'COFRAC', mode: 'insensitive' } },
        { description: { contains: 'COFRAC', mode: 'insensitive' } },
        { slug: { contains: 'cofrac', mode: 'insensitive' } },
      ],
    },
    select: { id: true, name: true, slug: true, isPublished: true, shortDescription: true, description: true },
  })
  console.log(`Produits contenant "COFRAC": ${prods.length}`)
  for (const p of prods) {
    console.log(`  - ${p.slug} | publié:${p.isPublished} | ${p.name}`)
    const data = {}
    if (/COFRAC/i.test(p.name)) data.name = stripCofrac(p.name)
    if (p.slug.toLowerCase().includes('cofrac'))
      data.slug = p.slug.replace(/-?cofrac/gi, '').replace(/--+/g, '-').replace(/-$/,'')
    if (p.shortDescription && /COFRAC/i.test(p.shortDescription)) data.shortDescription = stripCofrac(p.shortDescription)
    if (p.description && /COFRAC/i.test(p.description)) data.description = stripCofrac(p.description)
    if (Object.keys(data).length) {
      await db.product.update({ where: { id: p.id }, data })
      console.log(`      -> nettoyé: ${JSON.stringify(data)}`)
    }
  }

  // 3) total published products (context)
  const total = await db.product.count({ where: { isPublished: true } })
  console.log(`Produits publiés au total: ${total}`)
} catch (e) {
  console.error('FAILED:', (e && e.message ? e.message : String(e)).split('\n').slice(-2).join(' '))
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
