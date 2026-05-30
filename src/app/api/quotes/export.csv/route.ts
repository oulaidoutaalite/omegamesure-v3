import { NextResponse } from 'next/server'

import { getCurrentSession } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return ''
  let s = String(v)
  if (s.includes('"')) s = s.replace(/"/g, '""')
  if (/[",\n\r]/.test(s)) s = `"${s}"`
  return s
}

export async function GET() {
  const session = await getCurrentSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await db.quoteRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { assignedTo: { select: { name: true, email: true } } },
  })

  const headers = [
    'reference', 'createdAt', 'status', 'fullName', 'company',
    'email', 'phone', 'requestType', 'sector', 'quantity',
    'deadline', 'description', 'assignedTo', 'internalNotes',
    'emailSentAt', 'closedAt',
  ]
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push([
      r.reference,
      r.createdAt.toISOString(),
      r.status,
      r.fullName,
      r.company ?? '',
      r.email,
      r.phone ?? '',
      r.requestType,
      r.sector ?? '',
      r.quantity ?? '',
      r.deadline ?? '',
      r.description,
      r.assignedTo?.name ?? r.assignedTo?.email ?? '',
      r.internalNotes ?? '',
      r.emailSentAt?.toISOString() ?? '',
      r.closedAt?.toISOString() ?? '',
    ].map(csvCell).join(','))
  }
  const body = '﻿' + lines.join('\n') // BOM for Excel UTF-8

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="omega-quotes-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control':       'no-store',
    },
  })
}
