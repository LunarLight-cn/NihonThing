import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getOrderAmountForPayment, generatePromptPayQR, submitPaymentSlip, verifySlip, takeSlipQuota } from '../models/payment.model'
import { updateOrder, getOrderById } from '../models/order.model'
import { getTicketById } from '../models/ticket.model'
import { verifyMagicBytes } from '../utils/file'

const paymentRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database; PROMPTPAY_ID: string; SLIP_VERIFY_API_KEY: string; SLIP_VERIFY_API_URL: string }; Variables: AuthVariables }>()

const QRCodeQuerySchema = z.object({
  order_id: z.coerce.number().int().openapi({ description: 'Order ID' }),
  type: z.enum(['deposit', 'remaining']).openapi({ description: 'Payment Type' })
})

const getQRCodeRoute = createRoute({
  method: 'get',
  path: '/qrcode',
  tags: ['Payments'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: { query: QRCodeQuerySchema },
  responses: { 
    200: { description: 'Generate QR Code successfully' },
    400: { description: 'Bad Request' }
  }
})

paymentRoutes.openapi(getQRCodeRoute, async (c) => {
  const { order_id, type } = c.req.valid('query')
  const user = c.get('user')
  
  try {
    const amount = await getOrderAmountForPayment(c.env.nihonthing_db, order_id, type as 'deposit' | 'remaining', user.id, user.role)
    // A zero remainder means the final total has not been set yet - a ฿0 QR
    // would only confuse the customer.
    if (amount <= 0) {
      return c.json({ success: false, message: 'There is nothing to pay yet on this order.' }, 400)
    }
    const qrBase64 = await generatePromptPayQR(c.env.PROMPTPAY_ID, amount)

    return c.json({ success: true, data: { amount, qrBase64 } })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400)
  }
})

const SubmitSlipSchema = z.object({
  order_id: z.coerce.number().int().optional(),
  ticket_id: z.coerce.number().int().optional(),
  // Ignored for orders - the server derives what is owed. Kept for tickets.
  amount: z.coerce.number().optional(),
  payment_type: z.enum(['deposit', 'remaining']),
  method: z.string().optional(),
  file: z.instanceof(File).openapi({
    type: 'string',
    format: 'binary',
    description: 'Image file of the payment slip'
  })
}).refine(data => (data.order_id !== undefined) !== (data.ticket_id !== undefined), {
  message: "Must provide either order_id or ticket_id, but not both",
  path: ["order_id", "ticket_id"]
})

const submitSlipRoute = createRoute({
  method: 'post',
  path: '/slip',
  tags: ['Payments'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'multipart/form-data': { schema: SubmitSlipSchema } } } },
  responses: { 201: { description: 'Slip uploaded successfully' }, 400: { description: 'Bad Request' } }
})

paymentRoutes.openapi(submitSlipRoute, async (c) => {
  const data = c.req.valid('form')

  const file = data.file
  const order_id = data.order_id
  const ticket_id = data.ticket_id
  const payment_type = data.payment_type
  const method = data.method

  try {
    const apiKey = c.env.SLIP_VERIFY_API_KEY
    const apiUrl = c.env.SLIP_VERIFY_API_URL
    if (!apiKey || !apiUrl) {
      throw new Error('Slip verification service is not configured')
    }

    const user = c.get('user')

    // What must be paid is decided here, never by the caller - a slip is only
    // accepted when it matches the amount the order actually owes.
    let amount = data.amount ?? 0
    if (order_id) {
      const order = await getOrderById(c.env.nihonthing_db, order_id)
      if (user.role === 'client' && order.user_id !== user.id) {
        return c.json({ success: false, message: 'Unauthorized to pay for this order' }, 403)
      }
      // Payments go deposit first, then the remainder - reject out-of-order or
      // duplicate payments before touching the slip.
      const pay = order.payment_status ?? 'pending_deposit'
      if (payment_type === 'deposit' && pay !== 'pending_deposit') {
        return c.json({ success: false, message: 'The deposit on this order is already paid.' }, 400)
      }
      if (payment_type === 'remaining' && !['deposit_paid', 'pending_remaining'].includes(pay)) {
        return c.json({ success: false, message: pay === 'fully_paid' ? 'This order is already fully paid.' : 'Pay the deposit first.' }, 400)
      }
      amount = await getOrderAmountForPayment(c.env.nihonthing_db, order_id, payment_type, user.id, user.role)
      if (amount <= 0) {
        return c.json({ success: false, message: 'There is nothing left to pay on this order.' }, 400)
      }
    } else if (ticket_id) {
      const ticket = await getTicketById(c.env.nihonthing_db, ticket_id)
      if (!ticket) {
        return c.json({ success: false, message: 'Ticket not found' }, 404)
      }
      if (user.role === 'client' && ticket.client_id !== user.id) {
        return c.json({ success: false, message: 'Unauthorized to pay for this ticket' }, 403)
      }
      if (!amount) {
        return c.json({ success: false, message: 'Amount is required for ticket payments.' }, 400)
      }
    }

    // Verify slip via external API by passing the File directly
    const slipArrayBuffer = await file.arrayBuffer()
    if (!verifyMagicBytes(slipArrayBuffer)) {
      return c.json({ success: false, message: 'Invalid file content. The file appears to be corrupted or disguised.' }, 400)
    }

    // The external verification API bills per call - cap attempts per user.
    if (!(await takeSlipQuota(c.env.nihonthing_db, user.id))) {
      return c.json({ success: false, message: 'Too many slip attempts. Try again in a few minutes.' }, 429)
    }

    const verifyData = await verifySlip(apiUrl, apiKey, new File([slipArrayBuffer], file.name, { type: file.type }), amount)

    // Same folder layout as customer slip uploads elsewhere in the app.
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const now = new Date()
    const fileName = `slips/customer/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/slip_${crypto.randomUUID()}.${ext}`

    if (c.env.nihonthing_bucket) {
      await c.env.nihonthing_bucket.put(fileName, slipArrayBuffer, {
        httpMetadata: { contentType: file.type }
      })
    } else {
      console.warn('nihonthing_bucket is not defined in env, skipping R2 upload')
    }

    const slip_img = `/api/uploads/${encodeURIComponent(fileName)}`

    const payment = await submitPaymentSlip(c.env.nihonthing_db, {
      order_id,
      ticket_id,
      amount,
      payment_type,
      method,
      slip_img,
      status: 'verified',
      verify_ref: verifyData.rawSlip?.transRef
    })

    // No userId here: ownership was checked above, and passing the submitter's
    // id broke admin/agent submissions after the payment row was written.
    if (order_id) {
      const newStatus = payment_type === 'deposit' ? 'deposit_paid' : 'fully_paid'
      await updateOrder(c.env.nihonthing_db, order_id, { payment_status: newStatus })
    }

    const [paymentRecord] = payment
    const { verify_ref, ...publicPaymentData } = paymentRecord

    return c.json({ success: true, data: publicPaymentData }, 201)
  } catch (error: any) {
    // If verification fails, we could save it as 'failed' or just reject the request.
    // Let's reject the request so the user can try again.
    return c.json({ success: false, message: error.message }, 400)
  }
})

export default paymentRoutes
