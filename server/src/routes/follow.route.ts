import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getMyFollows, createFollow, deleteFollow } from '../models/follow.model'

const followRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreateFollowSchema = z.object({
  target_type: z.enum(['brand', 'product', 'event']),
  target_brand: z.string().optional(),
  target_product: z.string().optional(),
  target_event: z.string().optional()
})

const FollowIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Follow ID' })
})

// GET /api/follows/me
const getMyFollowsRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Follows'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Retrieve my follows successfully' } }
})

followRoutes.openapi(getMyFollowsRoute, async (c) => {
  const user = c.get('user')
  const follows = await getMyFollows(c.env.nihonthing_db, user.id)
  return c.json({ success: true, data: follows })
})

// POST /api/follows
const postFollowRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Follows'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateFollowSchema } } } },
  responses: { 201: { description: 'Follow created successfully' } }
})

followRoutes.openapi(postFollowRoute, async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')
  const newFollow = await createFollow(c.env.nihonthing_db, user.id, data)
  return c.json({ success: true, data: newFollow }, 201)
})

// DELETE /api/follows/:id
const deleteFollowRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Follows'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: { params: FollowIdParamsSchema },
  responses: { 200: { description: 'Follow deleted successfully' } }
})

followRoutes.openapi(deleteFollowRoute, async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const deletedFollow = await deleteFollow(c.env.nihonthing_db, user.id, parseInt(id))
  return c.json({ success: true, data: deletedFollow })
})

export default followRoutes
