import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, roleGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../models/category.model'

const categoryRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const CreateCategorySchema = z.object({
  name_th: z.string(),
  name_en: z.string(),
  name_jp: z.string().optional()
})

const UpdateCategorySchema = CreateCategorySchema.partial()

const CategoryIdParamsSchema = z.object({
  id: z.string().openapi({ description: 'Category ID' })
})

// GET /api/categories
const getCategoriesRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Categories'],
  responses: { 200: { description: 'Retrieve all categories successfully' } }
})

categoryRoutes.openapi(getCategoriesRoute, async (c) => {
  const categories = await getAllCategories(c.env.nihonthing_db)
  return c.json({ success: true, data: categories })
})

// POST /api/categories
const postCategoryRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Categories (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: CreateCategorySchema } } } },
  responses: { 201: { description: 'Category created successfully' } }
})

categoryRoutes.openapi(postCategoryRoute, async (c) => {
  const data = c.req.valid('json')
  const newCategory = await createCategory(c.env.nihonthing_db, data)
  return c.json({ success: true, data: newCategory[0] })
})

// PUT /api/categories/:id
const putCategoryRoute = createRoute({
  method: 'put',
  path: '/{id}',
  tags: ['Categories (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  request: {
    params: CategoryIdParamsSchema,
    body: { content: { 'application/json': { schema: UpdateCategorySchema } } }
  },
  responses: { 200: { description: 'Category updated successfully' } }
})

categoryRoutes.openapi(putCategoryRoute, async (c) => {
  const { id } = c.req.valid('param')
  const data = c.req.valid('json')
  const updatedCategory = await updateCategory(c.env.nihonthing_db, parseInt(id), data)
  return c.json({ success: true, data: updatedCategory[0] })
})

// DELETE /api/categories/:id
const deleteCategoryRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Categories (Admin)'],
  middleware: [authGuard, roleGuard('agent')] as const,
  security: [{ Bearer: [] }],
  request: { params: CategoryIdParamsSchema },
  responses: { 200: { description: 'Category deleted successfully' } }
})

categoryRoutes.openapi(deleteCategoryRoute, async (c) => {
  const { id } = c.req.valid('param')
  const deletedCategory = await deleteCategory(c.env.nihonthing_db, parseInt(id))
  return c.json({ success: true, data: deletedCategory[0] })
})

export default categoryRoutes
