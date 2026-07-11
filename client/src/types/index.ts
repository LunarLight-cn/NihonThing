export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'customer' | string
  birth_date?: string
  gender?: string
}

export interface AuthResponse {
  success: boolean
  token: string
  user: User
}
