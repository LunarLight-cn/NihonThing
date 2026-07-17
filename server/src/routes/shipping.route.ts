import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getShippingBoard, moveUnpaidOrders, cancelOverdueOrders, departTrip, arriveTrip } from '../models/shipping.model'

const shippingRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const TripIdParamsSchema = z.object({
  id: z.coerce.number().int().openapi({ description: 'Trip ID' })
})

const adminPost = (path: string, description: string) => createRoute({
  method: 'post' as const,
  path,
  tags: ['Shipping (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: path.includes('{id}') ? { params: TripIdParamsSchema } : undefined,
  responses: { 200: { description } }
})

const getBoardRoute = createRoute({
  method: 'get',
  path: '/board',
  tags: ['Shipping (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Trips with their orders and payment readiness' } }
})

shippingRoutes.openapi(getBoardRoute, async (c) => {
  const board = await getShippingBoard(c.env.nihonthing_db)
  return c.json({ success: true, data: board })
})

shippingRoutes.openapi(adminPost('/trips/{id}/depart', 'Trip departed; paid orders now in transit'), async (c) => {
  const { id } = c.req.valid('param')
  const result = await departTrip(c.env.nihonthing_db, id)
  return c.json({ success: true, data: result })
})

shippingRoutes.openapi(adminPost('/trips/{id}/arrive', 'Trip arrived; orders await local courier'), async (c) => {
  const { id } = c.req.valid('param')
  const result = await arriveTrip(c.env.nihonthing_db, id)
  return c.json({ success: true, data: result })
})

shippingRoutes.openapi(adminPost('/move-unpaid', 'Unpaid orders moved to the next trip'), async (c) => {
  const results = await moveUnpaidOrders(c.env.nihonthing_db)
  return c.json({ success: true, data: results })
})

shippingRoutes.openapi(adminPost('/cancel-overdue', 'Overdue unpaid orders cancelled'), async (c) => {
  const results = await cancelOverdueOrders(c.env.nihonthing_db)
  return c.json({ success: true, data: results })
})

export default shippingRoutes
