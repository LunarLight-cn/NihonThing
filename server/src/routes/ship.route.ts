import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, roleGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getShips, createShip, updateShip } from '../models/ship.model'

const shipRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreateShipSchema = z.object({
  type: z.enum(['flight', 'sea']),
  ship_date: z.string(),
  track_no: z.string().optional(),
  ship_price: z.number().optional(),
  courier_name: z.string().optional(),
  origin_id: z.number(),
  destination_id: z.number(),
  // Capacity caps — 0 or omitted means that axis is unlimited.
  max_cap: z.number().optional(),
  max_items: z.number().int().optional(),
  max_price: z.number().optional(),
  close_date: z.string().optional()
})

const UpdateShipSchema = CreateShipSchema.partial().extend({
  // in_transit / arrived are reachable only through the shipping board's
  // depart/arrive actions, which also move the trip's orders.
  status: z.enum(['open', 'closed']).optional(),
  current_cap: z.number().optional(),
  current_items: z.number().int().optional(),
  current_price: z.number().optional()
})

const ShipIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Ship/Trip ID' })
})

// 1. GET /api/ships - Public (with is_closed UX magic)
const getShipsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Ships'],
  responses: { 200: { description: 'Retrieve all trips successfully' } }
})

shipRoutes.openapi(getShipsRoute, async (c) => {
  const ships = await getShips(c.env.nihonthing_db)
  return c.json({ success: true, data: ships })
})

// 2. POST /api/ships - Admin Only
const postShipRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Ships (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateShipSchema } } } },
  responses: { 201: { description: 'Trip created successfully' } }
})

shipRoutes.openapi(postShipRoute, async (c) => {
  const data = c.req.valid('json')
  const newShip = await createShip(c.env.nihonthing_db, data)
  return c.json({ success: true, data: newShip[0] })
})

// 3. PUT /api/ships/:id - Admin Only
const putShipRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Ships (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  request: {
    params: ShipIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateShipSchema } } }
  },
  responses: { 200: { description: 'Trip updated successfully' } }
})

shipRoutes.openapi(putShipRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const updatedShip = await updateShip(c.env.nihonthing_db, parseInt(id), data)
  return c.json({ success: true, data: updatedShip[0] })
})

export default shipRoutes
