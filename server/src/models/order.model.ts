import { drizzle } from 'drizzle-orm/d1'
import { eq, inArray } from 'drizzle-orm'
import * as schema from '../db/schema'

export type OrderItemInput = {
  type: 'product' | 'ticket'
  id: number
  quantity: number
}

export const createOrder = async (
  d1: D1Database,
  userId: number,
  tripId: number,
  addressId: number,
  items: OrderItemInput[],
  defaultCutoffDays: number
) => {
  const db = drizzle(d1, { schema })
  
  // 1. Validate Trip and check Cutoff Date
  const trip = await db.query.Ships.findFirst({ where: eq(schema.Ships.id, tripId) })
  if (!trip) throw new Error('Trip not found')
  
  const now = new Date()
  let cutoffDate = new Date(trip.ship_date)
  if (trip.close_date) {
    cutoffDate = new Date(trip.close_date)
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - defaultCutoffDays)
  }
  
  if (trip.status !== 'open' || now > cutoffDate) {
    throw new Error('This trip is closed for new orders.')
  }

  // 2. Calculate Total Price
  let itemPriceTotal = 0
  
  for (const item of items) {
    if (item.type === 'product') {
      const product = await db.query.Products.findFirst({ where: eq(schema.Products.id, item.id) })
      if (!product) throw new Error(`Product ${item.id} not found`)
      itemPriceTotal += (product.price_tentative_thb || 0) * item.quantity
    } else if (item.type === 'ticket') {
      const ticket = await db.query.Tickets.findFirst({ where: eq(schema.Tickets.id, item.id) })
      if (!ticket) throw new Error(`Ticket ${item.id} not found`)
      itemPriceTotal += (ticket.proposed_price_thb || ticket.expected_price || 0) * item.quantity
    }
  }

  // 3. Insert Order
  const [newOrder] = await db.insert(schema.Orders).values({
    user_id: userId,
    trip_id: tripId,
    address_id: addressId,
    item_price_total: itemPriceTotal,
    payment_status: 'pending_deposit',
    status: 'pending'
  }).returning()

  // 4. Insert Order Items
  const orderItemsData = items.map(item => ({
    order_id: newOrder.id,
    product_id: item.type === 'product' ? item.id : null,
    ticket_id: item.type === 'ticket' ? item.id : null,
    quantity: item.quantity
  }))

  await db.insert(schema.Order_Items).values(orderItemsData)

  return newOrder
}

export const getMyOrders = async (d1: D1Database, userId: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Orders.findMany({
    where: eq(schema.Orders.user_id, userId)
  })
}

export const getAllOrders = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Orders.findMany()
}

export const updateOrder = async (d1: D1Database, id: number, data: any) => {
  const db = drizzle(d1, { schema })
  return await db
    .update(schema.Orders)
    .set(data)
    .where(eq(schema.Orders.id, id))
    .returning()
}
