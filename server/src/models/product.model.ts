import { drizzle } from 'drizzle-orm/d1'
import { eq, sql, and, like, desc, inArray, notInArray } from 'drizzle-orm'
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

export const getNewArrivals = async (d1: D1Database, limit: number = 6) => {
  const db = drizzle(d1, { schema })
  return await db.query.Products.findMany({
    where: eq(schema.Products.status, 'active'),
    orderBy: [desc(schema.Products.cdate)],
    limit,
    with: { category: true }
  })
}

export const getTrendingProducts = async (d1: D1Database, limit: number = 4, areaId?: number) => {
  const db = drizzle(d1, { schema })
  
  let validProductIds: number[] | null = null
  if (areaId) {
    const locations = await db.select({ product_id: schema.Product_Locations.product_id })
      .from(schema.Product_Locations)
      .where(eq(schema.Product_Locations.area_id, areaId))
    validProductIds = locations.map(l => l.product_id)
    if (validProductIds.length === 0) return []
  }

  // 1. Get products tagged as 'trending'
  const taggedConditions = [
    eq(schema.Products.status, 'active'),
    eq(schema.Products.tag, 'trending')
  ]
  if (validProductIds) {
    taggedConditions.push(inArray(schema.Products.id, validProductIds))
  }

  const taggedProducts = await db.query.Products.findMany({
    where: and(...taggedConditions),
    limit,
    with: { category: true }
  })

  let result = [...taggedProducts]
  
  if (result.length >= limit) {
    return result.slice(0, limit)
  }
  
  // 2. Get top selling products (using total_sold column)
  const remainingLimit = limit - result.length
  const excludedIds = result.map(p => p.id)
  
  const bestSellersConditions = [eq(schema.Products.status, 'active')]
  if (excludedIds.length > 0) {
    bestSellersConditions.push(notInArray(schema.Products.id, excludedIds))
  }
  if (validProductIds) {
    bestSellersConditions.push(inArray(schema.Products.id, validProductIds))
  }

  const bestSellerProducts = await db.query.Products.findMany({
    where: and(...bestSellersConditions),
    orderBy: [desc(schema.Products.total_sold), desc(schema.Products.cdate)],
    limit: remainingLimit,
    with: { category: true }
  })
  
  result = [...result, ...bestSellerProducts]
  


  return result
}
