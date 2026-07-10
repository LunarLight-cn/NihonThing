import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getPurchases = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Purchases.findMany()
}

export const createPurchase = async (d1: D1Database, agentId: number, data: any) => {
  const db = drizzle(d1, { schema })
  
  // Create the purchase
  const [newPurchase] = await db.insert(schema.Purchases).values({
    ...data,
    agent_id: agentId
  }).returning()
  
  // Find the Order to update its status to 'purchasing'
  const orderItem = await db.query.Order_Items.findFirst({
    where: eq(schema.Order_Items.id, data.order_item_id)
  })
  
  if (orderItem && orderItem.order_id) {
    await db.update(schema.Orders)
      .set({ status: 'purchasing' })
      .where(eq(schema.Orders.id, orderItem.order_id))
  }
  
  return newPurchase
}

export const updatePurchase = async (d1: D1Database, id: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.update(schema.Purchases).set(data).where(eq(schema.Purchases.id, id)).returning()
}
