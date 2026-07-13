import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getAddresses, createAddress, deleteAddress, updateAddress } from '../models/address.model'

const addressRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()


const CreateAddressSchema = z.object({
  title: z.string().optional(),
  fullname: z.string().min(1, 'Fullname is required'),
  surname: z.string().min(1, 'Surname is required'),
  tel: z.string().min(9, 'Tel is required'),
  address_line: z.string().min(5, 'Address is required'),
  subdistrict_id: z.number(),
  tag: z.string().optional()
})

// Get All Address
const getMyAddressesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Addresses'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Addresses retrieved successfully' } }
})

addressRoutes.openapi(getMyAddressesRoute, async (c) => {
  const user = c.get('user')
  const addresses = await getAddresses(c.env.nihonthing_db, user.id)
  return c.json({ success: true, data: addresses })
})

// Create New Address
const postAddressRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Addresses'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateAddressSchema } } } },
  responses: { 201: { description: 'Address created' } }
})

addressRoutes.openapi(postAddressRoute, async (c) => {
  const user = c.get('user')
  const data = c.req.valid('json')
  const newAddress = await createAddress(c.env.nihonthing_db, user.id, data)
  return c.json({ success: true, data: [0] })
})

const DeleteAddressParamsSchema = z.object({
  id: z.string().openapi({ description: 'Address ID for deletion' })
})

// Delete Address
const deleteAddressRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Addresses'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: DeleteAddressParamsSchema
  },
  responses: { 200: { description: 'Address deleted' } }
})

addressRoutes.openapi(deleteAddressRoute, async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')
  await deleteAddress(c.env.nihonthing_db, user.id, parseInt(id))
  return c.json({ success: true, message: `Address ${id} deleted.` })
})

const UpdateAddressSchema = z.object({
  title: z.string().optional(),
  fullname: z.string().optional(),
  surname: z.string().optional(),
  tel: z.string().optional(),
  address_line: z.string().optional(),
  subdistrict_id: z.number().optional(),
  tag: z.string().optional()
})

const UpdateAddressParamsSchema = z.object({
  id: z.string().openapi({ description: 'Address ID for update' })
})

// Update Address
const putAddressRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Addresses'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: UpdateAddressParamsSchema,
    body: { content: { 'application/json': { schema: UpdateAddressSchema } } }
  },
  responses: { 200: { description: 'Address updated successfully' } }
})

addressRoutes.openapi(putAddressRoute, async (c) => {
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')

  const updatedAddress = await updateAddress(c.env.nihonthing_db, user.id, parseInt(id), data)

  return c.json({ success: true, data: [0] })
})

export default addressRoutes
