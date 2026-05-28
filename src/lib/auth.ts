import { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { db } from './db'

const credentialsSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8).max(128),
})

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8 /* 8h */ },
  pages: {
    signIn: '/admin/login',
    error:  '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email',    placeholder: 'admin@omegamesure.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data
        const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
        if (!user || !user.isActive) return null

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return null

        // Best-effort lastLoginAt update (don't block login if it fails)
        db.user
          .update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
          .catch(() => undefined)

        return {
          id:    user.id,
          email: user.email,
          name:  user.name ?? user.email,
          role:  user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
