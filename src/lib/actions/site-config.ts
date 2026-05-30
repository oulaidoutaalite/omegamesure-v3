'use server'

import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

import { logActivity } from '@/lib/activity'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'
import {
  configBulkSchema,
  type ConfigBulkInput,
} from '@/lib/validations/site-config'

import { type ActionResult } from './nav-items'

/** Save multiple config keys in a single transaction. Upserts by key. */
export async function saveConfigEntries(input: ConfigBulkInput): Promise<ActionResult> {
  const session = await requireRole(['SUPER_ADMIN', 'ADMIN'])
  const parsed = configBulkSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }

  const { entries } = parsed.data
  try {
    await db.$transaction(
      entries.map((e) =>
        db.siteConfig.upsert({
          where:  { key: e.key },
          update: {
            value:    (e.value ?? null) as Prisma.InputJsonValue,
            category: e.category ?? undefined,
            label:    e.label    ?? undefined,
          },
          create: {
            key:      e.key,
            value:    (e.value ?? null) as Prisma.InputJsonValue,
            category: e.category ?? null,
            label:    e.label    ?? null,
          },
        }),
      ),
    )
    await logActivity({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'SiteConfig',
      metadata: { keys: entries.map((e) => e.key) },
    })
    revalidatePath('/admin/config')
    revalidatePath('/')
    return { ok: true, data: undefined }
  } catch {
    return { ok: false, error: 'Erreur serveur' }
  }
}
