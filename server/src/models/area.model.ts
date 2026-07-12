import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllAreas = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  const areas = await db.query.Areas.findMany()
  
  const shopCounts = await db.select({
    area_id: schema.Shops.area_id,
    count: sql<number>`count(*)`
  }).from(schema.Shops).groupBy(schema.Shops.area_id)

  const productCounts = await db.select({
    area_id: schema.Product_Locations.area_id,
    count: sql<number>`count(distinct ${schema.Product_Locations.product_id})`
  }).from(schema.Product_Locations).groupBy(schema.Product_Locations.area_id)

  return areas.map(area => ({
    ...area,
    shopCount: shopCounts.find(s => s.area_id === area.id)?.count || 0,
    productCount: productCounts.find(p => p.area_id === area.id)?.count || 0
  }))
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
