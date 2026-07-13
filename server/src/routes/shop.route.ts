import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getAllShops, getShopById, createShop, updateShop, deleteShop } from '../models/shop.model'

const shopRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreateShopSchema = z.object({
  area_id: z.number(),
  name_th: z.string(),
  name_en: z.string(),
  name_jp: z.string().optional(),
  map_location: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional()
})

const UpdateShopSchema = CreateShopSchema.partial()

const ShopIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Shop ID' })
})

// GET /api/shops
const getShopsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Shops'],
  responses: { 200: { description: 'Retrieve all shops successfully' } }
})

shopRoutes.openapi(getShopsRoute, async (c) => {
  const shops = await getAllShops(c.env.nihonthing_db)
  return c.json({ success: true, data: shops })
})

// GET /api/shops/:id
const getShopByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Shops'],
  request: { params: ShopIdParamsSchema },
  responses: { 200: { description: 'Retrieve shop by ID successfully' } }
})

shopRoutes.openapi(getShopByIdRoute, async (c) => {
  const { id } = c.req.valid('param')
  const shop = await getShopById(c.env.nihonthing_db, parseInt(id))
  return c.json({ success: true, data: shop })
})

// POST /api/shops
const postShopRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Shops'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateShopSchema } } } },
  responses: { 201: { description: 'Shop created successfully' } }
})

shopRoutes.openapi(postShopRoute, async (c) => {
  const data = c.req.valid('json')
  const newShop = await createShop(c.env.nihonthing_db, data)
  return c.json({ success: true, data: [0] })
})

// PUT /api/shops/:id
const putShopRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Shops'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: ShopIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateShopSchema } } }
  },
  responses: { 200: { description: 'Shop updated successfully' } }
})

shopRoutes.openapi(putShopRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const updatedShop = await updateShop(c.env.nihonthing_db, parseInt(id), data)
  return c.json({ success: true, data: [0] })
})

export default shopRoutes
