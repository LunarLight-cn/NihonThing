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
  const [token, setToken] = useState<string | null>(null)
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
      } catch (error) {
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    fetchMe()
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      // ignore
    }
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
