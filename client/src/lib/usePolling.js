import { useEffect, useRef } from 'react'

// Re-run `fn` on an interval and whenever the tab/window regains focus, so
// dashboards and tracking pages reflect status changes made by other roles in
// near-real-time. Keeps the latest `fn` in a ref, so callers can pass a fresh
// closure each render without resetting the timer.
export function usePolling(fn, ms = 7000) {
  const saved = useRef(fn)
  saved.current = fn
  useEffect(() => {
    const tick = () => { try { saved.current?.() } catch { /* ignore */ } }
    const id = setInterval(tick, ms)
    const onFocus = () => { if (!document.hidden) tick() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [ms])
}
