import { NextResponse } from 'next/server'

import { listMedia } from '@/lib/actions/media'
import { getCurrentSession } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getCurrentSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const type    = url.searchParams.get('type')   ?? undefined
  const folder  = url.searchParams.get('folder') ?? undefined
  const search  = url.searchParams.get('search') ?? undefined
  const page    = Number.parseInt(url.searchParams.get('page')    ?? '1', 10) || 1
  const perPage = Number.parseInt(url.searchParams.get('perPage') ?? '60', 10) || 60

  const result = await listMedia({
    type: type as 'IMAGE' | 'DOCUMENT' | 'VIDEO' | 'OTHER' | undefined,
    folder,
    search,
    page,
    perPage,
  })
  return NextResponse.json(result)
}
