import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { getCookie } from 'hono/cookie'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../db/schema'

export type AuthVariables = {
  user: { id: number; role: string }
}

export const authGuard = async (c: Context<{ Bindings: any; Variables: AuthVariables }>, next: Next) => {
  const authHeader = c.req.header('Authorization')
  let token = getCookie(c, 'token')

  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  }

  if (!token) {
    return c.json({ success: false, message: 'Please login to access this feature.' }, 401)
  }

  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256') as { id: number; role: string }
    
    // Check if account is still active
    const db = drizzle(c.env.nihonthing_db, { schema })
    const dbUser = await db.query.Users.findFirst({
      where: eq(schema.Users.id, payload.id)
    })

    if (!dbUser || dbUser.status === 'inactive') {
      return c.json({ success: false, message: 'Your account has been deactivated.' }, 401)
    }

    c.set('user', { id: dbUser.id, role: dbUser.role || 'client' })
    await next()
  } catch (error) {
    return c.json({ success: false, message: 'Invalid or expired token.' }, 401)
  }
}

export const adminGuard = async (c: Context<{ Bindings: any; Variables: AuthVariables }>, next: Next) => {
  const user = c.get('user')
  
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, message: 'Admin access required.' }, 403)
  }
  
  await next()
}
