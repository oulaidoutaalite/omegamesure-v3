import { z } from 'zod'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const productImageSchema = z.object({
  url:       z.string().min(1).max(500),
  alt:       z.string().max(300).optional().default(''),
  isPrimary: z.boolean().optional().default(false),
})
export type ProductImage = z.infer<typeof productImageSchema>

export const productSchema = z.object({
  name:             z.string().trim().min(1, 'Le nom est requis').max(200),
  slug:             z.string().trim().min(1).max(200).regex(slugRegex, 'Slug invalide'),
  shortDescription: z.string().max(300).optional().or(z.literal('')),
  description:      z.string().max(8000).optional().or(z.literal('')),
  brand:            z.string().max(120).optional().or(z.literal('')),
  model:            z.string().max(120).optional().or(z.literal('')),
  price:            z.coerce.number().nonnegative().optional().nullable(),
  currency:         z.string().max(8).default('MAD'),

  categoryId:    z.string().optional().nullable(),
  subCategoryId: z.string().optional().nullable(),

  images:       z.array(productImageSchema).max(20).default([]),
  datasheetUrl: z.string().max(500).optional().or(z.literal('')),

  isPublished: z.boolean().default(false),
  isFeatured:  z.boolean().default(false),

  metaTitle:       z.string().max(200).optional().or(z.literal('')),
  metaDescription: z.string().max(400).optional().or(z.literal('')),
})
export type ProductInput = z.infer<typeof productSchema>

export const productUpdateSchema = productSchema.partial().extend({
  id: z.string().min(1),
})
export type ProductUpdate = z.infer<typeof productUpdateSchema>
