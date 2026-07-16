import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, roleGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getPurchases, createPurchase, updatePurchase } from '../models/purchase.model'

const purchaseRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database; EXCHANGE_RATE_JPY_THB: string }; Variables: AuthVariables }>()

const CreatePurchaseSchema = z.object({
  order_item_id: z.number().optional(),
  product_id: z.number().optional(),
  quantity: z.number(),
  actual_cost_jpy: z.number(),
  shop_name: z.string().optional(),
  receipt_img: z.array(z.string().url()).optional()
})

const UpdatePurchaseSchema = CreatePurchaseSchema.partial()

const PurchaseIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Purchase ID' })
})

// GET /api/purchases
const getPurchasesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Purchases (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Retrieve all purchases successfully' } }
})

purchaseRoutes.openapi(getPurchasesRoute, async (c) => {
  const purchases = await getPurchases(c.env.nihonthing_db)
  return c.json({ success: true, data: purchases })
})

// POST /api/purchases
const postPurchaseRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Purchases (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreatePurchaseSchema } } } },
  responses: { 201: { description: 'Purchase created successfully' } }
})

purchaseRoutes.openapi(postPurchaseRoute, async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')
  const exchangeRate = parseFloat(c.env.EXCHANGE_RATE_JPY_THB) || 0.25
  
  const payload = {
    ...data,
    actual_cost_thb: data.actual_cost_jpy * exchangeRate
  }
  
  const newPurchase = await createPurchase(c.env.nihonthing_db, user.id, payload)
  return c.json({ success: true, data: newPurchase[0] })
})

// PUT /api/purchases/:id
const putPurchaseRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Purchases (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  request: {
    params: PurchaseIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdatePurchaseSchema } } }
  },
  responses: { 200: { description: 'Purchase updated successfully' } }
})

purchaseRoutes.openapi(putPurchaseRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  
  // Calculate new THB if JPY is updated
  if (data.actual_cost_jpy) {
    const exchangeRate = parseFloat(c.env.EXCHANGE_RATE_JPY_THB) || 0.25
    ;(data as any).actual_cost_thb = data.actual_cost_jpy * exchangeRate
  }
  
  const updatedPurchase = await updatePurchase(c.env.nihonthing_db, parseInt(id), data)
  return c.json({ success: true, data: updatedPurchase[0] })
})

export default purchaseRoutes
