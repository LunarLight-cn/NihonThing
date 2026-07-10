import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'
import generatePayload from 'promptpay-qr'
import qrcode from 'qrcode'

export const getOrderAmountForPayment = async (d1: D1Database, orderId: number, type: 'deposit' | 'remaining') => {
  const db = drizzle(d1, { schema })
  const order = await db.query.Orders.findFirst({
    where: eq(schema.Orders.id, orderId)
  })
  
  if (!order) throw new Error('Order not found')
  
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

export const verifySlip = async (apiKey: string, imageUrl: string, expectedAmount?: number) => {
  // Fetch the image from URL as Blob
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error('Failed to download slip image for verification')
  }
  const imageBlob = await imageResponse.blob()
  
  // Prepare FormData
  const formData = new FormData()
  formData.append('image', imageBlob, 'slip.jpg')
  formData.append('checkDuplicate', 'true')
  if (expectedAmount) {
    formData.append('matchAmount', expectedAmount.toString())
  }
  
  // Call Thunder API
  const thunderRes = await fetch('https://api.thunder.in.th/v2/verify/bank', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    },
    body: formData
  })
  
  const result = await thunderRes.json()
  
  if (!thunderRes.ok || !result.success) {
    throw new Error(result?.error?.message || 'Slip verification failed')
  }
  
  return result.data
}
