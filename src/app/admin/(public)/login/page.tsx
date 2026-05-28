import { redirect } from 'next/navigation'
import { Suspense } from 'react'

import { LoginForm } from '@/components/admin/LoginForm'
import { getCurrentSession } from '@/lib/auth-helpers'

export const metadata = { title: 'Connexion admin' }
export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  // Already signed in? Go straight to dashboard.
  const session = await getCurrentSession()
  if (session?.user) redirect('/admin')

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-brand">Omega Mesure</h1>
        <p className="mt-1 text-sm text-muted-foreground">Espace administrateur</p>
      </div>

      <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-muted" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Accès réservé aux administrateurs autorisés.
      </p>
    </div>
  )
}
