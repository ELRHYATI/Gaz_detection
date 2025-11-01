import React, { useState, useEffect } from 'react'
import { FiActivity, FiThermometer, FiDroplet } from 'react-icons/fi'
import { subscribeToLatestReading, subscribeToThreshold } from '../utils/firebase'
import { calculateAlertLevel } from '../utils/alerts'
import type { GasReading, Threshold, AlertLevel } from '../types'
import MetricCard from '../components/dashboard/MetricCard'
import AlertBanner from '../components/dashboard/AlertBanner'
import RecentReadings from '../components/dashboard/RecentReadings'

const Dashboard: React.FC = () => {
  const [gasReading, setGasReading] = useState<GasReading | null>(null)
  const [thresholds, setThresholds] = useState<Threshold | null>(null)
  const [alert, setAlert] = useState<AlertLevel>({ level: 'safe', message: 'All parameters are normal', color: 'text-success-600' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribeGas = subscribeToLatestReading((reading) => {
      setGasReading(reading)
      setLoading(false)
    })

    const unsubscribeThresholds = subscribeToThreshold((threshold) => {
      setThresholds(threshold)
    })

    return () => {
      unsubscribeGas()
      unsubscribeThresholds()
    }
  }, [])

  useEffect(() => {
    if (gasReading && thresholds) {
      const levelObj = calculateAlertLevel(gasReading, thresholds)
      setAlert(levelObj)
    }
  }, [gasReading, thresholds])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const currentTime = new Date().toLocaleString('en-US')

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time monitoring of the detection system</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500 dark:text-gray-400">Last update</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentTime}</p>
        </div>
      </div>

      {alert.level !== 'safe' && (
        <AlertBanner level={alert} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Gas Level"
          value={gasReading?.gasLevel || 0}
          unit="ppm"
          icon={FiActivity}
          trend={gasReading?.gasLevel && gasReading.gasLevel > 50 ? 'up' : 'down'}
          alertLevel={alert}
          className="col-span-1"
        />
        
        <MetricCard
          title="Temperature"
          value={gasReading?.temperature || 0}
          unit="°C"
          icon={FiThermometer}
          trend={gasReading?.temperature && gasReading.temperature > 25 ? 'up' : 'down'}
          alertLevel={{ level: 'safe', message: 'Normal temperature', color: 'text-success-600' }}
          className="col-span-1"
        />
        
        <MetricCard
          title="Humidity"
          value={gasReading?.humidity || 0}
          unit="%"
          icon={FiDroplet}
          trend={gasReading?.humidity && gasReading.humidity > 60 ? 'up' : 'down'}
          alertLevel={{ level: 'safe', message: 'Normal humidity', color: 'text-success-600' }}
          className="col-span-1"
        />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">System Status</h2>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
            <span className="status-indicator bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">Live</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {thresholds?.gasMax || 200}
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

      <RecentReadings thresholdOverride={thresholds || undefined} />
    </div>
  )
}

export default Dashboard