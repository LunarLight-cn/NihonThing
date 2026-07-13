import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { setCookie, deleteCookie } from 'hono/cookie'
import { registerUser, loginUser } from '../services/auth.service'

const authRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database; JWT_SECRET: string; AUTH_SALT: string } }>()

// Login Zone
const LoginSchema = z.object({
  identifier: z.string().min(1, 'Username or Email is required'),
  password: z.string().min(6)
})

const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginSchema
        }
      }
    }
  },
  responses: {
    200: {
      description: 'Login Status'
    }
  }
})

authRoutes.openapi(loginRoute, async (c) => {
  const { identifier, password } = c.req.valid('json')

  try {
    const { token, user } = await loginUser(c.env.nihonthing_db, identifier, password, c.env.JWT_SECRET, c.env.AUTH_SALT)
    
    const isProduction = new URL(c.req.url).protocol === 'https:'
    
    // Set HttpOnly cookie
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return c.json({ success: true, data: { token, user } })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 401)
  }
})

// Logout Zone
const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  tags: ['Auth'],
  responses: {
    200: { description: 'Logout Success' }
  }
})

authRoutes.openapi(logoutRoute, async (c) => {
  const isProduction = new URL(c.req.url).protocol === 'https:'
  deleteCookie(c, 'token', { 
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax'
  })
  return c.json({ success: true, message: 'Logged out successfully' })
})

// Register Zone
const RegisterSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 chars'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 chars')
})

const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Auth'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterSchema
        }
      }
    }
  },
  responses: {
    201: {
      description: 'Registration Success'
    },
    400: {
      description: 'Invalid Data or Email already exists'
    }
  }
})

authRoutes.openapi(registerRoute, async (c) => {
  const { username, email, password } = c.req.valid('json')

  try {
    await registerUser(c.env.nihonthing_db, username, email, password, c.env.AUTH_SALT)

    return c.json({ success: true, message: 'Registration Success'}, 201)
  } catch (error: any) {
    return c.json({ success: false, message: 'Invalid Data or Email already exists'}, 400)
  }
})
export default authRoutes
