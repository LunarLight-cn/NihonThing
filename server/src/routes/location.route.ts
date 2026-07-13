import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { getCountries, getProvinces, getDistricts, getSubdistricts } from '../models/location.model'

const locationRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database } }>()

const QuerySchema = z.object({
  parent_id: z.string().optional().openapi({ description: 'Filter by parent ID' })
})

// GET /api/locations/countries
const getCountriesRoute = createRoute({
  method: 'get',
  path: '/countries',
  tags: ['Locations'],
  responses: { 200: { description: 'Retrieve all countries successfully' } }
})

locationRoutes.openapi(getCountriesRoute, async (c) => {
  const countries = await getCountries(c.env.nihonthing_db)
  return c.json({ success: true, data: countries })
})

const CreateCountrySchema = z.object({
  name_en: z.string(),
  name_th: z.string(),
  name_jp: z.string().optional()
})

// POST /api/locations/countries
const postCountriesRoute = createRoute({
  method: 'post',
  path: '/countries',
  tags: ['Locations'],
  request: {
    body: { content: { 'application/json': { schema: CreateCountrySchema } } }
  },
  responses: { 201: { description: 'Create country successfully' } }
})

locationRoutes.openapi(postCountriesRoute, async (c) => {
  const data = c.req.valid('json')
  const { drizzle } = await import('drizzle-orm/d1')
  const schema = await import('../db/schema')
  const db = drizzle(c.env.nihonthing_db, { schema })
  const result = await db.insert(schema.Countries).values(data).returning()
  return c.json({ success: true, data: result[0] }, 201)
})

// GET /api/locations/provinces
const getProvincesRoute = createRoute({
  method: 'get',
  path: '/provinces',
  tags: ['Locations'],
  request: { query: QuerySchema },
  responses: { 200: { description: 'Retrieve provinces successfully' } }
})

locationRoutes.openapi(getProvincesRoute, async (c) => {
  const { parent_id } = c.req.valid('query')
  const provinces = await getProvinces(c.env.nihonthing_db, parent_id ? parseInt(parent_id) : undefined)
  return c.json({ success: true, data: provinces })
})

// GET /api/locations/districts
const getDistrictsRoute = createRoute({
  method: 'get',
  path: '/districts',
  tags: ['Locations'],
  request: { query: QuerySchema },
  responses: { 200: { description: 'Retrieve districts successfully' } }
})

locationRoutes.openapi(getDistrictsRoute, async (c) => {
  const { parent_id } = c.req.valid('query')
  const districts = await getDistricts(c.env.nihonthing_db, parent_id ? parseInt(parent_id) : undefined)
  return c.json({ success: true, data: districts })
})

// GET /api/locations/subdistricts
const getSubdistrictsRoute = createRoute({
  method: 'get',
  path: '/subdistricts',
  tags: ['Locations'],
  request: { query: QuerySchema },
  responses: { 200: { description: 'Retrieve subdistricts successfully' } }
})

locationRoutes.openapi(getSubdistrictsRoute, async (c) => {
  const { parent_id } = c.req.valid('query')
  const subdistricts = await getSubdistricts(c.env.nihonthing_db, parent_id ? parseInt(parent_id) : undefined)
  return c.json({ success: true, data: subdistricts })
})

export default locationRoutes
