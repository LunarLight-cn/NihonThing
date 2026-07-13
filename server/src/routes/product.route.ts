import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getNewArrivals, getTrendingProducts } from '../models/product.model'

const productRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database; EXCHANGE_RATE_JPY_THB: string }; Variables: AuthVariables }>()

// Schema for Creating a Product
const CreateProductSchema = z.object({
  category_id: z.number().optional(),
  name_en: z.string().min(1, 'Product name is required'),
  name_th: z.string().optional(),
  name_jp: z.string().optional(),
  desc_en: z.string().optional(),
  desc_th: z.string().optional(),
  desc_jp: z.string().optional(),
  brand_id: z.number().optional(),
  origin_country_id: z.number().optional(),
  price_tentative_jpy: z.number().optional(),
  price_tentative_thb: z.number().optional(),
  img: z.array(z.string()).optional(),
  tag: z.string().optional(),
  weight: z.number().optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional()
})

// Schema for Updating a Product (all fields optional)
const UpdateProductSchema = CreateProductSchema.partial()

const ProductIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Product ID' })
})

const ProductQuerySchema = z.object({
  category_id: z.coerce.number().optional(),
  brand_id: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

// GET ญroducts
const getProductsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Products'],
  request: { query: ProductQuerySchema },
  responses: { 200: { description: 'Retrieve all products successfully' } }
})

productRoutes.openapi(getProductsRoute, async (c) => {
  const query = c.req.valid('query')
  const result = await getAllProducts(c.env.nihonthing_db, query)
  return c.json({ success: true, ...result })
})

// GET New Arrivals
const getNewArrivalsRoute = createRoute({
  method: 'get',
  path: '/new-arrivals',
  tags: ['Products'],
  responses: { 200: { description: 'Retrieve new arrival products successfully' } }
})

productRoutes.openapi(getNewArrivalsRoute, async (c) => {
  const result = await getNewArrivals(c.env.nihonthing_db, 6)
  return c.json({ success: true, data: result })
})

// GET Trending Products
const getTrendingRoute = createRoute({
  method: 'get',
  path: '/trending',
  tags: ['Products'],
  request: { query: z.object({ area_id: z.coerce.number().optional() }) },
  responses: { 200: { description: 'Retrieve trending products successfully' } }
})

productRoutes.openapi(getTrendingRoute, async (c) => {
  const query = c.req.valid('query')
  const result = await getTrendingProducts(c.env.nihonthing_db, 4, query.area_id)
  c.header('Cache-Control', 'public, max-age=3600')
  return c.json({ success: true, data: result })
})

// GET Products by ID
const getSingleProductRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Products'],
  request: { params: ProductIdParamsSchema },
  responses: {
    200: { description: 'Retrieve single product successfully' },
    404: { description: 'Product not found' }
  }
})

productRoutes.openapi(getSingleProductRoute, async (c) => {
  const { id } = c.req.valid('param')
  const product = await getProductById(c.env.nihonthing_db, parseInt(id))
  
  if (!product) {
    return c.json({ success: false, message: 'Product not found' }, 404)
  }
  return c.json({ success: true, data: product })
})

// POST Products
const postProductRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Products (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateProductSchema } } } },
  responses: { 201: { description: 'Product created successfully' } }
})

productRoutes.openapi(postProductRoute, async (c) => {
  const data = c.req.valid('json')
  const exchangeRate = parseFloat(c.env.EXCHANGE_RATE_JPY_THB) || 0.25
  
  const payload = {
    ...data,
    price_tentative_thb: data.price_tentative_thb !== undefined ? data.price_tentative_thb : (data.price_tentative_jpy ? data.price_tentative_jpy * exchangeRate : undefined)
  }
  
  const newProduct = await createProduct(c.env.nihonthing_db, payload)
  return c.json({ success: true, data: newProduct[0] }, 201)
})

// PUT Products
const putProductRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Products (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: ProductIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateProductSchema } } }
  },
  responses: { 200: { description: 'Product updated successfully' } }
})

productRoutes.openapi(putProductRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const exchangeRate = parseFloat(c.env.EXCHANGE_RATE_JPY_THB) || 0.25
  
  const payload = {
    ...data,
    price_tentative_thb: data.price_tentative_thb !== undefined ? data.price_tentative_thb : (data.price_tentative_jpy ? data.price_tentative_jpy * exchangeRate : undefined)
  }
  
  const productId = parseInt(id)
  
  // Check if name changed to log history
  if (data.name_en) {
    const oldProduct = await getProductById(c.env.nihonthing_db, productId)
    if (oldProduct && oldProduct.name_en !== data.name_en) {
      const { drizzle } = await import('drizzle-orm/d1')
      const schema = await import('../db/schema')
      const db = drizzle(c.env.nihonthing_db, { schema })
      await db.insert(schema.Product_Name_History).values({
        product_id: productId,
        old_name: oldProduct.name_en,
        new_name: data.name_en
      })
    }
  }

  const updatedProduct = await updateProduct(c.env.nihonthing_db, productId, payload)
  return c.json({ success: true, data: updatedProduct[0] })
})

// DELETE Products
const deleteProductRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Products (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { params: ProductIdParamsSchema },
  responses: { 200: { description: 'Product deleted successfully' } }
})

productRoutes.openapi(deleteProductRoute, async (c) => {
  const { id } = c.req.valid('param')
  await deleteProduct(c.env.nihonthing_db, parseInt(id))
  return c.json({ success: true, message: `Product ${id} deleted.` })
})

export default productRoutes
