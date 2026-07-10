import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, AuthVariables } from '../middlewares/auth.middleware'

const uploadRoutes = new OpenAPIHono<{ Bindings: { nihonthing_bucket: R2Bucket }; Variables: AuthVariables }>()

// POST /api/uploads
const postUploadRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Uploads'],
  middleware: [authGuard] as const,
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.instanceof(File).openapi({
              type: 'string',
              format: 'binary',
              description: 'Image file to upload'
            })
          })
        }
      }
    }
  },
  responses: { 201: { description: 'File uploaded successfully' }, 400: { description: 'Bad Request' } }
})

uploadRoutes.openapi(postUploadRoute, async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']
  
  if (!(file instanceof File)) {
    return c.json({ success: false, message: 'Invalid file upload' }, 400)
  }

  const ext = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${ext}`
  
  await c.env.nihonthing_bucket.put(fileName, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  })
  
  // Return the URL that can be used to access this file via the worker itself
  const fileUrl = `/api/uploads/${fileName}`
  
  return c.json({ success: true, url: fileUrl }, 201)
})

// GET /api/uploads/:filename
const getUploadRoute = createRoute({
  method: 'get',
  path: '/{filename}',
  tags: ['Uploads'],
  request: {
    params: z.object({
      filename: z.string().openapi({ description: 'File name' })
    })
  },
  responses: { 200: { description: 'File content' }, 404: { description: 'File not found' } }
})

uploadRoutes.openapi(getUploadRoute, async (c) => {
  const { filename } = c.req.valid('param')
  const object = await c.env.nihonthing_bucket.get(filename)
  
  if (!object) {
    return c.text('Not Found', 404)
  }
  
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  
  return new Response(object.body, { headers })
})

export default uploadRoutes
