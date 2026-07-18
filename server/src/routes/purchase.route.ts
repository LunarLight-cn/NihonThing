import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, roleGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getPurchases, createPurchase, updatePurchase, getShoppingQueue, claimOrderItems, releaseOrderItems } from '../models/purchase.model'
import { getSettings } from '../models/settings.model'

const purchaseRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreatePurchaseSchema = z.object({
  order_id: z.number().optional(),
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
  request: { query: z.object({ mine: z.enum(['true', 'false']).optional() }) },
  responses: { 200: { description: 'Retrieve all purchases successfully' } }
})

purchaseRoutes.openapi(getPurchasesRoute, async (c) => {
  const user = c.get('user')
  const { mine } = c.req.valid('query')
  const purchases = await getPurchases(c.env.nihonthing_db, mine === 'true' ? user.id : undefined)
  return c.json({ success: true, data: purchases })
})

// GET /api/purchases/queue
const getQueueRoute = createRoute({
  method: 'get',
  path: '/queue',
  tags: ['Purchases (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Retrieve the shopping queue successfully' } }
})

purchaseRoutes.openapi(getQueueRoute, async (c) => {
  const queue = await getShoppingQueue(c.env.nihonthing_db)
  return c.json({ success: true, data: queue })
})

const ClaimSchema = z.object({
  item_ids: z.array(z.number()).min(1)
})

// POST /api/purchases/claim
const postClaimRoute = createRoute({
  method: 'post',
  path: '/claim',
  tags: ['Purchases (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: ClaimSchema } } } },
  responses: { 200: { description: 'Lines claimed' }, 409: { description: 'Already claimed by someone else' } }
})

purchaseRoutes.openapi(postClaimRoute, async (c) => {
  const user = c.get('user')
  const { item_ids } = c.req.valid('json')

  let claimed
  try {
    claimed = await claimOrderItems(c.env.nihonthing_db, user.id, item_ids)
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 400)
  }

  if (claimed.length === 0) {
    return c.json({ success: false, message: 'Those lines are already claimed by another agent.' }, 409)
  }

  return c.json({ success: true, data: claimed })
})

// POST /api/purchases/release
const postReleaseRoute = createRoute({
  method: 'post',
  path: '/release',
  tags: ['Purchases (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: ClaimSchema } } } },
  responses: { 200: { description: 'Claim released' } }
})

purchaseRoutes.openapi(postReleaseRoute, async (c) => {
  const user = c.get('user')
  const { item_ids } = c.req.valid('json')
  const released = await releaseOrderItems(c.env.nihonthing_db, user.id, item_ids, user.role === 'admin')
  return c.json({ success: true, data: released })
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
  const exchangeRate = (await getSettings(c.env.nihonthing_db)).exchange_rate_jpy_thb || 0.25
  
  const payload = {
    ...data,
    actual_cost_thb: data.actual_cost_jpy * exchangeRate
  }
  
  try {
    const newPurchase = await createPurchase(c.env.nihonthing_db, user.id, payload, user.role === 'admin')
    return c.json({ success: true, data: newPurchase })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 400)
  }
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
    const exchangeRate = (await getSettings(c.env.nihonthing_db)).exchange_rate_jpy_thb || 0.25
    ;(data as any).actual_cost_thb = data.actual_cost_jpy * exchangeRate
  }
  
  const updatedPurchase = await updatePurchase(c.env.nihonthing_db, parseInt(id), data)
  return c.json({ success: true, data: updatedPurchase[0] })
})

export default purchaseRoutes
