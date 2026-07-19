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

const MAX_REGISTRATIONS_PER_IP = 5
const REGISTER_WINDOW_MINUTES = 60

export const registerUser = async (d1: D1Database, username: string, email: string, pass: string, salt: string, ip?: string) => {
  const db = drizzle(d1, { schema })
  const normalizedEmail = email.trim().toLowerCase()

  // Login accepts either email or username for the same field, so a username
  // that looks like an email could shadow someone else's login.
  if (username.includes('@')) {
    throw new Error('Username cannot contain "@".')
  }

  // Same lazy-pruned table as login failures, namespaced per IP - account
  // creation is the resource being protected, so every attempt counts.
  if (ip) {
    const key = `register:${ip}`
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.Login_Attempts)
      .where(and(
        eq(schema.Login_Attempts.email, key),
        gt(schema.Login_Attempts.cdate, sql`datetime('now', '-${sql.raw(String(REGISTER_WINDOW_MINUTES))} minutes')`)
      ))
    if (count >= MAX_REGISTRATIONS_PER_IP) {
      throw new TooManyAttemptsError()
    }
    await db.insert(schema.Login_Attempts).values({ email: key })
    await db.delete(schema.Login_Attempts)
      .where(lt(schema.Login_Attempts.cdate, sql`datetime('now', '-${sql.raw(String(PRUNE_MINUTES))} minutes')`))
  }

  // Duplicate email or username both collide at login - reject either.
  const existingUser = await db.query.Users.findFirst({
    where: or(
      eq(schema.Users.email, normalizedEmail),
      eq(schema.Users.email, email),
      eq(schema.Users.username, username)
    )
  })

  if (existingUser) {
    throw new Error('This email or username is already registered.')
  }

  const hashedPassword = await generateSaltAndHash(pass)

  await db.insert(schema.Users).values({
    username: username,
    email: normalizedEmail,
    password_hash: hashedPassword,
    role: 'client'
  })
}

// Rows are shared between login failures (15 min window) and registrations
// (60 min window), so pruning always uses the longer one - a shorter cutoff
// would silently erase the other namespace's live rows.
const PRUNE_MINUTES = 60

// Wrong password / unknown user gets logged; the 6th try inside the window is
// refused before the password is even checked. No cron here, so stale rows are
// pruned on each logged failure instead.
const logFailedAttempt = async (db: ReturnType<typeof drizzle<typeof schema>>, identifier: string) => {
  await db.insert(schema.Login_Attempts).values({ email: identifier })
  await db.delete(schema.Login_Attempts)
    .where(lt(schema.Login_Attempts.cdate, sql`datetime('now', '-${sql.raw(String(PRUNE_MINUTES))} minutes')`))
}

const countRecentFailures = async (db: ReturnType<typeof drizzle<typeof schema>>, key: string) => {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.Login_Attempts)
    .where(and(
      eq(schema.Login_Attempts.email, key),
      gt(schema.Login_Attempts.cdate, sql`datetime('now', '-${sql.raw(String(LOGIN_WINDOW_MINUTES))} minutes')`)
    ))
  return count
}

export const loginUser = async (d1: D1Database, identifier: string, pass: string, jwtSecret: string, salt: string) => {
  const db = drizzle(d1, { schema })
  const rawKey = identifier.trim().toLowerCase()

  if (await countRecentFailures(db, rawKey) >= MAX_FAILED_LOGINS) {
    throw new TooManyAttemptsError()
  }

  // Email matches win outright (exact, then lowercased); the username lookup
  // only runs when no account owns that email - so a username can never
  // shadow someone else's email login.
  const user =
    await db.query.Users.findFirst({ where: eq(schema.Users.email, identifier) }) ??
    await db.query.Users.findFirst({ where: eq(schema.Users.email, rawKey) }) ??
    (identifier.includes('@') ? undefined : await db.query.Users.findFirst({ where: eq(schema.Users.username, identifier) }))

  if (!user) {
    await logFailedAttempt(db, rawKey)
    throw new Error('Invalid email or password')
  }

  // One bucket per account: whether the caller typed the email or the
  // username, failures land on (and are counted against) the account email.
  const accountKey = user.email.toLowerCase()
  if (accountKey !== rawKey && await countRecentFailures(db, accountKey) >= MAX_FAILED_LOGINS) {
    throw new TooManyAttemptsError()
  }

  const isValidPassword = await verifyPassword(pass, user.password_hash, salt)
  if (!isValidPassword) {
    await logFailedAttempt(db, accountKey)
    throw new Error('Invalid email or password')
  }

  await db.delete(schema.Login_Attempts).where(eq(schema.Login_Attempts.email, accountKey))

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
