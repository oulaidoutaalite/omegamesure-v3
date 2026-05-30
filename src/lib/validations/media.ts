import { z } from 'zod'

export const mediaUpdateSchema = z.object({
  id:     z.string().min(1),
  alt:    z.string().max(300).optional().or(z.literal('')),
  folder: z.string().max(60).optional().or(z.literal('')),
  tags:   z.array(z.string().max(40)).max(20).optional(),
})
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>

export const mediaListQuerySchema = z.object({
  type:   z.enum(['IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER']).optional(),
  folder: z.string().max(60).optional(),
  search: z.string().max(120).optional(),
  page:   z.number().int().positive().default(1),
  perPage: z.number().int().positive().max(60).default(24),
})
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>
