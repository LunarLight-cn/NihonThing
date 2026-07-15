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
export const corsMiddleware = (c: Context, next: Next) => {
  const frontendUrl: string = c.env?.FRONTEND_URL || 'http://localhost:5173'
  const allowList = new Set([frontendUrl, 'http://localhost:5173'])

  let previewPattern: RegExp | null = null
  try {
    const host = new URL(frontendUrl).host // e.g. nihonthing.pages.dev
    if (host.endsWith('.pages.dev')) {
      previewPattern = new RegExp(`^https://[a-z0-9-]+\\.${host.replace(/\./g, '\\.')}$`)
    }
  } catch { /* FRONTEND_URL not a URL (localhost fallback) — skip */ }

  return cors({
    origin: (origin) => {
      if (!origin) return undefined
      if (allowList.has(origin)) return origin
      if (previewPattern?.test(origin)) return origin
      return undefined // not allowed
    },
    credentials: true
  })(c, next)
}
