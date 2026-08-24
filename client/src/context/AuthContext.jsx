import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'ss:auth'

// Demo institutional accounts. In production these come from the backend.
export const DEMO_ACCOUNTS = {
  citizen: { name: 'Rahul Sharma', org: 'Citizen (Ranchi)' },
  government: { name: 'Dept. of Higher & Technical Education', org: 'Government of Jharkhand' },
  university: { name: 'BIT Mesra', org: 'Innovation & Incubation Centre' },
  industry: { name: 'Tata Steel Foundation', org: 'CSR & Innovation' },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (role, credentials) => {
    const persist = (session) => {
      setUser(session)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)) } catch { /* ignore */ }
      return session
    }
    try {
      // Real backend session (signed JWT).
      return persist(await api.login(role, credentials))
    } catch (err) {
      // If server responded with an error (401, 400, 403, 500, etc.), surface the error!
      if (err?.status || api.isServerAvailable()) {
        throw err
      }
      // Truly offline (network fetch failed completely) -> local demo fallback
      const base = DEMO_ACCOUNTS[role] || { name: role, org: '' }
      return persist({ role, ...base, token: `demo-${role}`, demo: true })
    }
  }, [])

  const register = useCallback(async (userData) => {
    const persist = (session) => {
      setUser(session)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)) } catch { /* ignore */ }
      return session
    }
    try {
      return persist(await api.register(userData))
    } catch (err) {
      if (err?.status || api.isServerAvailable()) {
        throw err
      }
      // Offline / fallback session
      const session = {
        role: userData.role || 'citizen',
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        org: userData.org || (userData.role === 'citizen' ? 'Citizen' : ''),
        token: `user-${Date.now()}`,
        demo: false,
      }
      return persist(session)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('reports')
      localStorage.removeItem('outbox')
      localStorage.removeItem('votes')
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('myids')) localStorage.removeItem(key)
      })
    } catch { /* ignore */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
