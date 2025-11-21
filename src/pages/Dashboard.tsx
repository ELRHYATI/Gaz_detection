import React, { useState, useEffect } from 'react'
import { FiActivity, FiThermometer, FiDroplet } from 'react-icons/fi'
import { startTrace } from '../utils/apm'
import { subscribeToThreshold } from '../utils/firebase'
import { calculateAlertLevel } from '../utils/alerts'
import type { Threshold, AlertLevel } from '../types'
import MetricCard from '../components/dashboard/MetricCard'
import SkeletonCard from '../components/common/SkeletonCard'
import AlertBanner from '../components/dashboard/AlertBanner'
import RecentReadings from '../components/dashboard/RecentReadings'
import ActuatorsCard from '../components/dashboard/ActuatorsCard'
import { useLatestReadingRealtime } from '../hooks/useLatestReadingRealtime'
import { useRealtimeStatus } from '../hooks/useRealtimeStatus'
import ConnectionIndicator from '../components/ConnectionIndicator'
import { useSystemMode } from '../hooks/useSystemMode'
import { useAlertsEngine } from '../hooks/useAlertsEngine'
import AlertModal from '../components/alerts/AlertModal'
import ApmMonitor from '../components/common/ApmMonitor'

const Dashboard: React.FC = () => {
  const { reading: gasReading, updating, error: gasError, mode } = useLatestReadingRealtime()
  const { status } = useRealtimeStatus()
  const { mode: systemMode } = useSystemMode()
  const { activeAlert, acknowledge } = useAlertsEngine()
  const [_, setDummy] = useState(0) // force re-render to keep "Last update" ticking on slow feeds
  const [thresholds, setThresholds] = useState<Threshold | null>(null)
  const [alert, setAlert] = useState<AlertLevel>({ level: 'safe', message: 'All parameters are normal', color: 'text-success-600' })
  const [, setLoading] = useState(true)
  const [gasSeries, setGasSeries] = useState<number[]>([])
  const [tempSeries, setTempSeries] = useState<number[]>([])
  const [humSeries, setHumSeries] = useState<number[]>([])

  useEffect(() => {
    const unsubscribeThresholds = subscribeToThreshold((threshold) => {
      setThresholds(threshold)
    })

    return () => {
      unsubscribeThresholds()
    }
  }, [])

  useEffect(() => {
    if (gasReading && thresholds) {
      const levelObj = calculateAlertLevel(gasReading, thresholds)
      setAlert(levelObj)
    }
  }, [gasReading, thresholds])

  // Maintain small buffers for sparklines
  useEffect(() => {
    if (!gasReading) return
    setGasSeries(prev => [...prev.slice(-29), Math.max(0, gasReading.gasLevel || 0)])
    setTempSeries(prev => [...prev.slice(-29), gasReading.temperature || 0])
    setHumSeries(prev => [...prev.slice(-29), gasReading.humidity || 0])
  }, [gasReading])

  // Stop initial spinner once we have data or an error, or after a short timeout
  useEffect(() => {
    // Trace: temps jusqu'à première donnée/erreur
    const t = startTrace('dashboard_initial_reading', { route: '/dashboard' })
    if (gasReading || gasError) {
      setLoading(false)
      try { t?.stop() } catch {}
    }
  }, [gasReading, gasError])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000)
    // Fallback: arrêter la trace si aucune donnée en 3s
    const t = startTrace('dashboard_initial_render_fallback', { route: '/dashboard' })
    setTimeout(() => { try { t?.stop() } catch {} }, 3000)
    return () => clearTimeout(timer)
  }, [])

  // Do not block the dashboard if loading; render with placeholders

  // Keep the dashboard UI refreshed at least once per second for timestamp display
  useEffect(() => {
    const t = setInterval(() => setDummy((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Format using user's locale and show stale indicator when timestamp drifts
  const EARLIEST_VALID_MS = Date.UTC(2000, 0, 1)
  const effectiveTs = gasReading?.timestamp
    ? (gasReading.timestamp < EARLIEST_VALID_MS ? Date.now() : gasReading.timestamp)
    : null
  const lastUpdateTime = effectiveTs
    ? new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit'
      }).format(new Date(effectiveTs))
    : '—'
  const skewMs = effectiveTs ? Math.abs(Date.now() - effectiveTs) : 0
  const isStale = skewMs > 90_000 // > 90 seconds considered not current

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time monitoring of the detection system</p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionIndicator status={(systemMode === 'inactive' ? 'inactive' : (status === 'connected' ? (mode === 'polling' ? 'polling' : 'connected') : status)) as any} updating={updating} />
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Last reading</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{lastUpdateTime}</p>
            {isStale && (
              <p className="text-xs text-amber-600 dark:text-amber-400">Not current (data older than 90s)</p>
            )}
            {/* Compact Performance monitor */}
            <div className="mt-1">
              <ApmMonitor compact />
            </div>
          </div>
        </div>
      </div>

      {gasError && (
        <div className="p-3 rounded-md bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800">
          Real-time data unavailable: {gasError}. Falling back to {mode === 'polling' ? 'polling' : 'live'}.
        </div>
      )}

      {alert.level !== 'safe' && (
        <AlertBanner level={alert} />
      )}

      {/* Persistent alert message until acknowledged */}
      {activeAlert && (
        <div className="mb-4">
          <AlertBanner
            level={{ level: activeAlert.severity === 'critical' ? 'critical' : activeAlert.severity === 'danger' ? 'danger' : 'warning', message: activeAlert.message, color: '' }}
            message={`${activeAlert.parameter.toUpperCase()}=${activeAlert.value} at ${new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(activeAlert.timestamp)} in ${activeAlert.location}`}
            onDismiss={acknowledge}
            expiresAt={activeAlert.expiresAt}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(!gasReading && !gasError) ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
        <MetricCard
          title="Gas Level"
          value={Math.max(0, gasReading?.gasLevel || 0)}
          unit="ppm"
          icon={FiActivity}
          trend={gasReading?.gasLevel && gasReading.gasLevel > 50 ? 'up' : 'down'}
          alertLevel={alert}
          className="col-span-1"
          history={gasSeries}
        >
          {/* Gauge removed per request */}
        </MetricCard>

        <MetricCard
          title="Temperature"
          value={gasReading?.temperature || 0}
          unit="°C"
          icon={FiThermometer}
          trend={gasReading?.temperature && gasReading.temperature > 25 ? 'up' : 'down'}
          alertLevel={{ level: 'safe', message: 'Normal temperature', color: 'text-success-600' }}
          className="col-span-1"
          history={tempSeries}
        />
        
        <MetricCard
          title="Humidity"
          value={gasReading?.humidity || 0}
          unit="%"
          icon={FiDroplet}
          trend={gasReading?.humidity && gasReading.humidity > 60 ? 'up' : 'down'}
          alertLevel={{ level: 'safe', message: 'Normal humidity', color: 'text-success-600' }}
          className="col-span-1"
          history={humSeries}
        />
          </>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Status</h2>
          <div className="flex items-center space-x-2">
            <ConnectionIndicator status={status === 'connected' ? (mode === 'polling' ? 'polling' : 'connected') : status} updating={updating} />
            <span className="status-indicator bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">{mode === 'polling' ? 'Polling' : 'Live'}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {thresholds?.gasMax || 900}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Gas max threshold (ppm)</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">24/7</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Monitoring</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-success-600">
              {gasReading ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sensors</div>
          </div>
        </div>
      </div>

      <ActuatorsCard />

      <RecentReadings thresholdOverride={thresholds || undefined} />
      <div className="flex justify-end">
        <a href="/history" className="text-primary-600 hover:underline text-sm">View full history →</a>
      </div>

      {/* Pop-up alert modal with details */}
      <AlertModal
        isOpen={!!activeAlert}
        severity={activeAlert?.severity || 'warning'}
        location={activeAlert?.location || ''}
        parameter={activeAlert?.parameter || 'gas'}
        value={activeAlert?.value || 0}
        timestamp={activeAlert?.timestamp || Date.now()}
        message={activeAlert?.message || ''}
        onAcknowledge={acknowledge}
      />
    </div>
  )
}

export default Dashboard