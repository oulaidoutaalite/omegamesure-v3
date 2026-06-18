import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CategoryForm } from '@/components/admin/categories/CategoryForm'
import {
  SubCategoriesSection,
  type SubRow,
} from '@/components/admin/categories/SubCategoriesSection'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import { loadTranslatableLocales } from '@/lib/locales'

export const metadata = { title: 'Éditer la catégorie' }
export const dynamic = 'force-dynamic'

export default async function EditCategoryPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const { id } = await params

  const [category, navItems, subs, translatableLocales, allCats] = await Promise.all([
    db.category.findUnique({ where: { id } }),
    db.navItem.findMany({
      where: { parentId: null },
      orderBy: { order: 'asc' },
      select: { id: true, label: true },
    }),
    db.subCategory.findMany({
      where: { categoryId: id },
      orderBy: { order: 'asc' },
      select: {
        id: true, name: true, slug: true, description: true,
        isPublished: true, isAutresSlot: true, translations: true,
      },
    }),
    loadTranslatableLocales(),
    db.category.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true } }),
  ])

  if (!category) notFound()

  const subRows: SubRow[] = subs.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    isPublished: s.isPublished,
    isAutresSlot: s.isAutresSlot,
    translations: (s.translations as Record<string, Record<string, string>> | null) ?? null,
  }))

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header>
        <Link href="/admin/categories" className="text-xs text-muted-foreground hover:underline">
          ← Retour aux catégories
        </Link>
        <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight">
          {category.color && (
            <span
              className="inline-block h-4 w-4 rounded-full border border-black/10"
              style={{ backgroundColor: category.color }}
            />
          )}
          {category.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Slug: <code className="rounded bg-muted px-1.5 py-0.5">/{category.slug}</code>
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold">Informations générales</h2>
        <CategoryForm
          mode={{ type: 'edit', id }}
          navItemOptions={navItems.map((n) => ({ id: n.id, label: n.label }))}
          translatableLocales={translatableLocales}
          defaultValues={{
            name:            category.name,
            slug:            category.slug,
            description:     category.description ?? '',
            icon:            category.icon ?? '',
            color:           category.color ?? '#185FA5',
            heroImageUrl:    category.heroImageUrl ?? '',
            navItemId:       category.navItemId,
            isPublished:     category.isPublished,
            metaTitle:       category.metaTitle ?? '',
            metaDescription: category.metaDescription ?? '',
            translations:    (category.translations as Record<string, Record<string, string>> | null) ?? undefined,
          }}
        />
      </section>

      <section>
        <SubCategoriesSection
          categoryId={id}
          items={subRows}
          translatableLocales={translatableLocales}
          categories={allCats.filter((c) => c.id !== id)}
        />
      </section>
    </div>
  )
}
