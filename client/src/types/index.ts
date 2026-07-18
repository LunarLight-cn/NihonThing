// Must match the role enum in the server's Drizzle schema.
export type UserRole = 'admin' | 'agent' | 'client'

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  birth_date?: string
  gender?: string
}

export interface AuthResponse {
  success: boolean
  token: string
  user: User
}
