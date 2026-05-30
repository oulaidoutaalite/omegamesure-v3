import { z } from 'zod'

/** Each entry the admin can save. `value` may be any JSON-serializable. */
export const configEntrySchema = z.object({
  key:      z.string().min(1).max(120),
  category: z.string().max(40).optional().nullable(),
  label:    z.string().max(120).optional().nullable(),
  value:    z.unknown(),
})
export type ConfigEntry = z.infer<typeof configEntrySchema>

/** Bulk update — used by tabbed config forms. */
export const configBulkSchema = z.object({
  entries: z.array(configEntrySchema).min(1).max(80),
})
export type ConfigBulkInput = z.infer<typeof configBulkSchema>
