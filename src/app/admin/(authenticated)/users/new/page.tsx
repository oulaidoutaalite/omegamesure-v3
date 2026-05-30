import Link from 'next/link'

import { UserForm } from '@/components/admin/users/UserForm'
import { requireRole } from '@/lib/auth-helpers'

export const metadata = { title: 'Nouvel utilisateur' }
export const dynamic = 'force-dynamic'

export default async function NewUserPage() {
  await requireRole('SUPER_ADMIN')
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <Link href="/admin/users" className="text-xs text-muted-foreground hover:underline">
          ← Retour aux utilisateurs
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Nouvel utilisateur</h1>
      </header>

      <div className="rounded-xl border border-border bg-card p-6">
        <UserForm mode={{ type: 'create' }} />
      </div>
    </div>
  )
}
