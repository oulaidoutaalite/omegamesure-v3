import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Liveness + readiness probe.
 *  - 200 with `db: 'ok'` when Postgres is reachable
 *  - 503 with `db: 'down'` otherwise
 *
 * Use this from uptime monitors / load balancers / Vercel checks.
 */
export async function GET() {
  const startedAt = Date.now()
  let dbOk = false
  let dbError: string | undefined
  try {
    await db.$queryRawUnsafe('SELECT 1')
    dbOk = true
  } catch (err) {
    dbError = err instanceof Error ? err.message : 'unknown'
  }

  const body = {
    status:    dbOk ? 'ok' : 'degraded',
    db:        dbOk ? 'ok' : 'down',
    dbError,
    version:   process.env.npm_package_version ?? 'unknown',
    uptimeMs:  Math.round(process.uptime() * 1000),
    latencyMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  }
  return NextResponse.json(body, { status: dbOk ? 200 : 503 })
}
