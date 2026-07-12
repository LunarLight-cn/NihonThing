import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { fetchUsersList } from '../services/user.service'
import { authGuard, AuthVariables } from '../middlewares/auth.middleware'
import { updateUserProfile, getUserById, updateUserPassword, getUserPasswordHash, updateUserRole, deleteUser, updateUserStatus } from '../models/user.model'
import { hashPassword } from '../utils/hash'
import { adminGuard } from '../middlewares/auth.middleware'
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

const UpdatePasswordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(6, 'New password must be at least 6 chars')
})

const putPasswordRoute = createRoute({
  method: 'put',
  path: '/me/password',
  tags: ['Users'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: UpdatePasswordSchema } }
    }
  },
  responses: { 200: { description: 'Password Update Success' }, 400: { description: 'Invalid Current Password' } }
})

userRoutes.openapi(putPasswordRoute, async (c) => {
  const user = c.get('user')
  const { current_password, new_password } = c.req.valid('json')
  
  try {
    const currentHash = await getUserPasswordHash(c.env.nihonthing_db, user.id)
    if (!currentHash) return c.json({ success: false, message: 'User not found' }, 404)
    
    // Verify current password
    const hashedAttempt = await hashPassword(current_password, (c.env as any).AUTH_SALT)
    if (hashedAttempt !== currentHash) {
      return c.json({ success: false, message: 'Invalid current password' }, 400)
    }
    
    // Set new password
    const newHash = await hashPassword(new_password, (c.env as any).AUTH_SALT)
    await updateUserPassword(c.env.nihonthing_db, user.id, newHash)
    
    return c.json({ success: true, message: 'Password Updated Successfully!' })
  } catch (error) {
    return c.json({ success: false, message: 'Update Failed!' }, 500)
  }
})

userRoutes.route('/me/addresses', addressRoutes)

const UpdateRoleSchema = z.object({
  role: z.enum(['admin', 'customer', 'agent'])
})

const UserIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'User ID' })
})

const putRoleRoute = createRoute({
  method: 'put',
  path: '/{id}/role',
  tags: ['Users (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: UserIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateRoleSchema } } }
  },
  responses: { 200: { description: 'Role Updated' } }
})

userRoutes.openapi(putRoleRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { role } = c.req.valid('json')
  try {
    await updateUserRole(c.env.nihonthing_db, parseInt(id), role)
    return c.json({ success: true, message: 'Role Updated' })
  } catch (error) {
    return c.json({ success: false, message: 'Update Failed' }, 500)
  }
})

const UpdateStatusSchema = z.object({
  status: z.enum(['active', 'inactive'])
})

const putStatusRoute = createRoute({
  method: 'put',
  path: '/{id}/status',
  tags: ['Users (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: UserIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateStatusSchema } } }
  },
  responses: { 200: { description: 'Status Updated' } }
})

userRoutes.openapi(putStatusRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { status } = c.req.valid('json')
  try {
    await updateUserStatus(c.env.nihonthing_db, parseInt(id), status)
    return c.json({ success: true, message: 'Status Updated' })
  } catch (error) {
    return c.json({ success: false, message: 'Update Failed' }, 500)
  }
})

const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Users (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { params: UserIdParamsSchema },
  responses: { 200: { description: 'User Deleted' } }
})

userRoutes.openapi(deleteUserRoute, async (c) => {
  const { id } = c.req.valid('param')
  try {
    await deleteUser(c.env.nihonthing_db, parseInt(id))
    return c.json({ success: true, message: 'User Deleted' })
  } catch (error) {
    return c.json({ success: false, message: 'Delete Failed (May have related data)' }, 400)
  }
})

export default userRoutes