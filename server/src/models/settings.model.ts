import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

// Settings live in a single row (id = 1). Created on first read so a fresh
// database never needs a seed step.
const DEFAULTS = {
  id: 1,
  per_user_item_limit: 50,
  trip_cutoff_days: 5,
  weight_tolerance_kg: 5,
  unpaid_move_days: 3,
  overdue_cancel_days: 14,
  price_tolerance_thb: 500,
  exchange_rate_jpy_thb: 0.25
}

export type Settings = typeof schema.Settings.$inferSelect

export const getSettings = async (d1: D1Database): Promise<Settings> => {
  const db = drizzle(d1, { schema })
  const row = await db.query.Settings.findFirst({ where: eq(schema.Settings.id, 1) })
  if (row) return row
  const [created] = await db.insert(schema.Settings).values(DEFAULTS).returning()
  return created
}

export const updateSettings = async (
  d1: D1Database,
  data: Partial<Omit<typeof schema.Settings.$inferInsert, 'id'>>
): Promise<Settings> => {
  const db = drizzle(d1, { schema })
  await getSettings(d1) // ensure the row exists before updating
  const [updated] = await db
    .update(schema.Settings)
    .set({ ...data, udate: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.Settings.id, 1))
    .returning()
  return updated
}
