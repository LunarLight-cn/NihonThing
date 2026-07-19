import { cors } from 'hono/cors'
import type { Context, Next } from 'hono'

/**
 * CORS middleware.
 *
 * Allows the production frontend (FRONTEND_URL), localhost dev, and every
 * Cloudflare Pages *preview* subdomain of the same project
 * (e.g. https://431816c3.nihonthing.pages.dev). Preview URLs use random
 * hashes so they can't be enumerated — the pattern is derived from
 * FRONTEND_URL's host, nothing hard-coded. credentials:true forbids '*',
 * so the exact request origin is reflected back.
 */
const isAllowedOrigin = (c: Context, origin: string): boolean => {
  const frontendUrl: string = c.env?.FRONTEND_URL || 'http://localhost:5173'
  if (origin === frontendUrl || origin === 'http://localhost:5173') return true
  // The worker's own origin, for the Swagger UI served from /ui.
  try {
    if (origin === new URL(c.req.url).origin) return true
  } catch { /* ignore */ }
  try {
    const host = new URL(frontendUrl).host // e.g. nihonthing.pages.dev
    if (host.endsWith('.pages.dev')) {
      return new RegExp(`^https://[a-z0-9-]+\\.${host.replace(/\./g, '\\.')}$`).test(origin)
    }
  } catch { /* FRONTEND_URL not a URL (localhost fallback) - skip */ }
  return false
}

export const corsMiddleware = (c: Context, next: Next) => {
  return cors({
    origin: (origin) => {
      if (!origin) return undefined
      return isAllowedOrigin(c, origin) ? origin : undefined
    },
    credentials: true
  })(c, next)
}

/**
 * CSRF guard. CORS only stops a hostile page from READING responses - a
 * cross-site multipart form still fires with the victim's cookie attached
 * (SameSite=None is required for the pages.dev <-> workers.dev split). Any
 * state-changing request that carries a browser Origin we don't recognise is
 * rejected outright. Requests without an Origin (curl, server-to-server, most
 * same-origin tools) pass through and are still subject to auth.
 */
export const originGuard = async (c: Context, next: Next) => {
  const method = c.req.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next()
  const origin = c.req.header('Origin')
  if (!origin || isAllowedOrigin(c, origin)) return next()
  return c.json({ success: false, message: 'Cross-origin request rejected.' }, 403)
}
