import { drizzle } from 'drizzle-orm/d1'
import { eq, and, isNull, inArray, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

export const getPurchases = async (d1: D1Database, agentId?: number) => {
  const db = drizzle(d1, { schema })
  return await db.query.Purchases.findMany({
    where: agentId ? eq(schema.Purchases.agent_id, agentId) : undefined,
    orderBy: (purchases, { desc }) => [desc(purchases.cdate)],
    with: {
      orderItem: {
        with: { product: { columns: { id: true, name_en: true, name_th: true, name_jp: true, img: true } } }
      },
      order: { columns: { id: true, order_code: true } },
      agent: { columns: { id: true, username: true } }
    }
  })
}

export const createPurchase = async (d1: D1Database, agentId: number, data: any, isAdmin = false) => {
  const db = drizzle(d1, { schema })

  // order_item_id is what makes a purchase reportable: it ties the money spent
  // to the line it was spent on. Derive order_id from it so an order's spend
  // can be summed without walking every line.
  let orderId = data.order_id ?? null
  if (data.order_item_id) {
    const orderItem = await db.query.Order_Items.findFirst({
      where: eq(schema.Order_Items.id, data.order_item_id),
      with: { purchases: true }
    })
    if (!orderItem) {
      throw new Error('Order item not found.')
    }
    orderId = orderId ?? orderItem.order_id

    // The claim guard only protects the claim UPDATE itself; the purchase API
    // must enforce it too or a direct call walks straight past it.
    if (orderItem.claimed_by && orderItem.claimed_by !== agentId && !isAdmin) {
      throw new Error('This line is claimed by another agent.')
    }

    const boughtQty = orderItem.purchases.reduce((sum, p) => sum + (p.quantity || 0), 0)
    const remaining = (orderItem.quantity || 0) - boughtQty
    if (data.quantity > remaining) {
      throw new Error(`Quantity exceeds what is left to buy (${remaining} remaining).`)
    }

    // Same rule as claiming: no deposit, no shopping. Checked here too because
    // the API can be called without ever claiming.
    await assertDepositPaid(db, [data.order_item_id])
  }

  const [newPurchase] = await db.insert(schema.Purchases).values({
    ...data,
    order_id: orderId,
    agent_id: agentId
  }).returning()

  if (orderId) {
    await db.update(schema.Orders)
      .set({ status: 'purchasing' })
      .where(and(eq(schema.Orders.id, orderId), eq(schema.Orders.status, 'pending')))
  }

  return newPurchase
}

export const updatePurchase = async (d1: D1Database, id: number, data: any, agentId: number, isAdmin = false) => {
  const db = drizzle(d1, { schema })

  const existing = await db.query.Purchases.findFirst({ where: eq(schema.Purchases.id, id) })
  if (!existing) throw new Error('Purchase not found.')
  if (!isAdmin && existing.agent_id !== agentId) {
    throw new Error('This purchase belongs to another agent.')
  }

  // A purchase stays pinned to the line it was recorded against - re-pointing
  // it would silently move money between orders.
  const { order_id, order_item_id, product_id, agent_id, ...patch } = data

  if (patch.quantity !== undefined && existing.order_item_id) {
    const item = await db.query.Order_Items.findFirst({
      where: eq(schema.Order_Items.id, existing.order_item_id),
      with: { purchases: true }
    })
    if (item) {
      const boughtByOthers = item.purchases
        .filter((p) => p.id !== id)
        .reduce((sum, p) => sum + (p.quantity || 0), 0)
      const remaining = (item.quantity || 0) - boughtByOthers
      if (patch.quantity > remaining) {
        throw new Error(`Quantity exceeds what is left to buy (${remaining} remaining).`)
      }
    }
  }

  return await db.update(schema.Purchases).set(patch).where(eq(schema.Purchases.id, id)).returning()
}

// Before the deposit an order is a wish, not a commitment; nobody should be
// spending the central account's money on it.
const assertDepositPaid = async (db: ReturnType<typeof drizzle<typeof schema>>, itemIds: number[]) => {
  const items = await db.query.Order_Items.findMany({
    where: inArray(schema.Order_Items.id, itemIds),
    with: { order: { columns: { payment_status: true } } }
  })
  const unpaid = items.some((item) => item.order && !['deposit_paid', 'pending_remaining', 'fully_paid'].includes(item.order.payment_status ?? ''))
  if (unpaid) {
    throw new Error('The customer has not paid the deposit on this order yet.')
  }
}

// A line is claimed by one agent at a time. The guard in the WHERE clause is
// what makes it a claim: a second agent's UPDATE matches nothing and returns
// empty rather than stealing the line.
export const claimOrderItems = async (d1: D1Database, agentId: number, itemIds: number[]) => {
  const db = drizzle(d1, { schema })
  await assertDepositPaid(db, itemIds)
  return await db.update(schema.Order_Items)
    .set({ claimed_by: agentId, claimed_at: sql`CURRENT_TIMESTAMP` })
    .where(and(inArray(schema.Order_Items.id, itemIds), isNull(schema.Order_Items.claimed_by)))
    .returning()
}

export const releaseOrderItems = async (d1: D1Database, agentId: number, itemIds: number[], isAdmin = false) => {
  const db = drizzle(d1, { schema })
  return await db.update(schema.Order_Items)
    .set({ claimed_by: null, claimed_at: null })
    .where(and(
      inArray(schema.Order_Items.id, itemIds),
      // An agent may only drop their own claim; an admin can free any of them.
      isAdmin ? sql`1 = 1` : eq(schema.Order_Items.claimed_by, agentId)
    ))
    .returning()
}

export type ShoppingQueueOrder = Awaited<ReturnType<typeof getShoppingQueue>>[number]

// The agent dashboard: every order still being shopped for, with each line's
// progress and the money on both sides of it.
export const getShoppingQueue = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })

  const orders = await db.query.Orders.findMany({
    where: inArray(schema.Orders.status, ['pending', 'purchasing']),
    orderBy: (o, { asc }) => [asc(o.cdate)],
    with: {
      user: { columns: { id: true, username: true, email: true } },
      ship: { columns: { id: true, type: true, ship_date: true, close_date: true } },
      address: true,
      payments: true,
      purchases: true,
      items: {
        with: {
          product: { columns: { id: true, name_en: true, name_th: true, name_jp: true, img: true, weight: true } },
          ticket: { columns: { id: true, item_name: true, img: true } },
          claimedBy: { columns: { id: true, username: true } },
          purchases: true
        }
      }
    }
  })

  return orders.map((order) => {
    const items = order.items.map((item) => {
      const boughtQty = item.purchases.reduce((sum, p) => sum + (p.quantity || 0), 0)
      return {
        ...item,
        bought_quantity: boughtQty,
        is_complete: boughtQty >= (item.quantity || 0),
        actual_cost_thb: item.purchases.reduce((sum, p) => sum + (p.actual_cost_thb || 0), 0)
      }
    })

    // Only a verified payment is money in hand; a pending slip is a claim.
    const customerPaid = order.payments
      .filter((p) => p.status === 'verified')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    return {
      ...order,
      items,
      is_fully_purchased: items.every((item) => item.is_complete),
      tentative_total: order.item_price_total || 0,
      agent_spent_thb: order.purchases.reduce((sum, p) => sum + (p.actual_cost_thb || 0), 0),
      customer_paid_thb: customerPaid
    }
  })
}
