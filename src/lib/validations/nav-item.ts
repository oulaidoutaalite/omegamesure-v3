import { z } from 'zod'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const navItemSchema = z.object({
  label:       z.string().trim().min(1, 'Le libellé est requis').max(60),
  slug:        z.string().trim().min(1, 'Le slug est requis').max(60).regex(slugRegex, 'Slug invalide (a-z, 0-9, tirets)'),
  icon:        z.string().trim().max(60).optional().or(z.literal('')),
  href:        z.string().trim().max(200).optional().or(z.literal('')),
  parentId:    z.string().trim().optional().nullable(),
  isPublished: z.boolean().default(true),
  isCta:       z.boolean().default(false),
  translations: z.record(z.string(), z.object({ label: z.string().optional() }).partial()).optional(),
})

export type NavItemInput = z.infer<typeof navItemSchema>

export const navItemUpdateSchema = navItemSchema.partial().extend({
  id: z.string().min(1),
})
export type NavItemUpdate = z.infer<typeof navItemUpdateSchema>

export const reorderSchema = z.object({
  parentId: z.string().nullable(),
  orderedIds: z.array(z.string().min(1)).min(1),
})
export type ReorderInput = z.infer<typeof reorderSchema>
