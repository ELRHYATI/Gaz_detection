import React, { useEffect, useState } from 'react'
import { FiMenu, FiBell, FiUser, FiLogOut, FiSettings, FiWind, FiMoon, FiSun } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../contexts/I18nContext'

interface HeaderProps {
  onMenuClick: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const root = document.documentElement
    setIsDark(root.classList.contains('dark'))
  }, [])

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

  const { t } = useI18n();
  return (
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
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1 pulse-dot"></span>
                System Live
              </span>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button 
                className="relative p-2 rounded-full border-0 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FiBell className="h-6 w-6" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">3</span>
                </span>
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('notifications.title', 'Notifications')}</h3>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {/* Sample notifications */}
                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                            <FiBell className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t('notifications.gasAlert', 'Gas Level Alert')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('notifications.gasAlertDesc', 'Gas levels have exceeded the threshold in Zone A')}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">2 minutes ago</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                            <FiBell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t('notifications.systemUpdate', 'System Update')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('notifications.systemUpdateDesc', 'Sensor calibration completed successfully')}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">1 hour ago</p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                            <FiBell className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {t('notifications.maintenance', 'Maintenance Complete')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('notifications.maintenanceDesc', 'Scheduled maintenance has been completed')}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">3 hours ago</p>
                        </div>
                      </div>
                    </div>
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
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                        <FiUser className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{currentUser?.displayName || 'User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/settings')
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 w-full text-left transition-colors"
                  >
                    <FiSettings className="h-4 w-4" />
                    <span>{t('settings.title', 'Settings')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      handleLogout()
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 w-full text-left transition-colors"
                  >
                    <FiLogOut className="h-4 w-4" />
                    <span>{t('settings.logout', 'Logout')}</span>
                  </button>
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
  )
}

export default Header