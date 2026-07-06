import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllUsers = async (d1: D1Database, roleFIlter?: string) => {
  const db = drizzle(d1, { schema })

  if (roleFIlter) {
    return await db.query.Users.findMany({
      where: eq(schema.Users.role, roleFIlter)
    })
  }

  return await db.query.Users.findMany()
}

type UpdateData = {
  username?: string
  birth_date?: string
  gender?: string
}

export const updateUserProfile = async (d1: D1Database, userId: number, data: UpdateData) => {
  const db = drizzle(d1, { schema })

  await db
    .update(schema.Users)
    .set({
      username: data.username,
      birth_date: data.birth_date,
      gender: data.gender,
      udate: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(schema.Users.id, userId))
}
