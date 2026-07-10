import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getAllEvents = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Events.findMany()
}

export const getEventById = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Events.findFirst({
    where: eq(schema.Events.id, id)
  })
}

export const createEvent = async (d1: D1Database, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Events).values(data).returning()
}

export const updateEvent = async (d1: D1Database, id: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.update(schema.Events).set(data).where(eq(schema.Events.id, id)).returning()
}

export const deleteEvent = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  return await db.delete(schema.Events).where(eq(schema.Events.id, id)).returning()
}
