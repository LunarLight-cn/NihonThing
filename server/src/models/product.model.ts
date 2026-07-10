import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllProducts = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Products.findMany({
    with: { category: true }
  })
}

export const getProductById = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Products.findFirst({
    where: eq(schema.Products.id, id),
    with: { category: true }
  })
}

export const createProduct = async (d1: D1Database, data: typeof schema.Products.$inferInsert) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Products).values(data).returning()
}

export const updateProduct = async (d1: D1Database, id: number, data: Partial<typeof schema.Products.$inferInsert>) => {
  const db = drizzle(d1, { schema })
  return await db
    .update(schema.Products)
    .set({ ...data, udate: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.Products.id, id))
    .returning()
}

export const deleteProduct = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  await db.delete(schema.Products).where(eq(schema.Products.id, id))
}
