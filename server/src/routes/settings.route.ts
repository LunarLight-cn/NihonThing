import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, adminGuard, AuthVariables } from '../middlewares/auth.middleware'
import { getSettings, updateSettings } from '../models/settings.model'

const settingsRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database }; Variables: AuthVariables }>()

const UpdateSettingsSchema = z.object({
  per_user_item_limit: z.number().int().min(1).optional(),
  trip_cutoff_days: z.number().int().min(0).optional(),
  weight_tolerance_kg: z.number().min(0).optional(),
  price_tolerance_thb: z.number().min(0).optional(),
  unpaid_move_days: z.number().int().min(0).optional(),
  overdue_cancel_days: z.number().int().min(0).optional(),
  exchange_rate_jpy_thb: z.number().positive().optional()
})

// GET /api/settings - Admin only
const getSettingsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Settings (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  responses: { 200: { description: 'Retrieve global settings successfully' } }
})

settingsRoutes.openapi(getSettingsRoute, async (c) => {
  const settings = await getSettings(c.env.nihonthing_db)
  return c.json({ success: true, data: settings })
})

// PUT /api/settings - Admin only
const putSettingsRoute = createRoute({
  method: 'put',
  path: '/',
  tags: ['Settings (Admin)'],
  middleware: [authGuard, adminGuard] as const,
  security: [{ Bearer: [] }],
  request: { body: { content: { 'application/json': { schema: UpdateSettingsSchema } } } },
  responses: { 200: { description: 'Settings updated successfully' } }
})

settingsRoutes.openapi(putSettingsRoute, async (c) => {
  const data = c.req.valid('json')
  const settings = await updateSettings(c.env.nihonthing_db, data)
  return c.json({ success: true, data: settings })
})

export default settingsRoutes
