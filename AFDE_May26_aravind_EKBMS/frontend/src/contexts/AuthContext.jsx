import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('ekbms_token')
    const storedUser = localStorage.getItem('ekbms_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
        authAPI.getMe()
          .then(res => {
            setUser(res.data.data)
            localStorage.setItem('ekbms_user', JSON.stringify(res.data.data))
          })
          .catch(() => {
            localStorage.removeItem('ekbms_token')
            localStorage.removeItem('ekbms_user')
            setToken(null)
            setUser(null)
          })
          .finally(() => setLoading(false))
      } catch {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { user: userData, token: userToken } = res.data.data
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('ekbms_token', userToken)
    localStorage.setItem('ekbms_user', JSON.stringify(userData))
    return userData
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('ekbms_token')
    localStorage.removeItem('ekbms_user')
  }, [])

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('ekbms_user', JSON.stringify(updatedUser))
  }, [])

  const isAuthenticated = !!user && !!token

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
