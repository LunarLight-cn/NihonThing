import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { sign } from 'hono/jwt'
import * as schema from '../db/schema'
import { hashPassword } from '../utils/hash'

export const registerUser = async (d1: D1Database, username: string, email: string, pass: string, salt: string) => {
  const db = drizzle(d1, { schema })
  
  // Check for duplicate email before inserting
  const existingUser = await db.query.Users.findFirst({
    where: eq(schema.Users.email, email)
  })

  if (existingUser) {
    throw new Error('This email is already registered.')
  }

  const hashedPassword = await hashPassword(pass, salt)

  await db.insert(schema.Users).values({
    username: username,
    email: email,
    password_hash: hashedPassword,
    role: 'client'
  })
}

export const loginUser = async (d1: D1Database, email: string, pass: string, jwtSecret: string, salt: string) => {
  const db = drizzle(d1, { schema })
  const hashedPassword = await hashPassword(pass, salt)

  const user = await db.query.Users.findFirst({
    where: eq(schema.Users.email, email)
  })

  if (!user || user.password_hash !== hashedPassword) {
    throw new Error('Invalid email or password')
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
