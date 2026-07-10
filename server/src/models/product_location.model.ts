import { drizzle } from 'drizzle-orm/d1'
import { eq, and } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getProductLocations = async (d1: D1Database, productId: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Product_Locations.findMany({
    where: eq(schema.Product_Locations.product_id, productId)
  })
}

export const createProductLocation = async (d1: D1Database, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Product_Locations).values(data).returning()
}

export const deleteProductLocation = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.delete(schema.Product_Locations).where(eq(schema.Product_Locations.id, id)).returning()
}
