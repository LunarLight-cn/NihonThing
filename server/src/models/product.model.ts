import { drizzle } from 'drizzle-orm/d1'
import { eq, sql, and, like } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllProducts = async (
  d1: D1Database, 
  query?: { category_id?: number, brand?: string, page?: number, limit?: number }
) => {
  const db = drizzle(d1, { schema })
  const page = query?.page || 1
  const limit = query?.limit || 20
  const offset = (page - 1) * limit

  const conditions = []
  if (query?.category_id) conditions.push(eq(schema.Products.category_id, query.category_id))
  if (query?.brand) conditions.push(like(schema.Products.brand, `%${query.brand}%`))

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.Products)
    .where(whereClause)
    
  const total = countResult.count

  const products = await db.query.Products.findMany({
    where: whereClause,
    limit,
    offset,
    with: { category: true }
  })

  return { data: products, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
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
