'use client'

import { type Role } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createUser, updateUser } from '@/lib/actions/users'

type Mode = { type: 'create' } | { type: 'edit'; id: string }

type Props = {
  mode: Mode
  defaultValues?: {
    email?: string
    name?: string
    role?: Role
    isActive?: boolean
  }
}

const ROLES: Array<{ value: Role; label: string; helper: string }> = [
  { value: 'EDITOR',      label: 'Éditeur',     helper: 'Peut gérer le contenu (produits, médias) et traiter les devis/messages.' },
  { value: 'ADMIN',       label: 'Admin',       helper: 'Tout l’éditeur + navigation, catégories, configuration du site.' },
  { value: 'SUPER_ADMIN', label: 'Super admin', helper: 'Tous les droits + gestion des utilisateurs.' },
]

export function UserForm({ mode, defaultValues }: Props) {
  const router = useRouter()
  const isCreate = mode.type === 'create'
  const [email,    setEmail]    = useState(defaultValues?.email ?? '')
  const [name,     setName]     = useState(defaultValues?.name ?? '')
  const [password, setPassword] = useState('')
  const [role,     setRole]     = useState<Role>(defaultValues?.role ?? 'EDITOR')
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (isCreate) {
        if (password.length < 8) { toast.error('Mot de passe : 8 caractères minimum'); return }
        const res = await createUser({ email, name, password, role, isActive })
        if (!res.ok) { toast.error(res.error); return }
        toast.success('Utilisateur créé')
        router.push('/admin/users')
      } else {
        const res = await updateUser({
          id: (mode as Extract<Mode, { type: 'edit' }>).id,
          email,
          name,
          role,
          isActive,
        })
        if (!res.ok) { toast.error(res.error); return }
        toast.success('Utilisateur mis à jour')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={email}
                 onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nom complet</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      {isCreate && (
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <Input id="password" type="password" minLength={8}
                 value={password} onChange={(e) => setPassword(e.target.value)} required />
          <p className="text-[11px] text-muted-foreground">8 caractères minimum. Communiquez-le à l&apos;utilisateur en sécurité.</p>
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Rôle</legend>
        <div className="grid gap-2">
          {ROLES.map((r) => (
            <label key={r.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
              <input type="radio" name="role" value={r.value}
                     checked={role === r.value} onChange={() => setRole(r.value)}
                     className="mt-1" />
              <div>
                <div className="text-sm font-medium">{r.label}</div>
                <div className="text-[11px] text-muted-foreground">{r.helper}</div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
        <span>
          <div className="text-sm font-medium">Compte actif</div>
          <div className="text-[11px] text-muted-foreground">Désactivé = l&apos;utilisateur ne peut plus se connecter.</div>
        </span>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </label>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => router.back()}>Annuler</Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : isCreate ? 'Créer le compte' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
