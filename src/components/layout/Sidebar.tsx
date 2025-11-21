import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  FiHome, 
  FiSettings, 
  FiToggleLeft, 
  FiX,
  FiBarChart2,
  FiWind
} from 'react-icons/fi'
import { useI18n } from '../../contexts/I18nContext'
import { useSystemMode } from '../../hooks/useSystemMode'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { key: 'nav.dashboard', fallback: 'Dashboard', href: '/dashboard', icon: FiHome },
  { key: 'nav.history', fallback: 'History', href: '/history', icon: FiBarChart2 },
  { key: 'nav.motorControl', fallback: 'Motor Control', href: '/motor-control', icon: FiToggleLeft },
  { key: 'nav.thresholds', fallback: 'Thresholds', href: '/thresholds', icon: FiSettings },
  
]

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { t } = useI18n();
  const { mode: systemMode } = useSystemMode();
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-gray-600 dark:bg-gray-900 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <FiWind className="h-5 w-5 text-primary-600 dark:text-primary-300" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('app.title', 'Gas Detection')}
            </h1>
          </div>
          
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={onClose}
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.key}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 menu-item-hover ${
                    isActive
                      ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                      }`}
                    />
                    {t(item.key, item.fallback)}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Status indicator */}
        <div className="absolute bottom-6 left-3 right-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className={`w-2 h-2 rounded-full ${systemMode === 'inactive' ? 'bg-red-500 pulse-red' : 'bg-emerald-500 pulse-green'} pulse-dot`}></span>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{systemMode === 'inactive' ? t('status.systemInactive', 'System Inactive') : t('status.systemActive', 'System Active')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{systemMode === 'inactive' ? 'Inactive' : t('status.monitoring', 'Monitoring')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar