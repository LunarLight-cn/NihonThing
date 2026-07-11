import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../models/product.model'

const productRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database; EXCHANGE_RATE_JPY_THB: string }; Variables: AuthVariables }>()

// Schema for Creating a Product
const CreateProductSchema = z.object({
  category_id: z.number().optional(),
  name: z.string().min(1, 'Product name is required'),
  name_th: z.string().optional(),
  name_jp: z.string().optional(),
  desc: z.string().optional(),
  brand: z.string().optional(),
  origin_country: z.string().optional(),
  price_tentative_jpy: z.number().optional(),
  img: z.string().url('Must be a valid image URL').optional(),
  tag: z.string().optional(),
  amount: z.number().optional(),
  remain: z.number().optional(),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional()
})

// Schema for Updating a Product (all fields optional)
const UpdateProductSchema = CreateProductSchema.partial()

const ProductIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Product ID' })
})

const ProductQuerySchema = z.object({
  category_id: z.coerce.number().optional(),
  brand: z.string().optional(),
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
    price_tentative_thb: data.price_tentative_jpy ? data.price_tentative_jpy * exchangeRate : undefined
  }
  
  const newProduct = await createProduct(c.env.nihonthing_db, payload)
  return c.json({ success: true, data: newProduct }, 201)
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
    price_tentative_thb: data.price_tentative_jpy ? data.price_tentative_jpy * exchangeRate : undefined
  }
  
  const updatedProduct = await updateProduct(c.env.nihonthing_db, parseInt(id), payload)
  return c.json({ success: true, data: updatedProduct })
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
