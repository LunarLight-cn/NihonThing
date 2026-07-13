import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authGuard, AuthVariables } from '../middlewares/auth.middleware'
import { verifyMagicBytes } from '../utils/file'

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

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

uploadRoutes.openapi(postUploadRoute, async (c) => {
  const body = await c.req.parseBody()
  const file = body['file'] as any
  
  if (!file || typeof file === 'string' || !file.name || typeof file.arrayBuffer !== 'function') {
    return c.json({ success: false, message: 'Invalid file upload' }, 400)
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return c.json({ success: false, message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` }, 400)
  }

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ success: false, message: `Invalid file type "${file.type}". Allowed: ${ALLOWED_TYPES.join(', ')}` }, 400)
  }

  // Validate file extension
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return c.json({ success: false, message: `Invalid file extension ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` }, 400)
  }

  // Handle dynamic folders
  let prefix = ''
  const folder = body['folder'] as string
  if (folder) {
    if (folder.startsWith('products/')) {
      prefix = `${folder}/`
    } else if (folder.startsWith('slips/purchase')) {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      prefix = `slips/purchase/${y}/${m}/`
    } else if (folder.startsWith('slips/customer')) {
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      prefix = `slips/customer/${y}/${m}/`
    } else {
      prefix = `${folder}/`
    }
  }

  // Build filename with DDMMYYYY if requested for specific folders
  let finalFileName = `${crypto.randomUUID()}.${ext}`
  if (prefix.startsWith('products/') || prefix.startsWith('slips/')) {
    const now = new Date()
    const d = String(now.getDate()).padStart(2, '0')
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const y = now.getFullYear()
    finalFileName = `${d}${m}${y}_${finalFileName}`
  }

  const objectKey = `${prefix}${finalFileName}`
  
  const arrayBuffer = await file.arrayBuffer()
  if (!verifyMagicBytes(arrayBuffer)) {
    return c.json({ success: false, message: 'Invalid file content. The file appears to be corrupted or disguised.' }, 400)
  }
  
  await c.env.nihonthing_bucket.put(objectKey, arrayBuffer, {
    httpMetadata: { contentType: file.type }
  })
  
  // Return the URL that can be used to access this file via the worker itself
  const fileUrl = `/api/uploads/${encodeURIComponent(objectKey)}`
  
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
  const objectKey = decodeURIComponent(filename)
  const object = await c.env.nihonthing_bucket.get(objectKey)
  
  if (!object) {
    return c.text('Not Found', 404)
  }
  
  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  
  return new Response(object.body, { headers })
})

export default uploadRoutes
