import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getEventProducts, createEventProduct, deleteEventProduct } from '../models/event_product.model'

const eventProductRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreateEventProductSchema = z.object({
  event_id: z.number(),
  product_id: z.number()
})

const EventProductIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Event Product Mapping ID' })
})

const EventIdParamsSchema = z.object({
  eventId: z.string().openapi({ description: 'Event ID' })
})

// GET /api/event-products/event/:eventId
const getEventProductsRoute = createRoute({
  method: 'get',
  path: '/event/{eventId}',
  tags: ['Event Products'],
  request: { params: EventIdParamsSchema },
  responses: { 200: { description: 'Retrieve products for an event' } }
})

eventProductRoutes.openapi(getEventProductsRoute, async (c) => {
  const { eventId } = c.req.valid('param')
  const products = await getEventProducts(c.env.nihonthing_db, parseInt(eventId))
  return c.json({ success: true, data: products })
})

// POST /api/event-products
const postEventProductRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Event Products (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateEventProductSchema } } } },
  responses: { 201: { description: 'Mapping created successfully' } }
})

eventProductRoutes.openapi(postEventProductRoute, async (c) => {
  const data = c.req.valid('json')
  const newMapping = await createEventProduct(c.env.nihonthing_db, data)
  return c.json({ success: true, data: [0] })
})

// DELETE /api/event-products/:id
const deleteEventProductRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Event Products (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { params: EventProductIdParamsSchema },
  responses: { 200: { description: 'Mapping deleted successfully' } }
})

eventProductRoutes.openapi(deleteEventProductRoute, async (c) => {
  const { id } = c.req.valid('param')
  const deletedMapping = await deleteEventProduct(c.env.nihonthing_db, parseInt(id))
  return c.json({ success: true, data: [0] })
})

export default eventProductRoutes
