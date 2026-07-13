import { drizzle } from 'drizzle-orm/d1'
import { eq, inArray, sql, and } from 'drizzle-orm'
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
  
  // Validate Trip and check Cutoff Date
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

  // Validate Address Ownership
  const address = await db.query.Addresses.findFirst({ where: eq(schema.Addresses.id, addressId) })
  if (!address || address.user_id !== userId) {
    throw new Error('Invalid address or unauthorized.')
  }

  // Calculate Total Price
  let itemPriceTotal = 0
  
  for (const item of items) {
    if (item.type === 'product') {
      const product = await db.query.Products.findFirst({ where: eq(schema.Products.id, item.id) })
      if (!product) throw new Error(`Product ${item.id} not found`)
      itemPriceTotal += (product.price_tentative_thb || 0) * item.quantity
    } else if (item.type === 'ticket') {
      const ticket = await db.query.Tickets.findFirst({ where: eq(schema.Tickets.id, item.id) })
      if (!ticket) throw new Error(`Ticket ${item.id} not found`)
      if (ticket.client_id !== userId) throw new Error(`Unauthorized access to ticket ${item.id}`)
      itemPriceTotal += (ticket.proposed_price_thb || ticket.expected_price || 0) * item.quantity
    }
  }

  // Capacity & Anti-Hoarding Limits
  const PER_USER_LIMIT = 50
  const orderAmount = items.reduce((sum, item) => sum + item.quantity, 0)
  
  // Check global capacity
  const currentCap = Number(trip.current_cap || 0)
  const maxCap = Number(trip.max_cap || 1000)
  if (currentCap + orderAmount > maxCap) {
    throw new Error(`Trip capacity exceeded. Only ${maxCap - currentCap} items remaining.`)
  }

  return await db.transaction(async (tx) => {
    // Check per-user limit
    const userPastOrders = await tx.query.Orders.findMany({
      where: and(eq(schema.Orders.user_id, userId), eq(schema.Orders.trip_id, tripId))
    })
    
    let userPastAmount = 0
    if (userPastOrders.length > 0) {
      const pastOrderIds = userPastOrders.map(o => o.id)
      const pastItems = await tx.query.Order_Items.findMany({
        where: inArray(schema.Order_Items.order_id, pastOrderIds)
      })
      userPastAmount = pastItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
    }

    if (userPastAmount + orderAmount > PER_USER_LIMIT) {
      throw new Error(`Per-user limit exceeded. You can only order ${PER_USER_LIMIT} items per trip.`)
    }

    // Atomic Capacity Update & Auto-Close
    const capacityUpdate = await tx.update(schema.Ships)
      .set({
        current_cap: sql`CAST((CAST(COALESCE(current_cap, '0') AS INTEGER) + ${orderAmount}) AS TEXT)`,
        status: sql`CASE WHEN CAST(COALESCE(current_cap, '0') AS INTEGER) + ${orderAmount} >= CAST(COALESCE(max_cap, '1000') AS INTEGER) THEN 'closed' ELSE status END`
      })
      .where(
        and(
          eq(schema.Ships.id, tripId),
          sql`CAST(COALESCE(current_cap, '0') AS INTEGER) + ${orderAmount} <= CAST(COALESCE(max_cap, '1000') AS INTEGER)`
        )
      ).returning()

    if (capacityUpdate.length === 0) {
      throw new Error(`Trip capacity exceeded. Cannot fulfill ${orderAmount} items.`)
    }

    // Insert Order
    const [newOrder] = await tx.insert(schema.Orders).values({
      user_id: userId,
      trip_id: tripId,
      address_id: addressId,
      item_price_total: itemPriceTotal,
      payment_status: 'pending_deposit',
      status: 'pending'
    }).returning()

    // Insert Order Items
    const orderItemsData = items.map(item => ({
      order_id: newOrder.id,
      product_id: item.type === 'product' ? item.id : null,
      ticket_id: item.type === 'ticket' ? item.id : null,
      quantity: item.quantity
    }))

    await tx.insert(schema.Order_Items).values(orderItemsData)

    // Increment total_sold for products
    for (const item of items) {
      if (item.type === 'product') {
        await tx.update(schema.Products)
          .set({ total_sold: sql`COALESCE(total_sold, 0) + ${item.quantity}` })
          .where(eq(schema.Products.id, item.id))
      }
    }

    return newOrder
  })
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

export const getOrderById = async (d1: D1Database, id: number) => {
  const db = drizzle(d1, { schema })
  const order = await db.query.Orders.findFirst({
    where: eq(schema.Orders.id, id)
  })
  if (!order) throw new Error('Order not found')
  return order
}

export const updateOrder = async (d1: D1Database, id: number, data: Partial<typeof schema.Orders.$inferInsert>, userId?: number) => {
  const db = drizzle(d1, { schema })
  
  if (userId) {
    const order = await db.query.Orders.findFirst({ where: eq(schema.Orders.id, id) })
    if (!order || order.user_id !== userId) {
      throw new Error('Unauthorized to update this order')
    }
  }

  const updatedOrders = await db
    .update(schema.Orders)
    .set({ ...data, udate: sql`CURRENT_TIMESTAMP` })
    .where(eq(schema.Orders.id, id))
    .returning()
    
  return updatedOrders[0]
}
