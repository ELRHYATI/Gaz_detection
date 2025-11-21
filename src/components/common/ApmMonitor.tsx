import React from 'react'
import useApmMetrics from '../../hooks/useApmMetrics'

type Props = { compact?: boolean }

const scoreColor = (name: 'LCP'|'FCP'|'FID'|'CLS', val?: number) => {
  if (val == null) return 'text-gray-500'
  switch (name) {
    case 'LCP':
    case 'FCP':
      return val < 2500 ? 'text-emerald-600' : val < 4000 ? 'text-amber-600' : 'text-red-600'
    case 'FID':
      return val < 100 ? 'text-emerald-600' : val < 300 ? 'text-amber-600' : 'text-red-600'
    case 'CLS':
      return val < 0.1 ? 'text-emerald-600' : val < 0.25 ? 'text-amber-600' : 'text-red-600'
  }
}

const ApmMonitor: React.FC<Props> = ({ compact }) => {
  const { lcp, cls, fid, fcp, updatedAt } = useApmMetrics()

  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className={`font-medium ${scoreColor('LCP', lcp)}`}>LCP: {lcp ?? '—'}ms</span>
        <span className={`font-medium ${scoreColor('FCP', fcp)}`}>FCP: {fcp ?? '—'}ms</span>
        <span className={`font-medium ${scoreColor('FID', fid)}`}>FID: {fid ?? '—'}ms</span>
        <span className={`font-medium ${scoreColor('CLS', cls)}`}>CLS: {typeof cls === 'number' ? cls.toFixed(3) : '—'}</span>
        {updatedAt && (
          <span className="text-gray-400">· {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(updatedAt))}</span>
        )}
      </div>
    )
  }

  return (
    <div className="p-3 rounded-md bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
      <div className="text-sm font-semibold mb-2">Performance</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className={scoreColor('LCP', lcp)}>LCP: {lcp ?? '—'}ms</div>
        <div className={scoreColor('FCP', fcp)}>FCP: {fcp ?? '—'}ms</div>
        <div className={scoreColor('FID', fid)}>FID: {fid ?? '—'}ms</div>
        <div className={scoreColor('CLS', cls)}>CLS: {typeof cls === 'number' ? cls.toFixed(3) : '—'}</div>
      </div>
      {updatedAt && (
        <div className="text-xs text-gray-500 mt-2">Updated {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(updatedAt))}</div>
      )}
    </div>
  )
}

export default ApmMonitor