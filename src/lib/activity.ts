import { Prisma } from '@prisma/client'
import { headers } from 'next/headers'

import { db } from './db'

type LogActivityInput = {
  userId?: string | null
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER' | 'PUBLISH' | 'UNPUBLISH' | 'LOGIN' | 'LOGOUT' | (string & {})
  entityType: 'NavItem' | 'Category' | 'SubCategory' | 'Product' | 'QuoteRequest' | 'ContactMessage' | 'User' | 'SiteConfig' | 'Media' | 'BlogPost' | (string & {})
  entityId?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Append an entry to the activity log. Best-effort: never throws.
 * Captures IP + user-agent from the request headers when possible.
 */
export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    const h = await headers()
    const ipAddress =
      h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      h.get('x-real-ip') ??
      null
    const userAgent = h.get('user-agent') ?? null

    await db.activityLog.create({
      data: {
        userId:     input.userId ?? null,
        action:     input.action,
        entityType: input.entityType,
        entityId:   input.entityId ?? null,
        // `Record<string, unknown>` n'est pas assignable au type JSON de Prisma :
        // `unknown` n'est pas garanti sérialisable. Les appelants ne passent que
        // des objets plats (noms, slugs, compteurs), d'où cette conversion au
        // point d'entrée plutôt qu'un type JSON imposé à tous les appelants.
        metadata:   (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ipAddress,
        userAgent,
      },
    })
  } catch (err) {
    // Don't break the user flow if logging fails.
    // eslint-disable-next-line no-console
    console.warn('[activity] failed to log:', err)
  }
}
