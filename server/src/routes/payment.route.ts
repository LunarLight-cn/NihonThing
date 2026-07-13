import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getOrderAmountForPayment, generatePromptPayQR, submitPaymentSlip, verifySlip } from '../models/payment.model'
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
    const qrBase64 = await generatePromptPayQR(c.env.PROMPTPAY_ID, amount)
    
    return c.json({ success: true, data: { amount, qrBase64 } })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400)
  }
})

const SubmitSlipSchema = z.object({
  order_id: z.coerce.number().int().optional(),
  ticket_id: z.coerce.number().int().optional(),
  amount: z.coerce.number(),
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
  const amount = data.amount
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

    if (order_id) {
      const order = await getOrderById(c.env.nihonthing_db, order_id)
      // order might be undefined if getOrderById returns it, but getOrderById throws error if not found.
      if (user.role === 'client' && order.user_id !== user.id) {
        return c.json({ success: false, message: 'Unauthorized to pay for this order' }, 403)
      }
    } else if (ticket_id) {
      const ticket = await getTicketById(c.env.nihonthing_db, ticket_id)
      if (!ticket) {
        return c.json({ success: false, message: 'Ticket not found' }, 404)
      }
      if (user.role === 'client' && ticket.client_id !== user.id) {
        return c.json({ success: false, message: 'Unauthorized to pay for this ticket' }, 403)
      }
    }

    // Verify slip via external API by passing the File directly
    const slipArrayBuffer = await file.arrayBuffer()
    if (!verifyMagicBytes(slipArrayBuffer)) {
      return c.json({ success: false, message: 'Invalid file content. The file appears to be corrupted or disguised.' }, 400)
    }

    const verifyData = await verifySlip(apiUrl, apiKey, new File([slipArrayBuffer], file.name, { type: file.type }), amount)
    
    // If successful, save the file to R2
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `slip_${crypto.randomUUID()}.${ext}`
    
    // @ts-ignore - Check if bucket exists in env
    if (c.env.nihonthing_bucket) {
      // @ts-ignore
      await c.env.nihonthing_bucket.put(fileName, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
      })
    } else {
      console.warn('nihonthing_bucket is not defined in env, skipping R2 upload')
    }
    
    const slip_img = `/api/uploads/${fileName}`
    
    // Save to DB
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
    
    // Update the Order's payment_status based on payment_type if order_id is provided
    if (order_id) {
      const newStatus = payment_type === 'deposit' ? 'deposit_paid' : 'fully_paid'
      await updateOrder(c.env.nihonthing_db, order_id, {
        payment_status: newStatus
      }, user.id)
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
