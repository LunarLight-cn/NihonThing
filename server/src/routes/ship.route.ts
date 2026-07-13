import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getShips, createShip, updateShip } from '../models/ship.model'

const shipRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database; DEFAULT_TRIP_CUTOFF_DAYS: string }; Variables: AuthVariables }>()

const CreateShipSchema = z.object({
  type: z.string(),
  ship_date: z.string(),
  track_no: z.string().optional(),
  ship_price: z.number().optional(),
  courier_name: z.string().optional(),
  origin_id: z.number(),
  destination_id: z.number(),
  max_cap: z.number().optional(),
  close_date: z.string().optional()
})

const UpdateShipSchema = CreateShipSchema.partial().extend({
  status: z.enum(['open', 'closed', 'in_transit', 'arrived']).optional(),
  current_cap: z.number().optional()
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
  const defaultCutoff = parseInt(c.env.DEFAULT_TRIP_CUTOFF_DAYS) || 5
  const ships = await getShips(c.env.nihonthing_db, defaultCutoff)
  return c.json({ success: true, data: ships })
})

// 2. POST /api/ships - Admin Only
const postShipRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Ships (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateShipSchema } } } },
  responses: { 201: { description: 'Trip created successfully' } }
})

shipRoutes.openapi(postShipRoute, async (c) => {
  const data = c.req.valid('json')
  const newShip = await createShip(c.env.nihonthing_db, data)
  return c.json({ success: true, data: newShip }, 201)
})

// 3. PUT /api/ships/:id - Admin Only
const putShipRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Ships (Admin)'],
  middleware: [authGuard, adminGuard] as const,
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
  return c.json({ success: true, data: updatedShip })
})

export default shipRoutes
