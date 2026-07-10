import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getOrderAmountForPayment, generatePromptPayQR, submitPaymentSlip, verifySlip } from '../models/payment.model'

const paymentRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database; PROMPTPAY_ID: string; SLIP_VERIFY_API_KEY: string }; Variables: AuthVariables }>()

const QRCodeQuerySchema = z.object({
  order_id: z.string().openapi({ description: 'Order ID' }),
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
  
  try {
    const amount = await getOrderAmountForPayment(c.env.nihonthing_db, parseInt(order_id), type as 'deposit' | 'remaining')
    const qrBase64 = await generatePromptPayQR(c.env.PROMPTPAY_ID, amount)
    
    return c.json({ success: true, data: { amount, qrBase64 } })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400)
  }
})

const SubmitSlipSchema = z.object({
  order_id: z.number().optional(),
  ticket_id: z.number().optional(),
  amount: z.number(),
  payment_type: z.enum(['deposit', 'remaining']),
  method: z.string().optional(),
  slip_img: z.string().url('Must be a valid image URL')
})

const submitSlipRoute = createRoute({
  method: 'post',
  path: '/slip',
  tags: ['Payments'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: SubmitSlipSchema } } } },
  responses: { 201: { description: 'Slip uploaded successfully' } }
})

paymentRoutes.openapi(submitSlipRoute, async (c) => {
  const data = c.req.valid('json')
  
  try {
    const apiKey = c.env.SLIP_VERIFY_API_KEY
    if (!apiKey) {
      throw new Error('Slip verification API key is not configured')
    }
    
    // Verify slip via Thunder API
    const verifyData = await verifySlip(apiKey, data.slip_img, data.amount)
    
    // If successful, save to DB with status verified and reference ID
    const payment = await submitPaymentSlip(c.env.nihonthing_db, { 
      ...data, 
      status: 'verified',
      easyslip_ref: verifyData.rawSlip?.transRef
    })
    
    // Note: Here you would typically also update the Order's payment_status 
    // e.g. from 'pending_deposit' to 'deposit_paid'
    
    return c.json({ success: true, data: payment, verify_info: verifyData }, 201)
  } catch (error: any) {
    // If verification fails, we could save it as 'failed' or just reject the request.
    // Let's reject the request so the user can try again.
    return c.json({ success: false, message: error.message }, 400)
  }
})

export default paymentRoutes
