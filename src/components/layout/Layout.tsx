import React, { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Breadcrumbs from '../common/Breadcrumbs'
import useManualControlSync from '../../hooks/useManualControlSync'
import startInactivityMonitor from '../../workers/inactivityMonitor'
import PageTransition from '../common/PageTransition'
import AlertBanner from '../common/AlertBanner'

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Start manual control sync listeners (servo & seuil)
  useManualControlSync()

  // Start inactivity monitor AFTER auth (Layout is rendered within ProtectedRoute)
  useEffect(() => {
    const stop = startInactivityMonitor({ timeoutMs: 30 * 60 * 1000, verifyIntegrity: true, pollIntervalMs: 10_000 })
    return () => { try { stop?.(); } catch { /* noop */ } }
  }, [])

  // Interactive ambient background responding to pointer
  useEffect(() => {
    const el = document.getElementById('app-bg')
    if (!el) return
    const handler = (ev: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = ((ev.clientX - rect.left) / rect.width) * 100
      const y = ((ev.clientY - rect.top) / rect.height) * 100
      el.style.setProperty('--bg-x', `${Math.round(x)}%`)
      el.style.setProperty('--bg-y', `${Math.round(y)}%`)
    }
    el.addEventListener('pointermove', handler)
    return () => { el.removeEventListener('pointermove', handler) }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Skip to content link for accessibility */}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:bg-primary-600 focus:text-white focus:px-3 focus:py-2 focus:rounded">Skip to content</a>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main content */}
      <div className="lg:pl-64 pt-16">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page content */}
        <main id="main" className="py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Prominent notifications banner */}
            <AlertBanner />
            <Breadcrumbs />
            <PageTransition>
              <Outlet />
            </PageTransition>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout