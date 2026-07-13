import { drizzle } from 'drizzle-orm/d1'
import { eq, or } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import * as schema from '../db/schema'
import { generateSaltAndHash, verifyPassword } from '../utils/hash'

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

export const loginUser = async (d1: D1Database, identifier: string, pass: string, jwtSecret: string, salt: string) => {
  const db = drizzle(d1, { schema })

  const user = await db.query.Users.findFirst({
    where: or(eq(schema.Users.email, identifier), eq(schema.Users.username, identifier))
  })

  if (!user) {
    throw new Error('Invalid email or password')
  }

  const isValidPassword = await verifyPassword(pass, user.password_hash, salt)
  if (!isValidPassword) {
    throw new Error('Invalid email or password')
  }
  
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
