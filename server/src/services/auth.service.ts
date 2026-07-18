import { drizzle } from 'drizzle-orm/d1'
import { eq, or, and, gt, lt, sql } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import * as schema from '../db/schema'
import { generateSaltAndHash, verifyPassword } from '../utils/hash'

const MAX_FAILED_LOGINS = 5
const LOGIN_WINDOW_MINUTES = 15

// Thrown instead of the generic Error so the route can answer 429, not 401.
export class TooManyAttemptsError extends Error {
  constructor() {
    super(`Too many failed login attempts. Try again in ${LOGIN_WINDOW_MINUTES} minutes.`)
    this.name = 'TooManyAttemptsError'
  }
}

export const registerUser = async (d1: D1Database, username: string, email: string, pass: string, salt: string) => {
  const db = drizzle(d1, { schema })
  
  // Check for duplicate email before inserting
  const existingUser = await db.query.Users.findFirst({
    where: eq(schema.Users.email, email)
  })

  if (existingUser) {
    throw new Error('This email is already registered.')
  }

  const hashedPassword = await generateSaltAndHash(pass)

  await db.insert(schema.Users).values({
    username: username,
    email: email,
    password_hash: hashedPassword,
    role: 'client'
  })
}

// Wrong password / unknown user gets logged; the 6th try inside the window is
// refused before the password is even checked. No cron here, so stale rows are
// pruned on each logged failure instead.
const logFailedAttempt = async (db: ReturnType<typeof drizzle<typeof schema>>, identifier: string) => {
  await db.insert(schema.Login_Attempts).values({ email: identifier })
  await db.delete(schema.Login_Attempts)
    .where(lt(schema.Login_Attempts.cdate, sql`datetime('now', '-${sql.raw(String(LOGIN_WINDOW_MINUTES))} minutes')`))
}

export const loginUser = async (d1: D1Database, identifier: string, pass: string, jwtSecret: string, salt: string) => {
  const db = drizzle(d1, { schema })

  const [{ count: recentFailures }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.Login_Attempts)
    .where(and(
      eq(schema.Login_Attempts.email, identifier),
      gt(schema.Login_Attempts.cdate, sql`datetime('now', '-${sql.raw(String(LOGIN_WINDOW_MINUTES))} minutes')`)
    ))
  if (recentFailures >= MAX_FAILED_LOGINS) {
    throw new TooManyAttemptsError()
  }

  const user = await db.query.Users.findFirst({
    where: or(eq(schema.Users.email, identifier), eq(schema.Users.username, identifier))
  })

  if (!user) {
    await logFailedAttempt(db, identifier)
    throw new Error('Invalid email or password')
  }

  const isValidPassword = await verifyPassword(pass, user.password_hash, salt)
  if (!isValidPassword) {
    await logFailedAttempt(db, identifier)
    throw new Error('Invalid email or password')
  }

  await db.delete(schema.Login_Attempts).where(eq(schema.Login_Attempts.email, identifier))

  if (user.status === 'inactive') {
    throw new Error('Your account is currently inactive.')
  }
  
  // Transparent hash upgrade
  if (!user.password_hash.includes(':')) {
    const newHash = await generateSaltAndHash(pass)
    await db.update(schema.Users).set({ password_hash: newHash }).where(eq(schema.Users.id, user.id))
  }

  const token = await sign(
    {
      id: user.id,
      role: user.role,
      exp: Math.floor(Date.now() / 1000 + 60 * 60 * 24)
    },
    jwtSecret
  )

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    }
  }
}
