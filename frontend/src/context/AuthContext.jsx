import React, { createContext, useState, useEffect } from 'react'
import API from '../services/api'

export const AuthContext = createContext()

export function AuthProvider({children}){
  const [user, setUser] = useState(null)

  const fetchCurrentUser = async () => {
    try {
      const response = await API.get('auth/me/')
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('access')
      localStorage.removeItem('refresh')
      setUser(null)
    }
  }

  useEffect(() => {
    if (localStorage.getItem('access') || localStorage.getItem('refresh')) {
      fetchCurrentUser()
    }
  }, [])

  const login = async (username, password) => {
    const res = await API.post('auth/login/', {username, password})
    localStorage.setItem('access', res.data.access)
    localStorage.setItem('refresh', res.data.refresh)
    API.defaults.headers.common.Authorization = `Bearer ${res.data.access}`
    await fetchCurrentUser()
  }

  const logout = async () => {
    const refresh = localStorage.getItem('refresh')
    if (refresh) {
      try {
        await API.post('auth/logout/', { refresh })
      } catch (error) {
        // ignore logout errors and clear local state anyway
      }
    }
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    delete API.defaults.headers.common.Authorization
    setUser(null)
  }

  return <AuthContext.Provider value={{user, login, logout}}>{children}</AuthContext.Provider>
}
