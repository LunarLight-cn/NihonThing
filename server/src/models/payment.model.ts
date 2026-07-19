import { drizzle } from 'drizzle-orm/d1'
import { eq, and, gt, lt, sql } from 'drizzle-orm'
import * as schema from '../db/schema'
import generatePayload from 'promptpay-qr'
import qrcode from 'qrcode'

const SLIP_MAX_ATTEMPTS = 10
const SLIP_WINDOW_MINUTES = 15
// Must not exceed the 60-minute shared prune in auth.service, or live rows
// would be deleted early.
const SLIP_PRUNE_MINUTES = 60

// Every verification attempt costs money at the external slip API, so a
// logged-in user gets a bounded number of tries per window. Uses the same
// lazily-pruned attempts table as login/registration, namespaced per user.
export const takeSlipQuota = async (d1: D1Database, userId: number): Promise<boolean> => {
  const db = drizzle(d1, { schema })
  const key = `slip:${userId}`
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.Login_Attempts)
    .where(and(
      eq(schema.Login_Attempts.email, key),
      gt(schema.Login_Attempts.cdate, sql`datetime('now', '-${sql.raw(String(SLIP_WINDOW_MINUTES))} minutes')`)
    ))
  if (count >= SLIP_MAX_ATTEMPTS) return false
  await db.insert(schema.Login_Attempts).values({ email: key })
  await db.delete(schema.Login_Attempts)
    .where(lt(schema.Login_Attempts.cdate, sql`datetime('now', '-${sql.raw(String(SLIP_PRUNE_MINUTES))} minutes')`))
  return true
}

export const getOrderAmountForPayment = async (d1: D1Database, orderId: number, type: 'deposit' | 'remaining', userId: number, userRole: string) => {
  const db = drizzle(d1, { schema })
  const order = await db.query.Orders.findFirst({
    where: eq(schema.Orders.id, orderId)
  })
  
  if (!order) throw new Error('Order not found')
  if (userRole === 'client' && order.user_id !== userId) {
    throw new Error('Unauthorized')
  }
  
  if (type === 'deposit') {
    return (order.item_price_total || 0) * 0.5
  } else {
    // For 'remaining', we calculate Grand Total minus the 50% deposit paid
    const depositPaid = (order.item_price_total || 0) * 0.5
    const remaining = (order.grand_total || 0) - depositPaid
    return remaining > 0 ? remaining : 0
  }
}

export const generatePromptPayQR = async (promptpayId: string, amount: number) => {
  const payload = generatePayload(promptpayId, { amount })
  // Use the SVG renderer instead of toDataURL: the latter resolves to qrcode's
  // browser build in the Workers runtime and requires a <canvas> element
  // ("You need to specify a canvas element"). SVG is canvas-free and works in
  // both Node and Workers. Return it as an inline data URL usable in <img src>.
  const svg = await qrcode.toString(payload, { type: 'svg', margin: 1 })
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const submitPaymentSlip = async (d1: D1Database, data: any) => {
  const db = drizzle(d1, { schema })
  return await db.insert(schema.Payments).values(data).returning()
}

export const verifySlip = async (apiUrl: string, apiKey: string, file: File, expectedAmount?: number) => {
  // Prepare FormData directly from the uploaded file
  const formData = new FormData()
  formData.append('image', file, file.name)
  formData.append('checkDuplicate', 'true')
  if (expectedAmount) {
    formData.append('matchAmount', expectedAmount.toString())
  }
  
  // Call external slip verification API
  const verifyRes = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  })
  
  const result = (await verifyRes.json()) as any
  
  if (!verifyRes.ok || !result.success) {
    throw new Error('Slip verification failed: Invalid slip or amount mismatch.')
  }
  
  return result.data
}
