import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../db/schema'
import { getSettings } from './settings.model'

export type TripFillAxis = 'items' | 'weight' | 'price'

// How full a trip is on one axis. A max of 0/null means the axis is unlimited
// and is left out of the calculation.
const axisPercent = (current: number | null, max: number | null) => {
  const m = Number(max || 0)
  if (m <= 0) return null
  return Math.min(100, Math.round((Number(current || 0) / m) * 100))
}

export const getShips = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  const settings = await getSettings(d1)
  const ships = await db.query.Ships.findMany()

  const now = new Date()
  const cutoffDays = settings.trip_cutoff_days ?? 5

  return ships.map(ship => {
    let cutoffDate = new Date(ship.ship_date)

    if (ship.close_date) {
      cutoffDate = new Date(ship.close_date)
    } else {
      cutoffDate.setDate(cutoffDate.getDate() - cutoffDays)
    }

    const isClosed = ship.status !== 'open' || now > cutoffDate

    // Report every capped axis plus the one closest to closing (highest %),
    // which is what the UI shows as the trip's fill level.
    const axes = ([
      { axis: 'items' as TripFillAxis, percent: axisPercent(ship.current_items, ship.max_items), current: Number(ship.current_items || 0), max: Number(ship.max_items || 0) },
      { axis: 'weight' as TripFillAxis, percent: axisPercent(ship.current_cap, ship.max_cap), current: Number(ship.current_cap || 0), max: Number(ship.max_cap || 0) },
      { axis: 'price' as TripFillAxis, percent: axisPercent(ship.current_price, ship.max_price), current: Number(ship.current_price || 0), max: Number(ship.max_price || 0) }
    ]).filter((a) => a.percent !== null) as { axis: TripFillAxis; percent: number; current: number; max: number }[]

    const fill = axes.length > 0
      ? axes.reduce((top, a) => (a.percent > top.percent ? a : top))
      : null

    return {
      ...ship,
      is_closed: isClosed,
      axes,
      fill
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
