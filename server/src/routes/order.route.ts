import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { createOrder, getMyOrders, getAllOrders, updateOrder } from '../models/order.model'

const orderRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database; DEFAULT_TRIP_CUTOFF_DAYS: string }; Variables: AuthVariables }>()

const OrderItemSchema = z.object({
  type: z.enum(['product', 'ticket']),
  id: z.number(),
  quantity: z.number().min(1),
  options: z.record(z.string(), z.string()).optional()
})

const CreateOrderSchema = z.object({
  trip_id: z.number(),
  address_id: z.number(),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item')
})

const UpdateOrderSchema = z.object({
  deliv_date: z.string().optional(),
  shipped_date: z.string().optional(),
  track_no: z.string().optional(),
  courier_name: z.string().optional(),
  shipping_fee_jp_th: z.number().optional(),
  shipping_fee_th_th: z.number().optional(),
  grand_total: z.number().optional(),
  status: z.enum(['pending', 'purchasing', 'in_transit', 'arrived', 'local_shipping', 'delivered', 'cancelled']).optional(),
  payment_status: z.enum(['pending_deposit', 'deposit_paid', 'pending_remaining', 'fully_paid']).optional()
})

const OrderIdParamsSchema = z.object({
  id: z.coerce.number().int().openapi({ description: 'Order ID' })
})

// 1. POST /api/orders (Client creates order)
const postOrderRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Orders'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateOrderSchema } } } },
  responses: { 201: { description: 'Order created successfully' } }
})

orderRoutes.openapi(postOrderRoute, async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')
  const defaultCutoff = parseInt(c.env.DEFAULT_TRIP_CUTOFF_DAYS) || 5
  
  try {
    const newOrder = await createOrder(c.env.nihonthing_db, user.id, data.trip_id, data.address_id, data.items, defaultCutoff)
    return c.json({ success: true, data: newOrder })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 400)
  }
})

// 2. GET /api/orders/me (Client views their orders)
const getMyOrdersRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Orders'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Retrieve my orders successfully' } }
})

orderRoutes.openapi(getMyOrdersRoute, async (c) => {
  const user = c.get('user')
  const orders = await getMyOrders(c.env.nihonthing_db, user.id)
  return c.json({ success: true, data: orders })
})

// 3. GET /api/orders (Admin views all orders)
const getAllOrdersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Orders (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Retrieve all orders successfully' } }
})

orderRoutes.openapi(getAllOrdersRoute, async (c) => {
  const orders = await getAllOrders(c.env.nihonthing_db)
  return c.json({ success: true, data: orders })
})

// 4. PUT /api/orders/:id (Admin updates order)
const putOrderRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Orders (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: OrderIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateOrderSchema } } }
  },
  responses: { 200: { description: 'Order updated successfully' } }
})

orderRoutes.openapi(putOrderRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  try {
    const updatedOrder = await updateOrder(c.env.nihonthing_db, id, data)
    return c.json({ success: true, data: updatedOrder })
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 400)
  }
})

export default orderRoutes
