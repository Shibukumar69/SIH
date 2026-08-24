import { useEffect, useRef } from 'react'
import { useLang } from '../context/LanguageContext.jsx'
import { useNetwork } from '../context/NetworkContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../lib/api.js'

// Shows a persistent "weak network / saved on device" bar when offline, and
// auto-syncs the offline outbox when the connection returns.
export default function NetworkBanner() {
  const { t } = useLang()
  const { online } = useNetwork()
  const { toast } = useToast()
  const wasOffline = useRef(!online)

  useEffect(() => {
    if (online && wasOffline.current) {
      // Just came back online — flush anything saved offline.
      const pending = api.pendingCount()
      if (pending > 0) {
        toast(t('network.syncing', { n: pending }), { type: 'info', icon: '🔄' })
        api.syncOutbox().then((res) => {
          if (res.synced > 0) toast(t('network.synced'), { icon: '📤' })
        })
      }
    }
    wasOffline.current = !online
  }, [online, t, toast])

  if (online) return null

  return (
    <div className="sticky top-0 z-40 bg-amber-500 text-amber-950">
      <div className="container-app flex items-center gap-2 py-2 text-sm font-semibold">
        <span className="text-base">📡</span>
        <span>{t('network.offline')}</span>
      </div>
    </div>
  )
}
