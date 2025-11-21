import React, { useEffect, useState } from 'react'
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings, FiWind, FiMoon, FiSun } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../contexts/I18nContext'
import { useRealtimeStatus } from '../../hooks/useRealtimeStatus'
import { useSystemMode } from '../../hooks/useSystemMode'
import ConnectionIndicator from '../ConnectionIndicator'
import { subscribeToAlertLogs, acknowledgeAlertLog, deleteAlertLog } from '../../utils/firebase'
import type { AlertLogEntry } from '../../utils/firebase'
 

interface HeaderProps {
  onMenuClick: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [dropdownView, setDropdownView] = useState<'unread' | 'all'>('unread')
  const [isDark, setIsDark] = useState(false)
  const [notifications, setNotifications] = useState<AlertLogEntry[]>([])
  
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const root = document.documentElement
    setIsDark(root.classList.contains('dark'))
  }, [])

  

  // Subscribe to realtime alert logs
  useEffect(() => {
    const unsub = subscribeToAlertLogs((logs) => setNotifications(logs), console.error, 20)
    return () => unsub()
  }, [])

  // Listen for cross-page notifications changes for immediate badge updates
  useEffect(() => {
    let channel: BroadcastChannel | null = null
    try {
      channel = new BroadcastChannel('alerts')
      channel.onmessage = (ev) => {
        const data = ev?.data
        if (!data || typeof data !== 'object') return
        if (data.type === 'deleted' && data.id) {
          setNotifications((prev) => prev.filter((n) => n.id !== data.id))
        } else if (data.type === 'acknowledged' && data.id) {
          setNotifications((prev) => prev.map((n) => n.id === data.id ? { ...n, acknowledged: true } : n))
        } else if (data.type === 'deleted_all') {
          setNotifications([])
        }
      }
    } catch {}
    return () => { try { channel?.close() } catch {} }
  }, [])

  const badgeCount = notifications.filter(n => !n.acknowledged).length

  const timeAgo = (ts?: number) => {
    if (!ts) return ''
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    const diffMs = ts - Date.now()
    const diffMin = Math.round(diffMs / 60000)
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
    const diffHour = Math.round(diffMin / 60)
    return rtf.format(diffHour, 'hour')
  }

  const severityStyles = (sev: AlertLogEntry['severity']) => {
    const token = (sev === 'critical')
      ? (localStorage.getItem('palette.critical') ?? 'red')
      : (sev === 'danger')
        ? (localStorage.getItem('palette.danger') ?? 'orange')
        : (localStorage.getItem('palette.warning') ?? 'amber');
    const map = (t: string) => {
      switch (t) {
        case 'red':
          return { badge: 'bg-red-100 dark:bg-red-900/40', icon: 'text-red-600 dark:text-red-400' };
        case 'orange':
          return { badge: 'bg-orange-100 dark:bg-orange-900/40', icon: 'text-orange-600 dark:text-orange-400' };
        case 'amber':
        default:
          return { badge: 'bg-amber-100 dark:bg-amber-900/40', icon: 'text-amber-600 dark:text-amber-400' };
      }
    };
    return map(token);
  }

  const toggleTheme = () => {
    const root = document.documentElement
    const next = !root.classList.contains('dark')
    root.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setIsDark(next)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const { t, locale, setLocale } = useI18n();
  const { status } = useRealtimeStatus();
  const { mode: systemMode } = useSystemMode();
  const visibleNotifications = dropdownView === 'unread' ? notifications.filter(n => !n.acknowledged) : notifications
  return (<>
    <header className="fixed top-0 left-0 right-0 z-40 lg:pl-64 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto pl-4 sm:pl-6 lg:pl-0 pr-4 sm:pr-6 lg:pr-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={onMenuClick}
            >
              <FiMenu className="h-6 w-6" />
            </button>
            
            <div className="lg:hidden ml-4 flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <FiWind className="h-5 w-5 text-primary-600 dark:text-primary-300" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {t('app.title', 'Gas Detection')}
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Language toggle */}
            <button
              className="relative group p-2 rounded-full border-0 bg-white/60 dark:bg-gray-900/60 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-colors"
              onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}
              aria-label="Toggle language"
              title={locale === 'en' ? 'Switch to French' : 'Passer en anglais'}
            >
              <span className="text-xs font-medium">{locale.toUpperCase()}</span>
            </button>
            {/* Command palette trigger removed per request */}
            {/* Theme toggle */}
            <button
              className="relative group p-2 rounded-full border-0 bg-white/60 dark:bg-gray-900/60 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className={`absolute inset-0 rounded-full -z-10 transition-colors duration-300 ${isDark ? 'bg-yellow-400/10' : 'bg-indigo-400/10'}`}></span>
              <span className="relative inline-block h-5 w-5">
                <FiSun className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isDark ? 'opacity-100 scale-100 rotate-0 text-yellow-400 drop-shadow' : 'opacity-0 scale-75 -rotate-90'}`} />
                <FiMoon className={`absolute inset-0 h-5 w-5 transition-all duration-300 ${isDark ? 'opacity-0 scale-75 rotate-90' : 'opacity-100 scale-100 rotate-0 text-indigo-400 drop-shadow'}`} />
              </span>
            </button>

            {/* Status badge */}
            <div className="hidden md:flex items-center space-x-2">
              <ConnectionIndicator status={(systemMode === 'inactive' ? 'inactive' : status) as any} />
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {systemMode === 'inactive' ? 'Inactive' : (status === 'connected' ? 'System Live' : status === 'polling' ? 'Polling' : status === 'reconnecting' ? 'Reconnecting' : 'Offline')}
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                className={`relative p-2 rounded-full border-0 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors ${badgeCount > 0 ? 'pulse-dot pulse-red' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FiBell className="h-6 w-6" />
                {/* Notification badge */}
                {badgeCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">{Math.min(badgeCount, 9)}</span>
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('notifications.title', 'Notifications')}</h3>
                      <div className="inline-flex rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                        <button
                          className={`text-xs px-2 py-1 ${dropdownView === 'unread' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
                          onClick={() => setDropdownView('unread')}
                        >
                          Unread
                        </button>
                        <button
                          className={`text-xs px-2 py-1 ${dropdownView === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'}`}
                          onClick={() => setDropdownView('all')}
                        >
                          All
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {visibleNotifications.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{dropdownView === 'unread' ? 'No unread notifications' : 'No notifications'}</div>
                    ) : (
                      visibleNotifications.map((n) => {
                        const styles = severityStyles(n.severity)
                        const title = n.message || `${n.parameter.toUpperCase()} ${n.severity}`
                        return (
                          <div
                            key={n.id}
                            className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors cursor-pointer"
                            onClick={() => { setShowNotifications(false); navigate(n.id ? `/notifications?id=${encodeURIComponent(n.id)}` : '/notifications'); }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className={`h-8 w-8 ${styles.badge} rounded-full flex items-center justify-center`}>
                                  <FiBell className={`h-4 w-4 ${styles.icon}`} />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.location || ''}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{timeAgo(n.timestamp)}</p>
                              </div>
                              <div className="flex-shrink-0 flex items-center gap-2">
                                {!n.acknowledged && <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>}
                                {!n.acknowledged && (
                                  <button
                                    className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                                    onClick={(e) => { e.stopPropagation(); if (n.id) { acknowledgeAlertLog(n.id); setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, acknowledged: true } : x)); } }}
                                  >
                                    Mark read
                                  </button>
                                )}
                                {n.id && (
                                  <button
                                    className="text-xs px-2 py-1 rounded bg-danger-50 dark:bg-danger-900/30 hover:bg-danger-100 dark:hover:bg-danger-800 text-danger-700 dark:text-danger-300"
                                    onClick={(e) => { e.stopPropagation(); deleteAlertLog(n.id!); setNotifications((prev) => prev.filter((x) => x.id !== n.id)); }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                      className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
                    >
                      {t('notifications.viewAll', 'View all notifications')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-3 p-2 rounded-lg border-0 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <FiUser className="h-5 w-5 text-white" />
                </div>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 ds-card p-0 overflow-hidden z-50 dark:border-gray-800"
                  role="menu"
                  aria-label="User menu"
                >
                  {/* Header */}
                  <div className="px-4 py-4 bg-white dark:bg-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-2 ring-primary-200 dark:ring-primary-800">
                        <FiUser className="h-5 w-5 text-primary-600 dark:text-primary-300" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{currentUser?.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="py-2">
                    <button
                      onClick={() => { setShowUserMenu(false); navigate('/settings'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary-700 dark:text-primary-300 bg-white dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-gray-800 border-l-2 border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      role="menuitem"
                    >
                      <FiSettings className="h-4 w-4 text-primary-600 dark:text-primary-300" />
                      <span>{t('settings.title', 'User Settings')}</span>
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-800" />
                    <button
                      onClick={() => { setShowUserMenu(false); handleLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger-700 dark:text-danger-300 bg-white dark:bg-gray-900 hover:bg-danger-50 dark:hover:bg-gray-800 border-l-2 border-danger-600 focus:outline-none focus:ring-2 focus:ring-danger-500"
                      role="menuitem"
                    >
                      <FiLogOut className="h-4 w-4" />
                      <span>{t('settings.logout', 'Logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
    {/* Command palette overlay removed per request */}
  </>)
}

export default Header