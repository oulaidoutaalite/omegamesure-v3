import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()
try {
  const navs = await db.navItem.findMany({ orderBy: { order: 'asc' }, select: { label: true, slug: true, href: true, isPublished: true, isCta: true } })
  console.log('=== NAV ITEMS (menu) ===')
  for (const n of navs) {
    const target = n.href || '/' + n.slug
    console.log(`  [${n.isPublished ? 'pub' : 'OFF'}]${n.isCta ? '[cta]' : ''} "${n.label}"  ->  ${target}`)
  }
  const cats = await db.category.findMany({ orderBy: { order: 'asc' }, select: { name: true, slug: true, isPublished: true, order: true } })
  console.log('\n=== CATEGORIES (pages /[slug]) ===')
  for (const c of cats) {
    console.log(`  [${c.isPublished ? 'pub' : 'OFF'}] order=${c.order}  "${c.name}"  ->  /${c.slug}`)
  }
  // which nav targets have NO matching category page?
  const catSlugs = new Set(cats.map((c) => c.slug))
  const knownStatic = new Set(['accueil', 'contact', 'devis', 'metrologie', 'consulting', 'recherche'])
  console.log('\n=== NAV LINKS WITHOUT A MATCHING CATEGORY PAGE (potential 404) ===')
  let any = false
  for (const n of navs) {
    if (n.href) continue
    if (n.slug === 'accueil') continue
    if (!catSlugs.has(n.slug) && !knownStatic.has(n.slug)) {
      console.log(`  ⚠️  "${n.label}" -> /${n.slug}  (no category with slug "${n.slug}")`)
      any = true
    }
  }
  if (!any) console.log('  none — every menu link resolves ✓')
} finally {
  await db.$disconnect()
}
