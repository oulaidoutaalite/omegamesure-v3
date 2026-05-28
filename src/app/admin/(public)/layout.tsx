import type { ReactNode } from 'react'

// Minimal layout for unauthenticated admin pages (login).
// No sidebar, no auth guard — just centers the content.
export default function AdminPublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 via-background to-background p-4">
      {children}
    </div>
  )
}
