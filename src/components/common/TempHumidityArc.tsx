import React, { useEffect, useMemo, useRef, useState } from 'react'
import { getHistoricalReadings, getThreshold } from '../../utils/firebase'
import useLatestReadingRealtime from '../../hooks/useLatestReadingRealtime'
import type { GasReading, Threshold } from '../../types'

type RangeKey = '15m' | '1h' | '6h' | '24h'

const RANGE_MS: Record<RangeKey, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// Convert percent (0..1) to coordinates on a semicircle
const pointOnArc = (cx: number, cy: number, r: number, t: number) => {
  const angle = (-Math.PI / 2) + (t * Math.PI)
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

const arcPath = (cx: number, cy: number, r: number, t0: number, t1: number) => {
  const p0 = pointOnArc(cx, cy, r, t0)
  const p1 = pointOnArc(cx, cy, r, t1)
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 1 ${p1.x} ${p1.y}`
}

const colorForTemp = (tPercent: number) => {
  // interpolate blue -> cyan -> yellow -> orange -> red
  const stops = [
    { p: 0.0, c: [59,130,246] },
    { p: 0.25, c: [6,182,212] },
    { p: 0.5, c: [234,179,8] },
    { p: 0.75, c: [234,88,12] },
    { p: 1.0, c: [220,38,38] },
  ]
  const p = clamp(tPercent, 0, 1)
  let i = 0
  while (i < stops.length - 1 && p > stops[i+1].p) i++
  const a = stops[i], b = stops[i+1]
  const w = (p - a.p) / (b.p - a.p)
  const mix = (aa: number, bb: number) => Math.round(aa + (bb - aa) * w)
  const [r,g,b2] = [mix(a.c[0], b.c[0]), mix(a.c[1], b.c[1]), mix(a.c[2], b.c[2])]
  return `rgb(${r}, ${g}, ${b2})`
}

interface TempHumidityArcProps {
  className?: string
  size?: number // base width; responsive uses container width if not provided
}

const TempHumidityArc: React.FC<TempHumidityArcProps> = ({ className = '', size }) => {
  const { reading, error } = useLatestReadingRealtime()
  const [threshold, setThreshold] = useState<Threshold | null>(null)
  const [history, setHistory] = useState<GasReading[]>([])
  const [range, setRange] = useState<RangeKey>('1h')
  const [refreshing, setRefreshing] = useState(false)
  const [containerWidth, setContainerWidth] = useState<number>(size || 320)
  const ref = useRef<HTMLDivElement | null>(null)

  // Responsive: measure container
  useEffect(() => {
    if (!ref.current || size) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      setContainerWidth(Math.max(260, Math.min(480, Math.round(w))))
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [size])

  useEffect(() => { getThreshold().then(setThreshold).catch(() => setThreshold(null)) }, [])
  const loadHistory = async () => {
    try {
      setRefreshing(true)
      const list = await getHistoricalReadings(400)
      setHistory(list)
    } catch (e) {
      console.error('History load error', e)
    } finally { setRefreshing(false) }
  }
  useEffect(() => { loadHistory() }, [])

  const width = containerWidth
  const height = Math.round(width * 0.58)
  const cx = width / 2
  const cy = height
  const r = Math.round(width * 0.46)

  const tMin = threshold?.temperatureMin ?? -20
  const tMax = threshold?.temperatureMax ?? 80
  const hMin = threshold?.humidityMin ?? 0
  const hMax = threshold?.humidityMax ?? 100

  const tempVal = reading?.temperature ?? 0
  const humVal = reading?.humidity ?? 0
  const tPercent = (clamp(tempVal, tMin, tMax) - tMin) / (tMax - tMin)
  const hPercent = (clamp(humVal, hMin, hMax) - hMin) / (hMax - hMin)

  const strokeWidth = 8 + Math.round(hPercent * 14) // humidity -> thickness
  const dot = pointOnArc(cx, cy, r, tPercent)

  // Historical filtering by range
  const now = Date.now()
  const filtered = useMemo(() => history.filter(h => (now - h.timestamp) <= RANGE_MS[range]), [history, now, range])
  const avgTemp = filtered.length ? filtered.reduce((s, x) => s + (x.temperature || 0), 0) / filtered.length : null
  const avgHum = filtered.length ? filtered.reduce((s, x) => s + (x.humidity || 0), 0) / filtered.length : null

  const lastTs = reading?.timestamp || (history[0]?.timestamp ?? 0)
  const isStale = lastTs ? (now - lastTs) > 90_000 : true

  const [hover, setHover] = useState<{x:number;y:number;label:string}|null>(null)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-amber-500 pulse-dot' : 'bg-emerald-500 pulse-dot'}`}></span>
          <span className="text-xs text-gray-600 dark:text-gray-400">Last update: {lastTs ? new Date(lastTs).toLocaleString() : '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          {(['15m','1h','6h','24h'] as RangeKey[]).map((rk) => (
            <button key={rk} onClick={() => setRange(rk)} className={`px-2 py-1 rounded text-xs border ${range===rk? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/40 dark:border-primary-700':'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}>{rk}</button>
          ))}
          <button onClick={loadHistory} className="px-2 py-1 rounded text-xs border border-gray-300 dark:border-gray-700">{refreshing? 'Refreshing…':'Refresh'}</button>
        </div>
      </div>

      <svg width={width} height={height + 30} viewBox={`0 0 ${width} ${height + 30}`} role="img" aria-label="Temperature & humidity visualization">
        <defs>
          <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="25%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>

        {/* Base track */}
        <path d={arcPath(cx, cy, r, 0, 1)} stroke="#475569" strokeWidth={10} strokeLinecap="round" fill="none" opacity={0.15} />

        {/* Temperature arc with gradient, humidity thickness */}
        <path d={arcPath(cx, cy, r, 0, 1)} stroke="url(#tempGradient)" strokeWidth={strokeWidth} strokeLinecap="round" fill="none" style={{ transition: 'stroke-width 400ms ease' }} />

        {/* Temperature marker dot */}
        <circle cx={dot.x} cy={dot.y} r={6} fill={colorForTemp(tPercent)} style={{ transition: 'cx 300ms ease, cy 300ms ease' }}
          onMouseEnter={(e) => {
            setHover({ x: (e.nativeEvent.offsetX||dot.x), y: (e.nativeEvent.offsetY||dot.y) - 12, label: `T ${tempVal.toFixed(1)}°C | H ${humVal.toFixed(1)}%` })
          }}
          onMouseLeave={() => setHover(null)}
        />

        {/* Avg labels */}
        {avgTemp !== null && avgHum !== null && (
          <text x={cx} y={cy - r + 24} textAnchor="middle" className="fill-gray-800 dark:fill-gray-200" fontSize={13}>
            avg T {avgTemp.toFixed(1)}°C • avg H {avgHum.toFixed(1)}%
          </text>
        )}
      </svg>

      {hover && (
        <div style={{ left: hover.x, top: hover.y }} className="absolute -translate-x-1/2 -translate-y-full bg-gray-800 text-white text-xs px-2 py-1 rounded shadow">
          {hover.label}
        </div>
      )}
      {error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">Realtime error: {error}</div>
      )}
    </div>
  )
}

export default TempHumidityArc