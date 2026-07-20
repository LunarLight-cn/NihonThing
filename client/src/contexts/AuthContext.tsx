import React, { createContext, useContext, useState, useEffect } from 'react'
import type { User } from '../types'
import { api } from '../services/api'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  // Restore from storage so a page refresh doesn't leave token null - callers
  // like the profile form re-login with the current token and would otherwise
  // overwrite the stored one with an empty string.
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await api.get('/users/me')
        if (response.data.success) {
          setUser(response.data.data)
        } else {
          // Token might be invalid
          logout()
        }
      } catch {
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    fetchMe()

    // api.ts fires this when any request comes back 401 - the session is dead,
    // so drop the local state instead of showing a logged-in UI that fails.
    const onUnauthorized = () => {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [])

  const login = (newToken: string, newUser: User) => {
    if (newToken) {
      localStorage.setItem('token', newToken)
      setToken(newToken)
    }
    setUser(newUser)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
