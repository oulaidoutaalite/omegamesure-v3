import fs from 'node:fs'
import { PrismaClient } from '@prisma/client'

function envVal(key) {
  const m = fs.readFileSync('.env', 'utf8').match(new RegExp('^' + key + '="?([^"\\n]*)"?', 'm'))
  return m ? m[1] : undefined
}
const url = envVal('DIRECT_URL') || envVal('DATABASE_URL')
const db = new PrismaClient({ datasources: { db: { url } } })

const strip = (s) =>
  s.replace(/métrologie COFRAC/gi, 'métrologie')
   .replace(/étalonnage COFRAC/gi, 'étalonnage')
   .replace(/COFRAC calibration/gi, 'calibration')
   .replace(/معايرة COFRAC/g, 'معايرة')
   .replace(/خدمات المعايرة COFRAC/g, 'خدمات المعايرة')
   .replace(/\s*COFRAC/gi, '')
   .replace(/\s{2,}/g, ' ')
   .trim()

try {
  // ── Scan ALL site config values for COFRAC (incl. per-locale keys) ──
  const all = await db.siteConfig.findMany()
  let n = 0
  for (const c of all) {
    const asText = typeof c.value === 'string' ? c.value : JSON.stringify(c.value)
    if (/COFRAC/i.test(asText)) {
      if (typeof c.value === 'string') {
        const cleaned = strip(c.value)
        await db.siteConfig.update({ where: { key: c.key }, data: { value: cleaned } })
        console.log(`  ✓ config "${c.key}" nettoyé`)
        console.log(`     avant: ${c.value}`)
        console.log(`     après: ${cleaned}`)
        n++
      } else {
        console.log(`  ⚠️ config "${c.key}" contient COFRAC mais n'est pas une chaîne simple:`, asText.slice(0, 120))
      }
    }
  }
  console.log(n === 0 ? 'Aucune config avec COFRAC.' : `${n} config(s) nettoyée(s).`)

  // ── Re-scan products too, just in case ──
  const prods = await db.product.count({
    where: { OR: [
      { name: { contains: 'COFRAC', mode: 'insensitive' } },
      { description: { contains: 'COFRAC', mode: 'insensitive' } },
      { shortDescription: { contains: 'COFRAC', mode: 'insensitive' } },
    ] },
  })
  console.log(`Produits contenant COFRAC: ${prods}`)
} catch (e) {
  console.error('FAILED:', (e && e.message ? e.message : String(e)).split('\n').slice(-2).join(' '))
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
