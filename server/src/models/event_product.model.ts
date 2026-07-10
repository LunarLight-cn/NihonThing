import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getEventProducts = async (d1: D1Database, eventId: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Event_Products.findMany({
    where: eq(schema.Event_Products.event_id, eventId)
  })
}

export const createEventProduct = async (d1: D1Database, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Event_Products).values(data).returning()
}

export const deleteEventProduct = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.delete(schema.Event_Products).where(eq(schema.Event_Products.id, id)).returning()
}
