import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllAreas = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Areas.findMany()
}

export const getAreaById = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Areas.findFirst({
    where: eq(schema.Areas.id, id)
  })
}

export const createArea = async (d1: D1Database, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Areas).values(data).returning()
}

export const updateArea = async (d1: D1Database, id: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.update(schema.Areas).set(data).where(eq(schema.Areas.id, id)).returning()
}

export const deleteArea = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.delete(schema.Areas).where(eq(schema.Areas.id, id)).returning()
}
