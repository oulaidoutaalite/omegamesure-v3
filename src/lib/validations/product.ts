import { z } from 'zod'

import { translationsJsonSchema } from './category'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const productImageSchema = z.object({
  url:       z.string().min(1).max(500),
  alt:       z.string().max(300).optional().default(''),
  isPrimary: z.boolean().optional().default(false),
})
export type ProductImage = z.infer<typeof productImageSchema>

export const itemKindEnum = z.enum(['PRODUCT', 'SERVICE'])
export type ItemKindValue = z.infer<typeof itemKindEnum>

/** Technical specifications table shown on the public product page. */
export const specTableSchema = z.object({
  columns: z.array(z.string().max(120)).min(1).max(12),
  rows:    z.array(z.array(z.string().max(400)).max(12)).max(300),
})
export type SpecTable = z.infer<typeof specTableSchema>

export const productSchema = z.object({
  name:             z.string().trim().min(1, 'Le nom est requis').max(200),
  slug:             z.string().trim().min(1).max(200).regex(slugRegex, 'Slug invalide'),
  kind:             itemKindEnum.default('PRODUCT'),
  shortDescription: z.string().max(300).optional().or(z.literal('')),
  description:      z.string().max(8000).optional().or(z.literal('')),
  brand:            z.string().max(120).optional().or(z.literal('')),
  model:            z.string().max(120).optional().or(z.literal('')),
  price:            z.coerce.number().nonnegative().optional().nullable(),
  currency:         z.string().max(8).default('MAD'),

  categoryId:    z.string().optional().nullable(),
  subCategoryId: z.string().optional().nullable(),

  images:       z.array(productImageSchema).max(20).default([]),
  specs:        specTableSchema.nullable().optional().default(null),
  datasheetUrl: z.string().max(500).optional().or(z.literal('')),
  /** Admin authorization to show/download the datasheet PDF publicly. */
  datasheetVisible: z.boolean().default(false),

  isPublished: z.boolean().default(false),
  isFeatured:  z.boolean().default(false),

  metaTitle:       z.string().max(200).optional().or(z.literal('')),
  metaDescription: z.string().max(400).optional().or(z.literal('')),
  translations:    translationsJsonSchema,
})
export type ProductInput = z.infer<typeof productSchema>

export const productUpdateSchema = productSchema.partial().extend({
  id: z.string().min(1),
})
export type ProductUpdate = z.infer<typeof productUpdateSchema>
