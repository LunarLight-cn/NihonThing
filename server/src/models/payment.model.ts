import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'
import generatePayload from 'promptpay-qr'
import qrcode from 'qrcode'

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
  const qrImage = await qrcode.toDataURL(payload)
  return qrImage
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
