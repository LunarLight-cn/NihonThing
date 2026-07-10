import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'

export type AuthVariables = {
  user: { id: number; role: string }
}

export const authGuard = async (c: Context<{ Bindings: any; Variables: AuthVariables }>, next: Next) => {
  const authHeader = c.req.header('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, message: 'Please login to access this feature.' }, 401)
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256')
    c.set('user', payload as { id: number; role: string })
    await next()
  } catch (error) {
    return c.json({ success: false, message: 'Invalid or expired token.' }, 401)
  }
}

export const adminGuard = async (c: Context<{ Bindings: any; Variables: AuthVariables }>, next: Next) => {
  const user = c.get('user')
  
  // Allow both admin and agent for now as requested
  if (!user || (user.role !== 'admin' && user.role !== 'agent')) {
    return c.json({ success: false, message: 'Admin or Agent access required.' }, 403)
  }
  
  await next()
}
