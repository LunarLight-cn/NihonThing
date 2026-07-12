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

export const getTrendingProducts = async (d1: D1Database, limit: number = 4) => {
  const db = drizzle(d1, { schema })
  
  // 1. Get products tagged as 'trending'
  const taggedProducts = await db.query.Products.findMany({
    where: and(
      eq(schema.Products.status, 'active'),
      eq(schema.Products.tag, 'trending')
    ),
    limit,
    with: { category: true }
  })

  let result = [...taggedProducts]
  
  if (result.length >= limit) {
    return result.slice(0, limit)
  }
  
  // 2. Get top selling products
  const remainingLimit = limit - result.length
  const excludedIds = result.map(p => p.id)
  
  const bestSellersQuery = await db
    .select({
      product_id: schema.Order_Items.product_id,
      total_qty: sql<number>`sum(${schema.Order_Items.quantity})`
    })
    .from(schema.Order_Items)
    .where(sql`${schema.Order_Items.product_id} IS NOT NULL`)
    .groupBy(schema.Order_Items.product_id)
    .orderBy(desc(sql`sum(${schema.Order_Items.quantity})`))
    .limit(limit * 2)

  const bestSellerIds = bestSellersQuery
    .filter(row => row.product_id !== null && !excludedIds.includes(row.product_id))
    .map(row => row.product_id as number)
    
  if (bestSellerIds.length > 0) {
    const bestSellerProducts = await db.query.Products.findMany({
      where: and(
        inArray(schema.Products.id, bestSellerIds),
        eq(schema.Products.status, 'active')
      ),
      with: { category: true }
    })
    
    // Sort by bestSellerIds order to maintain top sellers first
    bestSellerProducts.sort((a, b) => bestSellerIds.indexOf(a.id) - bestSellerIds.indexOf(b.id))
    
    result = [...result, ...bestSellerProducts.slice(0, remainingLimit)]
  }
  
  // 3. Fallback: If still not enough, fill with newest active products
  if (result.length < limit) {
    const finalExcludedIds = result.map(p => p.id)
    const fallbackProducts = await db.query.Products.findMany({
      where: finalExcludedIds.length > 0 
        ? and(eq(schema.Products.status, 'active'), notInArray(schema.Products.id, finalExcludedIds))
        : eq(schema.Products.status, 'active'),
      orderBy: [desc(schema.Products.cdate)],
      limit: limit - result.length,
      with: { category: true }
    })
    result = [...result, ...fallbackProducts]
  }

  return result
}
