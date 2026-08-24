import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout.jsx'
import { useAuth } from './context/AuthContext.jsx'

import Home from './pages/Home.jsx'
import ReportProblem from './pages/ReportProblem.jsx'
import TrackReports from './pages/TrackReports.jsx'
import ReportDetail from './pages/ReportDetail.jsx'
import Nearby from './pages/Nearby.jsx'
import Challenges from './pages/Challenges.jsx'
import Login from './pages/Login.jsx'
import GovernmentDashboard from './pages/GovernmentDashboard.jsx'
import UniversityDashboard from './pages/UniversityDashboard.jsx'
import IndustryDashboard from './pages/IndustryDashboard.jsx'

function RequireRole({ role, children }) {
  const { user } = useAuth()
  if (!user || user.role !== role) return <Navigate to="/login" replace />
  return children
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo({ top: 0 }) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/report" element={<ReportProblem />} />
          <Route path="/track" element={<TrackReports />} />
          <Route path="/track/:id" element={<ReportDetail />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/login" element={<Login />} />
          <Route path="/government" element={<RequireRole role="government"><GovernmentDashboard /></RequireRole>} />
          <Route path="/university" element={<RequireRole role="university"><UniversityDashboard /></RequireRole>} />
          <Route path="/industry" element={<RequireRole role="industry"><IndustryDashboard /></RequireRole>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}
