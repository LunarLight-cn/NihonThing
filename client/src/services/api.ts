import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A 401 anywhere (outside the login call itself) means the session is dead -
// tell AuthContext so the UI flips to logged-out instead of failing silently.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    const url: string = error.config?.url || ''
    if (status === 401 && !url.includes('/auth/')) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

// GET /products is paginated (default limit 20); walk every page so catalog
// pages that filter client-side see the whole store.
export const fetchAllProducts = async <T = unknown>(params: Record<string, unknown> = {}): Promise<T[]> => {
  const all: T[] = []
  let page = 1
  let totalPages = 1
  do {
    const res = await api.get('/products', { params: { ...params, page, limit: 100 } })
    all.push(...res.data.data)
    totalPages = res.data.meta?.totalPages ?? 1
    page++
  } while (page <= totalPages)
  return all
}
