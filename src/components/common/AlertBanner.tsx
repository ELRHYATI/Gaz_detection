import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FiAlertOctagon, FiAlertTriangle, FiInfo, FiExternalLink } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../contexts/I18nContext'
import { subscribeToAlertLogs, acknowledgeAlertLog } from '../../utils/firebase'
import type { AlertLogEntry } from '../../utils/firebase'

type Severity = AlertLogEntry['severity'] | 'information'

const severityWeight: Record<AlertLogEntry['severity'], number> = {
  critical: 3,
  danger: 2,
  warning: 1,
}

const iconFor = (sev: Severity) => {
  switch (sev) {
    case 'critical':
      return <FiAlertOctagon className="h-6 w-6" />
    case 'danger':
      return <FiAlertTriangle className="h-6 w-6" />
    case 'warning':
    default:
      return <FiInfo className="h-6 w-6" />
  }
}

const stylesFor = (sev: Severity) => {
  switch (sev) {
    case 'critical':
      return {
        ring: 'ring-1 ring-red-500/30',
        bg: 'bg-red-50/80 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-200',
        icon: 'text-red-600 dark:text-red-300',
        button: 'bg-red-600 hover:bg-red-700 text-white',
      }
    case 'danger':
      return {
        ring: 'ring-1 ring-orange-500/30',
        bg: 'bg-orange-50/80 dark:bg-orange-900/20',
        text: 'text-orange-800 dark:text-orange-200',
        icon: 'text-orange-600 dark:text-orange-300',
        button: 'bg-orange-600 hover:bg-orange-700 text-white',
      }
    case 'warning':
    default:
      return {
        ring: 'ring-1 ring-amber-500/30',
        bg: 'bg-amber-50/80 dark:bg-amber-900/20',
        text: 'text-amber-800 dark:text-amber-100',
        icon: 'text-amber-600 dark:text-amber-300',
        button: 'bg-amber-600 hover:bg-amber-700 text-white',
      }
  }
}

const formatTime = (ts?: number) => {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ''
  }
}

// Prominent alert banner that appears below the header.
// Shows the highest-severity, most recent unacknowledged alert and supports dismiss/ack.
const AlertBanner: React.FC = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AlertLogEntry[]>([])
  const [visible, setVisible] = useState(false)
  const hideTimer = useRef<number | null>(null)

  useEffect(() => {
    const unsub = subscribeToAlertLogs((items) => setLogs(items), console.error, 50)
    return () => unsub()
  }, [])

  const banner = useMemo(() => {
    const unack = logs.filter((l) => !l.acknowledged)
    if (unack.length === 0) return null
    const sorted = unack.sort((a, b) => {
      const bySev = severityWeight[b.severity] - severityWeight[a.severity]
      if (bySev !== 0) return bySev
      return (b.timestamp || 0) - (a.timestamp || 0)
    })
    return sorted[0]
  }, [logs])

  useEffect(() => {
    // Manage visibility and auto-hide behavior
    if (banner) {
      setVisible(true)
      // Critical stays until acknowledged; others auto-hide after 8s
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
      if (banner.severity !== 'critical') {
        hideTimer.current = window.setTimeout(() => setVisible(false), 8000)
      }
    } else {
      setVisible(false)
    }
    return () => {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current)
        hideTimer.current = null
      }
    }
  }, [banner])

  if (!banner) return null

  const sevLabel = banner.severity === 'critical'
    ? t('alerts.critical', 'Critical Alert')
    : banner.severity === 'danger'
      ? t('alerts.danger', 'Warning')
      : t('alerts.warning', 'Information')

  const styles = stylesFor(banner.severity)

  const onDismiss = async () => {
    if (!banner?.id) { setVisible(false); return }
    await acknowledgeAlertLog(banner.id).catch(() => {})
    setVisible(false)
  }

  const onViewDetails = () => {
    if (banner?.id) navigate(`/notifications?id=${encodeURIComponent(banner.id)}`)
    else navigate('/notifications')
  }

  return (
    <div
      role="alert"
      aria-live={banner.severity === 'critical' ? 'assertive' : 'polite'}
      className={`transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
    >
      <div className={`rounded-xl ${styles.bg} ${styles.ring} shadow-sm overflow-hidden`}
           style={{ backdropFilter: 'blur(6px)' }}>
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${styles.icon}`}>
              {iconFor(banner.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className={`text-base sm:text-lg font-semibold ${styles.text}`}>{sevLabel}</h3>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">{formatTime(banner.timestamp)}</span>
              </div>
              <p className="mt-1 text-sm sm:text-base text-gray-800 dark:text-gray-200">
                {banner.message || `${banner.parameter.toUpperCase()} ${banner.severity} — value ${banner.value}`}
              </p>
              {banner.location && (
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{banner.location}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${styles.button} tap-glow`}
                  onClick={onDismiss}
                >
                  {banner.severity === 'critical' ? t('alerts.acknowledge', 'Acknowledge') : t('alerts.dismiss', 'Dismiss')}
                </button>
                <button
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-gray-900/10 dark:bg-gray-100/10 hover:bg-gray-900/20 dark:hover:bg-gray-100/20 text-gray-800 dark:text-gray-200"
                  onClick={onViewDetails}
                >
                  <FiExternalLink className="mr-2 h-4 w-4" />
                  {t('alerts.viewDetails', 'View details')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlertBanner