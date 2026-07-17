import { OpenAPIHono } from '@hono/zod-openapi'
import { swaggerUI } from '@hono/swagger-ui'
import { corsMiddleware } from './middlewares/cors'
import userRoutes from './routes/user.route'
import authRoutes from './routes/auth.route'
import productRoutes from './routes/product.route'
import ticketRoutes from './routes/ticket.route'
import paymentRoutes from './routes/payment.route'
import orderRoutes from './routes/order.route'
import areaRoutes from './routes/area.route'
import eventRoutes from './routes/event.route'
import shipRoutes from './routes/ship.route'
import purchaseRoutes from './routes/purchase.route'
import shopRoutes from './routes/shop.route'
import productLocationRoutes from './routes/product_location.route'
import eventProductRoutes from './routes/event_product.route'
import followRoutes from './routes/follow.route'
import categoryRoutes from './routes/category.route'
import locationRoutes from './routes/location.route'
import uploadRoutes from './routes/upload.route'
import brandRoutes from './routes/brand.route'
import settingsRoutes from './routes/settings.route'

const app = new OpenAPIHono()

app.use('*', corsMiddleware)

app.onError((err, c) => {
  console.error('[Global Error]', err)
  // Check if it's a validation error (Zod) which is safe to return
  if (err.name === 'ZodError' || (err as any).status === 400) {
    return c.json({ success: false, message: err.message }, 400)
  }
  // A bad reference is the caller's mistake, not a server fault, and "Internal
  // Server Error" gives them nothing to act on.
  if (err.message?.includes('FOREIGN KEY constraint failed')) {
    return c.json({ success: false, message: 'That request points at a record that does not exist.' }, 400)
  }
  if (err.message?.includes('UNIQUE constraint failed')) {
    return c.json({ success: false, message: 'That value is already taken.' }, 409)
  }
  return c.json({ success: false, message: 'Internal Server Error' }, 500)
})
app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT'
})
// Routes will be mounted here
app.route('/api/users', userRoutes)
app.route('/api/auth', authRoutes)
app.route('/api/products', productRoutes)
app.route('/api/tickets', ticketRoutes)
app.route('/api/payments', paymentRoutes)
app.route('/api/orders', orderRoutes)
app.route('/api/ships', shipRoutes)
app.route('/api/areas', areaRoutes)
app.route('/api/events', eventRoutes)
app.route('/api/purchases', purchaseRoutes)
app.route('/api/shops', shopRoutes)
app.route('/api/product-locations', productLocationRoutes)
app.route('/api/event-products', eventProductRoutes)
app.route('/api/follows', followRoutes)
app.route('/api/categories', categoryRoutes)
app.route('/api/locations', locationRoutes)
app.route('/api/uploads', uploadRoutes)
app.route('/api/brands', brandRoutes)
app.route('/api/settings', settingsRoutes)

app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'NihonThing API',
    description: 'NihonThing Pre-order Platform API Documentation'
  }
})

app.get('/ui', swaggerUI({ url: '/doc' }))

export default app
