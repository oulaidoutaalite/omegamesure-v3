'use client'

import { IconLogout, IconUser } from '@tabler/icons-react'
import { signOut } from 'next-auth/react'

import { Button } from '@/components/ui/button'

type Props = {
  user: { name: string; email: string; role: string }
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super admin',
  ADMIN:       'Administrateur',
  EDITOR:      'Éditeur',
}

export function AdminTopbar({ user }: Props) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur">
      <div className="text-sm text-muted-foreground">
        {/* Breadcrumbs viendront ici */}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right md:block">
          <div className="text-sm font-medium leading-tight">{user.name}</div>
          <div className="text-[11px] text-muted-foreground">
            {roleLabels[user.role] ?? user.role} · {user.email}
          </div>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-brand">
          <IconUser size={18} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          title="Se déconnecter"
        >
          <IconLogout size={16} />
          <span className="hidden md:inline">Déconnexion</span>
        </Button>
      </div>
    </header>
  )
}
