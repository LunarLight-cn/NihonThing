/**
 * Resolves a stored image path to a fully-qualified URL.
 *
 * Uploaded images are stored as relative Worker paths like
 * `/api/uploads/products%2F...jpg` (see server upload.route.ts). Those must be
 * prefixed with the API origin, otherwise the browser resolves them against the
 * frontend origin and gets the SPA index.html back. Full URLs (http/blob/data)
 * are returned untouched.
 */
export const getImageUrl = (img?: string | null): string => {
  if (!img) return ''
  if (/^(https?:|blob:|data:)/.test(img)) return img
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '')
  return `${base}${img.startsWith('/') ? '' : '/'}${img}`
}
