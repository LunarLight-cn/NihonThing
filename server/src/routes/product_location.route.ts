import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getProductLocations, createProductLocation, deleteProductLocation } from '../models/product_location.model'

const productLocationRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreateProductLocationSchema = z.object({
  product_id: z.number(),
  area_id: z.number(),
  shop_id: z.number().optional()
})

const ProductLocationIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Location Mapping ID' })
})

const ProductIdParamsSchema = z.object({
  productId: z.string().openapi({ description: 'Product ID' })
})

// GET /api/product-locations/product/:productId
const getLocationsRoute = createRoute({
  method: 'get',
  path: '/product/{productId}',
  tags: ['Product Locations'],
  request: { params: ProductIdParamsSchema },
  responses: { 200: { description: 'Retrieve locations for product' } }
})

productLocationRoutes.openapi(getLocationsRoute, async (c) => {
  const { productId } = c.req.valid('param')
  const locations = await getProductLocations(c.env.nihonthing_db, parseInt(productId))
  return c.json({ success: true, data: locations })
})

// POST /api/product-locations
const postLocationRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Product Locations (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateProductLocationSchema } } } },
  responses: { 201: { description: 'Mapping created successfully' } }
})

productLocationRoutes.openapi(postLocationRoute, async (c) => {
  const data = c.req.valid('json')
  const newMapping = await createProductLocation(c.env.nihonthing_db, data)
  return c.json({ success: true, data: newMapping[0] })
})

// DELETE /api/product-locations/:id
const deleteLocationRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Product Locations (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { params: ProductLocationIdParamsSchema },
  responses: { 200: { description: 'Mapping deleted successfully' } }
})

productLocationRoutes.openapi(deleteLocationRoute, async (c) => {
  const { id } = c.req.valid('param')
  const deletedMapping = await deleteProductLocation(c.env.nihonthing_db, parseInt(id))
  return c.json({ success: true, data: deletedMapping[0] })
})

export default productLocationRoutes
