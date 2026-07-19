import { drizzle } from 'drizzle-orm/d1'
import { eq, and, inArray, sql, gt } from 'drizzle-orm'
import * as schema from '../db/schema'
import { releaseTripCapacity, updateOrder } from './order.model'
import { getSettings } from './settings.model'

const ACTIVE_ORDER = ['pending', 'purchasing'] as const

// Everything the admin Shipping page shows: every trip that is not finished,
// with its orders and where each one stands on money and fulfillment.
export const getShippingBoard = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  const settings = await getSettings(d1)

  const trips = await db.query.Ships.findMany({
    where: inArray(schema.Ships.status, ['open', 'closed', 'in_transit', 'arrived']),
    orderBy: (s, { asc }) => [asc(s.ship_date)]
  })

  const tripIds = trips.map((t) => t.id)
  const orders = tripIds.length
    ? await db.query.Orders.findMany({
        where: inArray(schema.Orders.trip_id, tripIds),
        with: {
          user: { columns: { id: true, username: true } },
          items: { columns: { id: true, quantity: true } }
        }
      })
    : []

  return {
    unpaid_move_days: settings.unpaid_move_days ?? 3,
    overdue_cancel_days: settings.overdue_cancel_days ?? 14,
    trips: trips.map((trip) => {
      const tripOrders = orders.filter((o) => o.trip_id === trip.id && o.status !== 'cancelled')
      return {
        ...trip,
        orders: tripOrders,
        ready_count: tripOrders.filter((o) => o.payment_status === 'fully_paid' && ACTIVE_ORDER.includes(o.status as any)).length,
        unpaid_count: tripOrders.filter((o) => o.payment_status !== 'fully_paid' && ACTIVE_ORDER.includes(o.status as any)).length,
        shipped_count: tripOrders.filter((o) => ['in_transit', 'arrived', 'local_shipping', 'delivered'].includes(o.status ?? '')).length
      }
    })
  }
}

// Take over the capacity an order occupies on its new trip. The guarded WHERE
// mirrors createOrder: if the new trip cannot fit the order, nothing updates
// and the move is refused.
const claimTripCapacity = async (
  db: ReturnType<typeof drizzle<typeof schema>>,
  order: typeof schema.Orders.$inferSelect,
  newTripId: number
) => {
  const items = await db.query.Order_Items.findMany({
    where: eq(schema.Order_Items.order_id, order.id),
    with: { product: { columns: { weight: true } } }
  })
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0)
  const weight = items.reduce((sum, i) => sum + (i.product?.weight || 0) * (i.quantity || 0), 0)
  const price = order.item_price_total || 0

  const updated = await db.update(schema.Ships)
    .set({
      current_items: sql`COALESCE(current_items, 0) + ${itemCount}`,
      current_cap: sql`COALESCE(current_cap, 0) + ${weight}`,
      current_price: sql`COALESCE(current_price, 0) + ${price}`,
      // Mirror createOrder: the move that fills an axis also closes the trip,
      // otherwise it would sit "open" while rejecting every new order.
      status: sql`CASE WHEN
        (COALESCE(max_items, 0) > 0 AND COALESCE(current_items, 0) + ${itemCount} >= max_items)
        OR (COALESCE(max_cap, 0) > 0 AND COALESCE(current_cap, 0) + ${weight} >= max_cap)
        OR (COALESCE(max_price, 0) > 0 AND COALESCE(current_price, 0) + ${price} >= max_price)
        THEN 'closed' ELSE status END`
    })
    .where(and(
      eq(schema.Ships.id, newTripId),
      sql`(COALESCE(max_items, 0) = 0 OR COALESCE(current_items, 0) + ${itemCount} <= max_items)`,
      sql`(COALESCE(max_cap, 0) = 0 OR COALESCE(current_cap, 0) + ${weight} <= max_cap)`,
      sql`(COALESCE(max_price, 0) = 0 OR COALESCE(current_price, 0) + ${price} <= max_price)`
    ))
    .returning()

  return updated.length > 0
}

// Move every unpaid order off trips that are within unpaid_move_days of
// departure, onto the next open trip of the same type. Returns what happened
// per order so the admin sees it, not just a count.
export const moveUnpaidOrders = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  const settings = await getSettings(d1)
  const days = settings.unpaid_move_days ?? 3

  const trips = await db.query.Ships.findMany({
    where: inArray(schema.Ships.status, ['open', 'closed'])
  })
  const now = Date.now()
  const dueTrips = trips.filter((t) => new Date(t.ship_date).getTime() - now <= days * 86_400_000)

  const results: { order_id: number; order_code: string | null; outcome: string }[] = []

  for (const trip of dueTrips) {
    const unpaid = await db.query.Orders.findMany({
      where: and(
        eq(schema.Orders.trip_id, trip.id),
        inArray(schema.Orders.status, [...ACTIVE_ORDER]),
        sql`${schema.Orders.payment_status} != 'fully_paid'`
      )
    })
    if (unpaid.length === 0) continue

    // Next departure of the same type that is genuinely later and still open.
    const nextTrip = trips
      .filter((t) => t.id !== trip.id && t.type === trip.type && t.status === 'open' && new Date(t.ship_date).getTime() - now > days * 86_400_000)
      .sort((a, b) => new Date(a.ship_date).getTime() - new Date(b.ship_date).getTime())[0]

    for (const order of unpaid) {
      if (!nextTrip) {
        results.push({ order_id: order.id, order_code: order.order_code, outcome: 'no_next_trip' })
        continue
      }
      const claimed = await claimTripCapacity(db, order, nextTrip.id)
      if (!claimed) {
        results.push({ order_id: order.id, order_code: order.order_code, outcome: 'next_trip_full' })
        continue
      }
      await releaseTripCapacity(db, order)
      await db.update(schema.Orders)
        .set({ trip_id: nextTrip.id, udate: sql`CURRENT_TIMESTAMP` })
        .where(eq(schema.Orders.id, order.id))
      results.push({ order_id: order.id, order_code: order.order_code, outcome: `moved_to_trip_${nextTrip.id}` })
    }
  }

  return results
}

// Cancel (never delete) orders that have sat unpaid past the deadline:
// deposits never paid since the order was placed, and shipping fees still
// unpaid after their trip already left. Goes through updateOrder so the
// trip capacity is released exactly once.
export const cancelOverdueOrders = async (d1: D1Database) => {
  const db = drizzle(d1, { schema })
  const settings = await getSettings(d1)
  const days = settings.overdue_cancel_days ?? 14
  // Compared in SQL: cdate is a SQLite CURRENT_TIMESTAMP string, and matching
  // it against a JS ISO string ("...T...Z") mis-sorts rows on the boundary day.
  const cutoffExpr = sql`datetime('now', '-${sql.raw(String(days))} days')`

  const noDeposit = await db.query.Orders.findMany({
    where: and(
      inArray(schema.Orders.status, [...ACTIVE_ORDER]),
      eq(schema.Orders.payment_status, 'pending_deposit'),
      sql`${schema.Orders.cdate} <= ${cutoffExpr}`
    )
  })

  const trips = await db.query.Ships.findMany({
    where: sql`${schema.Ships.ship_date} <= ${cutoffExpr}`
  })
  const pastTripIds = trips.map((t) => t.id)
  const noShippingFee = pastTripIds.length
    ? await db.query.Orders.findMany({
        where: and(
          inArray(schema.Orders.trip_id, pastTripIds),
          inArray(schema.Orders.status, [...ACTIVE_ORDER]),
          sql`${schema.Orders.payment_status} != 'fully_paid'`,
          gt(schema.Orders.id, 0)
        )
      })
    : []

  const seen = new Set<number>()
  const results: { order_id: number; order_code: string | null }[] = []
  for (const order of [...noDeposit, ...noShippingFee]) {
    if (seen.has(order.id)) continue
    seen.add(order.id)
    await updateOrder(d1, order.id, { status: 'cancelled' })
    results.push({ order_id: order.id, order_code: order.order_code })
  }
  return results
}

// A trip departs: it goes in_transit and takes its paid orders with it.
// Unpaid ones stay behind for the move/cancel rules - goods that are not
// paid for do not leave the country.
export const departTrip = async (d1: D1Database, tripId: number) => {
  const db = drizzle(d1, { schema })

  await db.update(schema.Ships).set({ status: 'in_transit' }).where(eq(schema.Ships.id, tripId))
  const shipped = await db.update(schema.Orders)
    .set({ status: 'in_transit', shipped_date: sql`CURRENT_TIMESTAMP`, udate: sql`CURRENT_TIMESTAMP` })
    .where(and(
      eq(schema.Orders.trip_id, tripId),
      inArray(schema.Orders.status, [...ACTIVE_ORDER]),
      eq(schema.Orders.payment_status, 'fully_paid')
    ))
    .returning()

  const leftBehind = await db.query.Orders.findMany({
    where: and(
      eq(schema.Orders.trip_id, tripId),
      inArray(schema.Orders.status, [...ACTIVE_ORDER])
    )
  })

  return { shipped: shipped.length, left_behind: leftBehind.length }
}

// The trip lands: its in-transit orders have arrived in the destination
// country and await the domestic courier.
export const arriveTrip = async (d1: D1Database, tripId: number) => {
  const db = drizzle(d1, { schema })

  const updated = await db.update(schema.Ships)
    .set({ status: 'arrived' })
    .where(and(eq(schema.Ships.id, tripId), eq(schema.Ships.status, 'in_transit')))
    .returning()
  if (updated.length === 0) {
    throw new Error('This trip has not departed yet.')
  }
  const arrived = await db.update(schema.Orders)
    .set({ status: 'arrived', udate: sql`CURRENT_TIMESTAMP` })
    .where(and(eq(schema.Orders.trip_id, tripId), eq(schema.Orders.status, 'in_transit')))
    .returning()

  return { arrived: arrived.length }
}
