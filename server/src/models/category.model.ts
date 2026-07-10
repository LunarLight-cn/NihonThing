import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllCategories = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Categories.findMany()
}

export const createCategory = async (d1: D1Database, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Categories).values(data).returning()
}

export const updateCategory = async (d1: D1Database, id: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.update(schema.Categories).set(data).where(eq(schema.Categories.id, id)).returning()
}

export const deleteCategory = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.delete(schema.Categories).where(eq(schema.Categories.id, id)).returning()
}
