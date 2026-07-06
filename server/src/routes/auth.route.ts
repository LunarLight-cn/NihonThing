import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { registerUser, loginUser } from '../services/auth.service'

const authRoutes = new OpenAPIHono<{ Bindings: { nihonthing_db: D1Database; JWT_SECRET: string; AUTH_SALT: string } }>()

// Login Zone
const LoginSchema = z.object({
  email: z.string().email(),
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
  const { email, password } = c.req.valid('json')

  try {
    const token = await loginUser(c.env.nihonthing_db, email, password, c.env.JWT_SECRET, c.env.AUTH_SALT)
    return c.json({ success: true, token })
  } catch (error: any) {
    return c.json({ success: false, message: error.message }, 401)
  }
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
