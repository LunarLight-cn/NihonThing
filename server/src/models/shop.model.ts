import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllShops = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Shops.findMany()
}

export const getShopById = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Shops.findFirst({
    where: eq(schema.Shops.id, id)
  })
}

export const createShop = async (d1: D1Database, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Shops).values(data).returning()
}

export const updateShop = async (d1: D1Database, id: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.update(schema.Shops).set(data).where(eq(schema.Shops.id, id)).returning()
}

export const deleteShop = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.delete(schema.Shops).where(eq(schema.Shops.id, id)).returning()
}
