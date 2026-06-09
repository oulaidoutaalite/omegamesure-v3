import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

// Strong, unambiguous password (no 0/O/1/l/I), ~16 chars with required classes.
function genPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const digit = '23456789'
  const sym = '@#%&*?+='
  const all = upper + lower + digit + sym
  const pick = (set) => set[crypto.randomInt(set.length)]
  let pw = [pick(upper), pick(lower), pick(digit), pick(sym)]
  while (pw.length < 16) pw.push(pick(all))
  // shuffle
  for (let i = pw.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[pw[i], pw[j]] = [pw[j], pw[i]]
  }
  return pw.join('')
}

const email = (process.env.SEED_ADMIN_EMAIL ?? 'oulaid.outaalite@gmail.com').toLowerCase()
const newPassword = genPassword()
const hash = await bcrypt.hash(newPassword, 12)

const db = new PrismaClient()
try {
  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    console.log('NO_USER:' + email)
    process.exit(2)
  }
  await db.user.update({ where: { email }, data: { password: hash } })
  // verify
  const updated = await db.user.findUnique({ where: { email } })
  const ok = await bcrypt.compare(newPassword, updated.password)
  console.log('UPDATED_EMAIL:' + email)
  console.log('NEW_PASSWORD:' + newPassword)
  console.log('VERIFY:' + (ok ? 'ok' : 'FAILED'))
  console.log('ROLE:' + user.role + ' ACTIVE:' + user.isActive)
} finally {
  await db.$disconnect()
}
