import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getShips = async (d1: D1Database, defaultCutoffDays: number) => {
  const db = drizzle(d1, { schema })
  const ships = await db.query.Ships.findMany()
  
  const now = new Date()
  
  return ships.map(ship => {
    let cutoffDate = new Date(ship.ship_date)
    
    if (ship.close_date) {
      cutoffDate = new Date(ship.close_date)
    } else {
      cutoffDate.setDate(cutoffDate.getDate() - defaultCutoffDays)
    }
    
    const isClosed = ship.status !== 'open' || now > cutoffDate
    
    return {
      ...ship,
      is_closed: isClosed
    }
  })
}

export const createShip = async (d1: D1Database, data: typeof schema.Ships.$inferInsert) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Ships).values(data).returning()
}

export const updateShip = async (d1: D1Database, id: number, data: Partial<typeof schema.Ships.$inferInsert>) => {
  const db = drizzle(d1, { schema })
  return await db.update(schema.Ships).set({ ...data, udate: sql`CURRENT_TIMESTAMP` }).where(eq(schema.Ships.id, id)).returning()
}
