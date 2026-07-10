import { drizzle } from 'drizzle-orm/d1'
import { eq, and } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getMyFollows = async (d1: D1Database, userId: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Follows.findMany({
    where: eq(schema.Follows.user_id, userId)
  })
}

export const createFollow = async (d1: D1Database, userId: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Follows).values({
    ...data,
    user_id: userId
  }).returning()
}

export const deleteFollow = async (d1: D1Database, userId: number, followId: number) => {
  const db = drizzle(d1, { schema })
  return await db.delete(schema.Follows)
    .where(and(eq(schema.Follows.id, followId), eq(schema.Follows.user_id, userId)))
    .returning()
}
