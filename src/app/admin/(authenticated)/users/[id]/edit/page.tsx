import Link from 'next/link'
import { notFound } from 'next/navigation'

import { UserForm } from '@/components/admin/users/UserForm'
import { requireRole } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export const metadata = { title: 'Éditer l’utilisateur' }
export const dynamic = 'force-dynamic'

export default async function EditUserPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireRole('SUPER_ADMIN')
  const { id } = await params
  const u = await db.user.findUnique({ where: { id } })
  if (!u) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href="/admin/users" className="text-xs text-muted-foreground hover:underline">
          ← Retour aux utilisateurs
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{u.name ?? u.email}</h1>
      </header>

      <div className="rounded-xl border border-border bg-card p-6">
        <UserForm
          mode={{ type: 'edit', id }}
          defaultValues={{
            email:    u.email,
            name:     u.name ?? '',
            role:     u.role,
            isActive: u.isActive,
          }}
        />
      </div>
    </div>
  )
}
