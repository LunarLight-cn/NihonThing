import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../models/event.model'

const eventRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreateEventSchema = z.object({
  title: z.string(),
  desc: z.string().optional(),
  start_date: z.string(),
  end_date: z.string().optional(),
  banner_img: z.string().url().optional(),
  trip_id: z.number().optional(),
  area_id: z.number().optional(),
  shop_id: z.number().optional()
})

const UpdateEventSchema = CreateEventSchema.partial()

const EventIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Event ID' })
})

// GET /api/events
const getEventsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Events'],
  responses: { 200: { description: 'Retrieve all events successfully' } }
})

eventRoutes.openapi(getEventsRoute, async (c) => {
  const events = await getAllEvents(c.env.nihonthing_db)
  return c.json({ success: true, data: events })
})

// GET /api/events/:id
const getEventByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Events'],
  request: { params: EventIdParamsSchema },
  responses: { 200: { description: 'Retrieve event by ID successfully' } }
})

eventRoutes.openapi(getEventByIdRoute, async (c) => {
  const { id } = c.req.valid('param')
  const event = await getEventById(c.env.nihonthing_db, parseInt(id))
  return c.json({ success: true, data: event })
})

// POST /api/events
const postEventRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Events'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateEventSchema } } } },
  responses: { 201: { description: 'Event created successfully' } }
})

eventRoutes.openapi(postEventRoute, async (c) => {
  const data = c.req.valid('json')
  const newEvent = await createEvent(c.env.nihonthing_db, data)
  return c.json({ success: true, data: newEvent }, 201)
})

// PUT /api/events/:id
const putEventRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Events'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: EventIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateEventSchema } } }
  },
  responses: { 200: { description: 'Event updated successfully' } }
})

eventRoutes.openapi(putEventRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const updatedEvent = await updateEvent(c.env.nihonthing_db, parseInt(id), data)
  return c.json({ success: true, data: updatedEvent })
})

// DELETE /api/events/:id
const deleteEventRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Events'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { params: EventIdParamsSchema },
  responses: { 200: { description: 'Event deleted successfully' } }
})

eventRoutes.openapi(deleteEventRoute, async (c) => {
  const { id } = c.req.valid('param')
  const deletedEvent = await deleteEvent(c.env.nihonthing_db, parseInt(id))
  return c.json({ success: true, data: deletedEvent })
})

export default eventRoutes
