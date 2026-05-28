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
        metadata:   input.metadata ?? undefined,
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
