import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import BottomNav from './BottomNav.jsx'
import NetworkBanner from './NetworkBanner.jsx'
import { useNetwork } from '../context/NetworkContext.jsx'
import { useLang } from '../context/LanguageContext.jsx'

// Small presenter control: flip "weak network" on stage without touching Wi-Fi,
// to live-demo the Save & Submit Later flow.
function DemoNetworkToggle() {
  const { online, toggleSimulateOffline, simulateOffline } = useNetwork()
  return (
    <button
      onClick={toggleSimulateOffline}
      title="Demo: simulate weak network"
      className={`fixed bottom-24 right-3 lg:bottom-5 z-40 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold shadow-lift transition ${
        simulateOffline ? 'bg-amber-500 text-amber-950' : 'bg-white text-ink-500 border border-ink-200'
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-brand-500' : 'bg-amber-700'}`} />
      {online ? 'Network' : 'Offline'}
    </button>
  )
}

export default function Layout() {
  const location = useLocation()
  // Dashboards get their own full-width chrome; citizen pages get the bottom nav.
  const isDashboard = ['/government', '/university', '/industry'].some((p) => location.pathname.startsWith(p))

  return (
    <div className="flex min-h-dvh flex-col">
      <NetworkBanner />
      <Header />
      <main className={`flex-1 ${isDashboard ? '' : 'pb-24 lg:pb-0'}`}>
        <Outlet />
      </main>
      <Footer />
      {!isDashboard && <BottomNav />}
      <DemoNetworkToggle />
    </div>
  )
}
