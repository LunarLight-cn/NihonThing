import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
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

  const updateFields: Record<string, any> = { udate: sql`CURRENT_TIMESTAMP` }
  if (data.username !== undefined) updateFields.username = data.username
  if (data.birth_date !== undefined) updateFields.birth_date = data.birth_date
  if (data.gender !== undefined) updateFields.gender = data.gender

  await db
    .update(schema.Users)
    .set(updateFields)
    .where(eq(schema.Users.id, userId))
}
