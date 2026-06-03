import { z } from 'zod'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Per-locale field map: { ar: { name, description }, en: {…} }
 * A record is already "all-keys-optional", so no .partial() is needed
 * (and .partial() is not available on ZodRecord). */
export const translationsJsonSchema = z
  .record(z.string(), z.record(z.string(), z.string()))
  .optional()
  .nullable()
export type TranslationsJsonInput = z.infer<typeof translationsJsonSchema>

export const categorySchema = z.object({
  name:            z.string().trim().min(1, 'Le nom est requis').max(120),
  slug:            z.string().trim().min(1).max(120).regex(slugRegex, 'Slug invalide'),
  description:     z.string().max(2000).optional().or(z.literal('')),
  icon:            z.string().max(60).optional().or(z.literal('')),
  color:           z.string().max(30).optional().or(z.literal('')),
  heroImageUrl:    z.string().max(500).optional().or(z.literal('')),
  navItemId:       z.string().optional().nullable(),
  isPublished:     z.boolean().default(true),
  metaTitle:       z.string().max(120).optional().or(z.literal('')),
  metaDescription: z.string().max(300).optional().or(z.literal('')),
  translations:    translationsJsonSchema,
})
export type CategoryInput = z.infer<typeof categorySchema>

export const categoryUpdateSchema = categorySchema.partial().extend({
  id: z.string().min(1),
})
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>

export const subCategorySchema = z.object({
  categoryId:   z.string().min(1),
  name:         z.string().trim().min(1).max(120),
  slug:         z.string().trim().min(1).max(120).regex(slugRegex, 'Slug invalide'),
  description:  z.string().max(2000).optional().or(z.literal('')),
  icon:         z.string().max(60).optional().or(z.literal('')),
  imageUrl:     z.string().max(500).optional().or(z.literal('')),
  isPublished:  z.boolean().default(true),
  isAutresSlot: z.boolean().default(false),
  translations: translationsJsonSchema,
})
export type SubCategoryInput = z.infer<typeof subCategorySchema>

export const subCategoryUpdateSchema = subCategorySchema.partial().extend({
  id: z.string().min(1),
})
export type SubCategoryUpdate = z.infer<typeof subCategoryUpdateSchema>
