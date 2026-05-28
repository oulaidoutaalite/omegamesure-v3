import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { type Role } from '@prisma/client'

import { authOptions } from './auth'

/**
 * Get the current admin session (server components / route handlers / server actions).
 * Returns `null` if not signed in.
 */
export async function getCurrentSession() {
  return getServerSession(authOptions)
}

/**
 * Ensure the request is authenticated. Redirects to /admin/login otherwise.
 * Returns the session for further checks.
 */
export async function requireAuth() {
  const session = await getCurrentSession()
  if (!session?.user) redirect('/admin/login')
  return session
}

/**
 * Ensure the current user has one of the allowed roles.
 * Redirects to /admin (dashboard) on insufficient permission.
 */
export async function requireRole(allowed: Role | Role[]) {
  const session = await requireAuth()
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed]
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/admin?error=forbidden')
  }
  return session
}

/**
 * Permission helpers — keep all role rules in one place.
 */
export const can = {
  manageUsers:   (role: Role) => role === 'SUPER_ADMIN',
  manageConfig:  (role: Role) => role === 'SUPER_ADMIN' || role === 'ADMIN',
  manageContent: (role: Role) => role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'EDITOR',
  viewLogs:      (role: Role) => role === 'SUPER_ADMIN' || role === 'ADMIN',
}
