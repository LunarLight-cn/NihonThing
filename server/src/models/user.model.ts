import { drizzle } from 'drizzle-orm/d1'
import { eq, and, ne, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllUsers = async (d1: D1Database, roleFilter?: string) => {
  const db = drizzle(d1, { schema })

  if (roleFilter) {
    return await db.query.Users.findMany({
      where: eq(schema.Users.role, roleFilter),
      columns: { password_hash: false }
    })
  }

  return await db.query.Users.findMany({
    columns: { password_hash: false }
  })
}

export const getUserById = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Users.findFirst({
    where: eq(schema.Users.id, id),
    columns: { password_hash: false }
  })
}

type UpdateData = {
  username?: string
  birth_date?: string
  gender?: string
}

export const updateUserProfile = async (d1: D1Database, userId: number, data: UpdateData) => {
  const db = drizzle(d1, { schema })

  // Usernames double as a login identifier, so taking someone else's blocks
  // their login.
  if (data.username !== undefined) {
    const taken = await db.query.Users.findFirst({
      where: and(eq(schema.Users.username, data.username), ne(schema.Users.id, userId)),
      columns: { id: true }
    })
    if (taken) throw new Error('That username is already taken.')
  }

  const updateFields: Record<string, any> = { udate: sql`CURRENT_TIMESTAMP` }
  if (data.username !== undefined) updateFields.username = data.username
  if (data.birth_date !== undefined) updateFields.birth_date = data.birth_date
  if (data.gender !== undefined) updateFields.gender = data.gender

  await db
    .update(schema.Users)
    .set(updateFields)
    .where(eq(schema.Users.id, userId))
}

export const updateUserPassword = async (d1: D1Database, userId: number, passwordHash: string) => {
  const db = drizzle(d1, { schema })
  await db
    .update(schema.Users)
    .set({ password_hash: passwordHash, udate: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.Users.id, userId))
}

export const getUserPasswordHash = async (d1: D1Database, userId: number) => {
  const db = drizzle(d1, { schema })
  const user = await db.query.Users.findFirst({
    where: eq(schema.Users.id, userId),
    columns: { password_hash: true }
  })
  return user?.password_hash
}

export const updateUserRole = async (d1: D1Database, userId: number, role: string) => {
  const db = drizzle(d1, { schema })
  await db
    .update(schema.Users)
    .set({ role, udate: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.Users.id, userId))
}

export const deleteUser = async (d1: D1Database, userId: number) => {
  const db = drizzle(d1, { schema })
  await db.delete(schema.Users).where(eq(schema.Users.id, userId))
}

export const updateUserStatus = async (d1: D1Database, userId: number, status: "active" | "inactive") => {
  const db = drizzle(d1, { schema })
  await db
    .update(schema.Users)
    .set({ status, udate: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.Users.id, userId))
}
