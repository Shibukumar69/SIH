import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NetworkContext = createContext(null)

export function NetworkProvider({ children }) {
  const [rawOnline, setRawOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  // Demo switch: lets a presenter show the "weak network / save offline" flow
  // on stage without actually disabling Wi-Fi.
  const [simulateOffline, setSimulateOffline] = useState(false)

  useEffect(() => {
    const on = () => setRawOnline(true)
    const off = () => setRawOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const online = rawOnline && !simulateOffline

  const toggleSimulateOffline = useCallback(() => setSimulateOffline((v) => !v), [])

  return (
    <NetworkContext.Provider
      value={{ online, rawOnline, simulateOffline, setSimulateOffline, toggleSimulateOffline }}
    >
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
  return ctx
}
