'use client'

import { type Role } from '@prisma/client'
import {
  IconKey,
  IconPencil,
  IconShield,
  IconTrash,
} from '@tabler/icons-react'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import {
  changeUserPassword,
  deleteUser,
  updateUser,
} from '@/lib/actions/users'
import { cn } from '@/lib/utils'

export type UserRow = {
  id: string
  email: string
  name: string | null
  role: Role
  isActive: boolean
  lastLoginAt: string | null
}

const ROLE_LABELS: Record<Role, { label: string; cls: string; icon?: boolean }> = {
  SUPER_ADMIN: { label: 'Super admin', cls: 'bg-purple-100 text-purple-800 ring-purple-200', icon: true },
  ADMIN:       { label: 'Admin',       cls: 'bg-brand/10 text-brand ring-brand/20' },
  EDITOR:      { label: 'Éditeur',     cls: 'bg-slate-100 text-slate-700 ring-slate-200' },
}

export function UsersTable({
  items: initial,
  currentUserId,
}: {
  items: UserRow[]
  currentUserId: string
}) {
  const [items, setItems] = useState(initial)

  function patchRow(id: string, patch: Partial<UserRow>) {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }
  function dropRow(id: string) {
    setItems((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
            <th className="px-4 py-3 text-left font-medium">Rôle</th>
            <th className="px-4 py-3 text-center font-medium">Actif</th>
            <th className="px-4 py-3 text-left font-medium">Dernière connexion</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((u) => (
            <Row key={u.id} u={u} isMe={u.id === currentUserId}
                 onPatch={patchRow} onDrop={dropRow} />
          ))}
          {items.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
              Aucun utilisateur.
            </td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function Row({
  u, isMe, onPatch, onDrop,
}: {
  u: UserRow
  isMe: boolean
  onPatch: (id: string, p: Partial<UserRow>) => void
  onDrop: (id: string) => void
}) {
  const [actPending, startAct] = useTransition()
  const [delPending, startDel] = useTransition()
  const [pwPending, startPw]   = useTransition()
  const def = ROLE_LABELS[u.role]

  function onToggle(v: boolean) {
    if (isMe && !v) { toast.error('Vous ne pouvez pas vous désactiver vous-même.'); return }
    startAct(async () => {
      const res = await updateUser({ id: u.id, isActive: v })
      if (!res.ok) toast.error(res.error)
      else { onPatch(u.id, { isActive: v }); toast.success(v ? 'Activé' : 'Désactivé') }
    })
  }

  function onResetPassword() {
    const np = prompt('Nouveau mot de passe (8 caractères minimum) :')
    if (!np) return
    if (np.length < 8) { toast.error('8 caractères minimum'); return }
    startPw(async () => {
      const res = await changeUserPassword({ id: u.id, newPassword: np })
      if (!res.ok) toast.error(res.error); else toast.success('Mot de passe changé')
    })
  }

  function onDelete() {
    if (!confirm(`Supprimer définitivement l'utilisateur « ${u.email} » ?`)) return
    startDel(async () => {
      const res = await deleteUser(u.id)
      if (!res.ok) toast.error(res.error); else { toast.success('Utilisateur supprimé'); onDrop(u.id) }
    })
  }

  return (
    <tr className="hover:bg-accent/30">
      <td className="px-4 py-3">
        <div className="font-medium">{u.name ?? <span className="text-muted-foreground">—</span>}</div>
        <div className="text-xs text-muted-foreground">{u.email}{isMe && <span className="ml-1 text-brand">(vous)</span>}</div>
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
          def.cls,
        )}>
          {def.icon && <IconShield size={11} />}
          {def.label}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <Switch checked={u.isActive} disabled={actPending || isMe} onCheckedChange={onToggle} />
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('fr-FR') : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <button type="button" onClick={onResetPassword} disabled={pwPending}
                className="inline-grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                title="Réinitialiser le mot de passe">
          <IconKey size={16} />
        </button>
        <Link href={`/admin/users/${u.id}/edit`}
              className="ml-1 inline-grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Éditer">
          <IconPencil size={16} />
        </Link>
        <button type="button" onClick={onDelete} disabled={delPending || isMe}
                className="ml-1 inline-grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                title={isMe ? 'Auto-suppression interdite' : 'Supprimer'}>
          <IconTrash size={16} />
        </button>
      </td>
    </tr>
  )
}
