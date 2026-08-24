import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'ss:auth'

// Demo institutional accounts. In production these come from the backend.
export const DEMO_ACCOUNTS = {
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
    // Try the real backend; fall back to a local demo session if unavailable.
    let session = await api.login(role, credentials).catch(() => null)
    if (!session) {
      const base = DEMO_ACCOUNTS[role] || { name: role, org: '' }
      session = { role, ...base, token: `demo-${role}`, demo: true }
    }
    setUser(session)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(session)) } catch { /* ignore */ }
    return session
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
