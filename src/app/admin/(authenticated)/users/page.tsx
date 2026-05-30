import { IconPlus } from '@tabler/icons-react'
import Link from 'next/link'

import { UsersTable, type UserRow } from '@/components/admin/users/UsersTable'
import { Button } from '@/components/ui/button'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export const metadata = { title: 'Utilisateurs admin' }
export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await requireRole('SUPER_ADMIN')

  const rows = await db.user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true, email: true, name: true, role: true,
      isActive: true, lastLoginAt: true,
    },
  })
  const items: UserRow[] = rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  }))

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs admin</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les accès au dashboard. Les rôles définissent les permissions.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/users/new"><IconPlus size={16} /> Nouveau</Link>
        </Button>
      </header>

      <UsersTable items={items} currentUserId={session.user.id} />
    </div>
  )
}
