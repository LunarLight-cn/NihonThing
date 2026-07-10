import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { fetchUsersList } from '../services/user.service'
import { authGuard, AuthVariables } from '../middlewares/auth.middleware'
import { updateUserProfile, getUserById } from '../models/user.model'
import addressRoutes from './address.route'

const userRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const QuerySchema = z.object({
  role: z.enum(['admin', 'agent', 'client']).optional().openapi({
    description: 'filter by user role'
  })
})

// GET /
const getUserRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Users'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    query: QuerySchema
  },
  responses: {
    200: {
      description: 'fetch users success'
    }
  }
})

userRoutes.openapi(getUserRoute, async (c) => {
  const user = c.get('user')
  if (user.role !== 'admin') {
    return c.json({ success: false, message: 'Unauthorized' }, 403)
  }

  const { role } = c.req.valid('query')
  const users = await fetchUsersList(c.env.nihonthing_db, role)
  return c.json({ success: true, data: users }, 200)
})

// GET /me
const getMeRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Users'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  responses: {
    200: {
      description: 'Get my profile'
    }
  }
})

userRoutes.openapi(getMeRoute, async (c) => {
  const user = c.get('user')
  const profile = await getUserById(c.env.nihonthing_db, user.id)

  if (!profile) {
    return c.json({ success: false, message: 'User not found' }, 404)
  }

  return c.json({ success: true, data: profile }, 200)
})

const UpdateProfileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 chars').optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['other', 'male', 'female']).optional()
})

const putMeRoute = createRoute({
  method: 'put',
  path: '/me',
  tags: ['Users'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: UpdateProfileSchema } }
    }
  },
  responses: { 200: { description: 'Update Success' } }
})

userRoutes.openapi(putMeRoute, async (c) => {
  const user = c.get('user')
  const updateData = c.req.valid('json')
  try {
    await updateUserProfile(c.env.nihonthing_db, user.id, updateData)
    return c.json({ success: true, message: 'Update Success!' })
  } catch (error) {
    return c.json({ success: false, message: 'Update Failed!' }, 500)
  }
})

userRoutes.route('/me/addresses', addressRoutes)

export default userRoutes