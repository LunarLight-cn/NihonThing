import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getAllAreas, getAreaById, createArea, updateArea, deleteArea } from '../models/area.model'

const areaRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreateAreaSchema = z.object({
  name_th: z.string(),
  name_en: z.string(),
  name_jp: z.string().optional(),
  map_location: z.string().optional()
})

const UpdateAreaSchema = CreateAreaSchema.partial()

const AreaIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Area ID' })
})

// GET /api/areas
const getAreasRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Areas'],
  responses: { 200: { description: 'Retrieve all areas successfully' } }
})

areaRoutes.openapi(getAreasRoute, async (c) => {
  const areas = await getAllAreas(c.env.nihonthing_db)
  return c.json({ success: true, data: areas })
})

// GET /api/areas/:id
const getAreaByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Areas'],
  request: { params: AreaIdParamsSchema },
  responses: { 200: { description: 'Retrieve area by ID successfully' } }
})

areaRoutes.openapi(getAreaByIdRoute, async (c) => {
  const { id } = c.req.valid('param')
  const area = await getAreaById(c.env.nihonthing_db, parseInt(id))
  return c.json({ success: true, data: area })
})

// POST /api/areas
const postAreaRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Areas'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateAreaSchema } } } },
  responses: { 201: { description: 'Area created successfully' } }
})

areaRoutes.openapi(postAreaRoute, async (c) => {
  const data = c.req.valid('json')
  const newArea = await createArea(c.env.nihonthing_db, data)
  return c.json({ success: true, data: newArea }, 201)
})

// PUT /api/areas/:id
const putAreaRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Areas'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: AreaIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateAreaSchema } } }
  },
  responses: { 200: { description: 'Area updated successfully' } }
})

areaRoutes.openapi(putAreaRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const updatedArea = await updateArea(c.env.nihonthing_db, parseInt(id), data)
  return c.json({ success: true, data: updatedArea })
})

// DELETE /api/areas/:id
const deleteAreaRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Areas'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { params: AreaIdParamsSchema },
  responses: { 200: { description: 'Area deleted successfully' } }
})

areaRoutes.openapi(deleteAreaRoute, async (c) => {
  const { id } = c.req.valid('param')
  const deletedArea = await deleteArea(c.env.nihonthing_db, parseInt(id))
  return c.json({ success: true, data: deletedArea })
})

export default areaRoutes
