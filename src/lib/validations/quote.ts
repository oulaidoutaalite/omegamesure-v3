import { z } from 'zod'

export const requestTypeEnum = z.enum([
  'EQUIPMENT', 'BALANCE', 'CONSUMABLE', 'METROLOGY', 'CONSULTING', 'OTHER',
])
export const sectorEnum = z.enum([
  'PHARMA', 'INDUSTRY', 'BIOMEDICAL', 'AGRO', 'RESEARCH', 'LOGISTICS', 'OTHER',
])
export const quoteStatusEnum = z.enum([
  'NEW', 'IN_PROGRESS', 'QUOTE_SENT', 'WON', 'LOST',
])

/** One line of the optional multi-product "cart" request. */
export const quoteCartItemSchema = z.object({
  slug: z.string().trim().max(160),
  name: z.string().trim().min(1).max(240),
  qty:  z.number().int().min(1).max(99999).catch(1),
})
export type QuoteCartItem = z.infer<typeof quoteCartItemSchema>

/** Schema for the public website quote form. */
export const publicQuoteSchema = z
  .object({
    fullName:    z.string().trim().min(2, 'Nom requis').max(120),
    company:     z.string().trim().max(200).optional().or(z.literal('')),
    email:       z.string().trim().email('Email invalide').max(200),
    phone:       z.string().trim().max(40).optional().or(z.literal('')),
    requestType: requestTypeEnum,
    sector:      sectorEnum.optional(),
    quantity:    z.string().max(120).optional().or(z.literal('')),
    deadline:    z.string().max(120).optional().or(z.literal('')),
    description: z.string().trim().max(4000),
    productId:   z.string().max(64).optional().or(z.literal('')),
    // Optional cart: list of selected products for a single grouped request.
    items:       z.array(quoteCartItemSchema).max(80).optional(),
    locale:      z.string().min(2).max(8).default('fr'),
  })
  .superRefine((val, ctx) => {
    // A free-text description is required only when no products are selected.
    if ((!val.items || val.items.length === 0) && val.description.trim().length < 10) {
      ctx.addIssue({ path: ['description'], code: z.ZodIssueCode.custom, message: 'Décrivez votre besoin (≥ 10 caractères)' })
    }
  })
export type PublicQuoteInput = z.infer<typeof publicQuoteSchema>

/** Status / assignment / notes updates from the admin. */
export const updateQuoteSchema = z.object({
  id:            z.string().min(1),
  status:        quoteStatusEnum.optional(),
  internalNotes: z.string().max(4000).optional().or(z.literal('')),
  assignedToId:  z.string().nullable().optional(),
})
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>

/** Sending a reply email from the admin. */
export const replyQuoteSchema = z.object({
  id:      z.string().min(1),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(20000),
  /** When true, also moves the quote to QUOTE_SENT. */
  markSent: z.boolean().default(true),
})
export type ReplyQuoteInput = z.infer<typeof replyQuoteSchema>

// ─── Contact ────────────────────────────────────────────────────────────────

export const contactStatusEnum = z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED'])

export const publicContactSchema = z.object({
  name:    z.string().trim().min(2, 'Nom requis').max(120),
  email:   z.string().trim().email('Email invalide').max(200),
  phone:   z.string().trim().max(40).optional().or(z.literal('')),
  subject: z.string().trim().max(200).optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Message trop court').max(8000),
})
export type PublicContactInput = z.infer<typeof publicContactSchema>

export const updateContactSchema = z.object({
  id:     z.string().min(1),
  status: contactStatusEnum.optional(),
})
export type UpdateContactInput = z.infer<typeof updateContactSchema>

export const replyContactSchema = z.object({
  id:      z.string().min(1),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(5).max(20000),
})
export type ReplyContactInput = z.infer<typeof replyContactSchema>
