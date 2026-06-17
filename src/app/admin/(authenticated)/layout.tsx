import type { ReactNode } from 'react'

import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminTopbar } from '@/components/admin/AdminTopbar'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { requireAuth } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

/**
 * Protected admin layout — auth gate + sidebar + topbar.
 * The middleware already redirects unauthenticated users, but we double-check
 * here so getServerSession() is available to render the topbar.
 */
export default async function AdminAuthenticatedLayout({ children }: { children: ReactNode }) {
  const session = await requireAuth()
  const u = session.user

  // Pending (NEW) quote requests — surfaced as a badge in the sidebar
  const newQuoteCount = await db.quoteRequest.count({ where: { status: 'NEW' } }).catch(() => 0)

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar userRole={u.role} quoteCount={newQuoteCount} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar
            user={{ name: u.name ?? u.email, email: u.email, role: u.role }}
          />
          <main className="flex-1 p-6 md:p-8">{children}</main>
        </div>
      </div>
      <ToastProvider />
    </SessionProvider>
  )
}
