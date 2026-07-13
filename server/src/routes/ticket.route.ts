import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getAllTickets, getTicketsByClientId, getTicketById, createTicket, updateTicket } from '../models/ticket.model'

const ticketRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreateTicketSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  brand: z.string().optional(),
  shop_name: z.string().optional(),
  area_name: z.string().optional(),
  spec: z.string().optional(),
  img: z.array(z.string().url('Must be a valid image URL')).min(1, 'At least 1 image is required').max(3, 'Maximum 3 images allowed'),
  external_link: z.string().url('Must be a valid URL').optional(),
  replacement: z.string().optional(),
  expected_price: z.number().optional()
})

const UpdateTicketSchema = z.object({
  agent_id: z.number().optional(),
  trip_id: z.number().optional(),
  proposed_price_jpy: z.number().optional(),
  proposed_price_thb: z.number().optional(),
  status: z.enum(['pending', 'negotiating', 'accepted', 'rejected', 'purchasing', 'completed', 'cancelled']).optional()
})

const TicketIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Ticket ID' })
})

// 1. GET /api/tickets - Admin only (View all custom requests)
const getAllTicketsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Tickets'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Retrieve all tickets successfully' } }
})

ticketRoutes.openapi(getAllTicketsRoute, async (c) => {
  const tickets = await getAllTickets(c.env.nihonthing_db)
  return c.json({ success: true, data: tickets })
})

// 2. GET /api/tickets/me - Client (View my own requests)
const getMyTicketsRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Tickets'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Retrieve my tickets successfully' } }
})

ticketRoutes.openapi(getMyTicketsRoute, async (c) => {
  const user = c.get('user')
  const tickets = await getTicketsByClientId(c.env.nihonthing_db, user.id)
  return c.json({ success: true, data: tickets })
})

// 3. POST /api/tickets - Client (Create new request)
const postTicketRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Tickets'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateTicketSchema } } } },
  responses: { 201: { description: 'Ticket created successfully' } }
})

ticketRoutes.openapi(postTicketRoute, async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')
  const newTicket = await createTicket(c.env.nihonthing_db, user.id, data)
  return c.json({ success: true, data: newTicket[0] })
})

// 4. PUT /api/tickets/:id - Admin only (Agent proposes price or updates status)
const putTicketRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Tickets (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: TicketIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateTicketSchema } } }
  },
  responses: { 200: { description: 'Ticket updated successfully' } }
})

ticketRoutes.openapi(putTicketRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const updatedTicket = await updateTicket(c.env.nihonthing_db, parseInt(id), data)
  return c.json({ success: true, data: updatedTicket[0] })
})

export default ticketRoutes
