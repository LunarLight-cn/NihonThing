import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'
import { adminGuard } from '../middlewares/auth.middleware'

const brandRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database } }>()

const BrandSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  name_en: z.string().openapi({ example: 'Sony' }),
  name_th: z.string().openapi({ example: 'โซนี่' }),
  name_jp: z.string().nullable().optional().openapi({ example: 'ソニー' }),
  status: z.enum(['active', 'inactive']).openapi({ example: 'active' })
})

const CreateBrandSchema = z.object({
  name_en: z.string(),
  name_th: z.string(),
  name_jp: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional().default('active')
})

// GET /brands
const getBrandsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Brands'],
  responses: {
    200: {
      description: 'Fetch all brands',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(BrandSchema)
          })
        }
      }
    }
  }
})

brandRoutes.openapi(getBrandsRoute, async (c) => {
  const db = drizzle(c.env.nihonthing_db, { schema })
  const brands = await db.query.Brands.findMany()
  return c.json({ success: true, data: brands }, 200)
})

// POST /brands
const createBrandRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Brands'],
  middleware: [adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: { 'application/json': { schema: CreateBrandSchema } }
    }
  },
  responses: {
    201: {
      description: 'Create a new brand'
    }
  }
})

brandRoutes.openapi(createBrandRoute, async (c) => {
  const data = c.req.valid('json')
  const db = drizzle(c.env.nihonthing_db, { schema })
  
  const result = await db.insert(schema.Brands).values(data).returning()
  return c.json({ success: true, data: result[0] }, 201)
})

// PUT /brands/:id
const updateBrandRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Brands'],
  middleware: [adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: { 'application/json': { schema: CreateBrandSchema.partial() } }
    }
  },
  responses: {
    200: {
      description: 'Update a brand'
    }
  }
})

brandRoutes.openapi(updateBrandRoute, async (c) => {
  const id = parseInt(c.req.param('id'))
  const data = c.req.valid('json')
  const db = drizzle(c.env.nihonthing_db, { schema })
  
  const result = await db.update(schema.Brands).set(data).where(eq(schema.Brands.id, id)).returning()
  return c.json({ success: true, data: result[0] }, 200)
})

// DELETE /brands/:id
const deleteBrandRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Brands'],
  middleware: [adminGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    200: {
      description: 'Delete a brand'
    }
  }
})

brandRoutes.openapi(deleteBrandRoute, async (c) => {
  const id = parseInt(c.req.param('id'))
  const db = drizzle(c.env.nihonthing_db, { schema })
  
  await db.delete(schema.Brands).where(eq(schema.Brands.id, id))
  return c.json({ success: true, message: 'Brand deleted' }, 200)
})

export default brandRoutes
