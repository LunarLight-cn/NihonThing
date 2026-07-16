import { drizzle } from 'drizzle-orm/d1'
import { eq, inArray, sql, and } from 'drizzle-orm'
import * as schema from '../db/schema'
import { getSettings } from './settings.model'

export type OrderItemInput = {
  type: 'product' | 'ticket'
  id: number
  quantity: number
  options?: Record<string, string>
}

// Shopee-style human-facing order code: YYMMDD + 8 random base32 chars,
// e.g. "260516JRSYRB13". Stored in Orders.order_code (unique), shown in the UI
// instead of the raw autoincrement id.
const generateOrderCode = () => {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous 0/O/1/I
  const rnd = crypto.getRandomValues(new Uint8Array(8))
  const suffix = Array.from(rnd, (b) => charset[b % charset.length]).join('')
  return `${yy}${mm}${dd}${suffix}`
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
  const settings = await getSettings(d1)

  // Validate Trip and check Cutoff Date
  const trip = await db.query.Ships.findFirst({ where: eq(schema.Ships.id, tripId) })
  if (!trip) throw new Error('Trip not found')

  const now = new Date()
  let cutoffDate = new Date(trip.ship_date)
  if (trip.close_date) {
    cutoffDate = new Date(trip.close_date)
  } else {
    cutoffDate.setDate(cutoffDate.getDate() - (settings.trip_cutoff_days ?? defaultCutoffDays))
  }
  
  if (trip.status !== 'open' || now > cutoffDate) {
    throw new Error('This trip is closed for new orders.')
  }

  // Validate Address Ownership
  const address = await db.query.Addresses.findFirst({ where: eq(schema.Addresses.id, addressId) })
  if (!address || address.user_id !== userId) {
    throw new Error('Invalid address or unauthorized.')
  }

  // Calculate Total Price and Weight
  let itemPriceTotal = 0
  let totalWeight = 0
  
  for (const item of items) {
    if (item.type === 'product') {
      const product = await db.query.Products.findFirst({ where: eq(schema.Products.id, item.id) })
      if (!product) throw new Error(`Product ${item.id} not found`)
      itemPriceTotal += (product.price_tentative_thb || 0) * item.quantity
      totalWeight += (product.weight || 0) * item.quantity
    } else if (item.type === 'ticket') {
      const ticket = await db.query.Tickets.findFirst({ where: eq(schema.Tickets.id, item.id) })
      if (!ticket) throw new Error(`Ticket ${item.id} not found`)
      if (ticket.client_id !== userId) throw new Error(`Unauthorized access to ticket ${item.id}`)
      itemPriceTotal += (ticket.proposed_price_thb || ticket.expected_price || 0) * item.quantity
      // Assuming tickets have negligible weight, or we could add weight to tickets later if needed
    }
  }

  // Capacity & Anti-Hoarding Limits.
  //
  // A trip fills up along three axes: item count, weight and (tentative) price.
  // A max of 0/null means that axis is unlimited. The last order may overshoot
  // weight/price by the configured tolerance and is still accepted — the trip
  // then closes. Item count may never be exceeded.
  const PER_USER_LIMIT = settings.per_user_item_limit ?? 50
  const weightTol = settings.weight_tolerance_kg ?? 0
  const priceTol = settings.price_tolerance_thb ?? 0
  const orderAmount = items.reduce((sum, item) => sum + item.quantity, 0)

  const maxItems = Number(trip.max_items || 0)
  const maxWeight = Number(trip.max_cap || 0)
  const maxPrice = Number(trip.max_price || 0)
  const currentItems = Number(trip.current_items || 0)
  const currentWeight = Number(trip.current_cap || 0)
  const currentPrice = Number(trip.current_price || 0)

  if (maxItems > 0 && currentItems + orderAmount > maxItems) {
    throw new Error(`Trip is full. Only ${Math.max(maxItems - currentItems, 0)} item(s) left on this trip.`)
  }
  if (maxWeight > 0 && currentWeight + totalWeight > maxWeight + weightTol) {
    throw new Error(`Trip weight limit exceeded. Only ${Math.max(maxWeight + weightTol - currentWeight, 0).toFixed(2)} kg left on this trip.`)
  }
  if (maxPrice > 0 && currentPrice + itemPriceTotal > maxPrice + priceTol) {
    throw new Error(`Trip value limit exceeded. Only ฿${Math.max(maxPrice + priceTol - currentPrice, 0).toLocaleString()} left on this trip.`)
  }

  // NOTE: D1 does not support interactive transactions (db.transaction issues
  // BEGIN, which D1 rejects: "Failed query: begin"). We run statements
  // sequentially; the guarded capacity UPDATE below is itself atomic and
  // provides the concurrency safety that matters for the FCFS queue.

  // Check per-user limit
  const userPastOrders = await db.query.Orders.findMany({
    where: and(eq(schema.Orders.user_id, userId), eq(schema.Orders.trip_id, tripId))
  })

  let userPastAmount = 0
  if (userPastOrders.length > 0) {
    const pastOrderIds = userPastOrders.map(o => o.id)
    const pastItems = await db.query.Order_Items.findMany({
      where: inArray(schema.Order_Items.order_id, pastOrderIds)
    })
    userPastAmount = pastItems.reduce((sum, item) => sum + (item.quantity || 0), 0)
  }

  if (userPastAmount + orderAmount > PER_USER_LIMIT) {
    throw new Error(`Per-user limit exceeded. You can only order ${PER_USER_LIMIT} items per trip.`)
  }

  // Atomic Capacity Update & Auto-Close.
  // The WHERE clause is the real enforcement: two concurrent orders cannot both
  // slip past the caps, because only one UPDATE can win. Item count is strict;
  // weight/price allow the tolerance overshoot. The trip closes as soon as any
  // axis reaches its max.
  const capacityUpdate = await db.update(schema.Ships)
    .set({
      current_cap: sql`COALESCE(current_cap, 0) + ${totalWeight}`,
      current_items: sql`COALESCE(current_items, 0) + ${orderAmount}`,
      current_price: sql`COALESCE(current_price, 0) + ${itemPriceTotal}`,
      status: sql`CASE WHEN
        (COALESCE(max_items, 0) > 0 AND COALESCE(current_items, 0) + ${orderAmount} >= max_items)
        OR (COALESCE(max_cap, 0) > 0 AND COALESCE(current_cap, 0) + ${totalWeight} >= max_cap)
        OR (COALESCE(max_price, 0) > 0 AND COALESCE(current_price, 0) + ${itemPriceTotal} >= max_price)
        THEN 'closed' ELSE status END`
    })
    .where(
      and(
        eq(schema.Ships.id, tripId),
        sql`(COALESCE(max_items, 0) = 0 OR COALESCE(current_items, 0) + ${orderAmount} <= max_items)`,
        sql`(COALESCE(max_cap, 0) = 0 OR COALESCE(current_cap, 0) + ${totalWeight} <= max_cap + ${weightTol})`,
        sql`(COALESCE(max_price, 0) = 0 OR COALESCE(current_price, 0) + ${itemPriceTotal} <= max_price + ${priceTol})`
      )
    ).returning()

  if (capacityUpdate.length === 0) {
    throw new Error(`Trip is full. Cannot fit ${orderAmount} item(s) — someone may have just taken the last slot.`)
  }

  // Insert Order
  const [newOrder] = await db.insert(schema.Orders).values({
    order_code: generateOrderCode(),
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
    quantity: item.quantity,
    selected_options: item.options ?? null
  }))

  await db.insert(schema.Order_Items).values(orderItemsData)

  // Increment total_sold and decrement remain for products
  for (const item of items) {
    if (item.type === 'product') {
      await db.update(schema.Products)
        .set({
          total_sold: sql`COALESCE(total_sold, 0) + ${item.quantity}`,
          remain: sql`COALESCE(remain, 0) - ${item.quantity}`
        })
        .where(eq(schema.Products.id, item.id))
    }
  }

  return newOrder
}

// Relations loaded for any order detail view (customer or admin).
const orderDetailWith = {
  ship: { with: { destination: { columns: { name_en: true, name_th: true, name_jp: true } } } },
  payments: true,
  address: true,
  items: {
    with: {
      product: { columns: { id: true, name_en: true, name_th: true, name_jp: true, img: true } },
      ticket: { columns: { id: true, item_name: true, img: true } }
    }
  }
} as const

export const getMyOrders = async (d1: D1Database, userId: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Orders.findMany({
    where: eq(schema.Orders.user_id, userId),
    orderBy: (orders, { desc }) => [desc(orders.cdate)],
    with: orderDetailWith
  })
}

export const getAllOrders = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  return await db.query.Orders.findMany({
    orderBy: (orders, { desc }) => [desc(orders.cdate)],
    with: {
      ...orderDetailWith,
      // Admin also needs to know who placed it.
      user: { columns: { id: true, username: true, email: true } }
    }
  })
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
