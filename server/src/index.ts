import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import userRoutes from './routes/user.route'
import authRoutes from './routes/auth.route'

const app = new OpenAPIHono()

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT'
})
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'NihonThing API'
  }
})

app.get('/ui', swaggerUI({ url: '/doc' }))
app.route('/api/users', userRoutes)
app.route('/api/auth', authRoutes)

export default app
