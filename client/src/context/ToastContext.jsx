import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message, opts = {}) => {
    const id = ++idRef.current
    const item = { id, message, type: opts.type || 'success', icon: opts.icon }
    setToasts((list) => [...list, item])
    const ttl = opts.duration ?? 3200
    setTimeout(() => dismiss(id), ttl)
    return id
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 safe-bottom pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto animate-pop-in flex items-center gap-2.5 rounded-2xl px-4 py-3 shadow-lift text-sm font-semibold max-w-md w-full sm:w-auto ${
              t.type === 'error'
                ? 'bg-rose-600 text-white'
                : t.type === 'info'
                ? 'bg-ink-900 text-white'
                : 'bg-brand-600 text-white'
            }`}
          >
            <span className="text-lg leading-none">{t.icon || (t.type === 'error' ? '⚠️' : '✅')}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
