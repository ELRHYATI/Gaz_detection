import React, { useEffect, useMemo, useRef, useState } from 'react'

type Severity = 'safe' | 'warning' | 'danger' | 'critical'

interface GaugeProps {
  value: number
  min: number
  max: number
  severity?: Severity
  className?: string
  size?: number // width in px
  label?: string
  showLabels?: boolean
  warningBandFraction?: number // 0..0.5, near-edges band width
}

// Utility to clamp
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

// Convert percent (0..1) to coordinates on a semicircle
const pointOnArc = (cx: number, cy: number, r: number, t: number) => {
  // t is 0..1 along semicircle from left (-90deg) to right (+90deg)
  const angle = (-Math.PI / 2) + (t * Math.PI)
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

// SVG path for arc segment between two percents (0..1)
const arcPath = (cx: number, cy: number, r: number, t0: number, t1: number) => {
  const p0 = pointOnArc(cx, cy, r, t0)
  const p1 = pointOnArc(cx, cy, r, t1)
  // Always use the short arc on the top semicircle
  const largeArc = 0
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArc} 1 ${p1.x} ${p1.y}`
}

const Gauge: React.FC<GaugeProps> = ({ value, min, max, severity = 'safe', className = '', size = 220, label, showLabels = true, warningBandFraction = 0.1 }) => {
  const width = size
  const height = Math.round(size * 0.58)
  const cx = width / 2
  const cy = height
  const r = Math.round(size * 0.46)

  const percent = useMemo(() => {
    const norm = (clamp(value, min, max) - min) / (max - min)
    return clamp(norm, 0, 1)
  }, [value, min, max])

  // Animated needle angle with reduced-motion support
  const prefersReduced = useMemo(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const [needlePercent, setNeedlePercent] = useState(percent)
  const prev = useRef(percent)

  useEffect(() => {
    if (prefersReduced) { setNeedlePercent(percent); return }
    // Smooth easing toward target
    setNeedlePercent(percent)
    prev.current = percent
  }, [percent, prefersReduced])

  // Map severity to stroke color for needle accent
  const needleColor = severity === 'critical' ? '#ef4444' : severity === 'danger' ? '#f97316' : severity === 'warning' ? '#f59e0b' : '#10b981'

  // Zones mapped relative to [min,max] using warning band width
  const w = clamp(warningBandFraction, 0.05, 0.25)
  const zones: Array<{ from: number; to: number; color: string }> = [
    { from: 0.0, to: w, color: '#ef4444' },
    { from: w, to: w * 2, color: '#f59e0b' },
    { from: w * 2, to: 1 - (w * 2), color: '#10b981' },
    { from: 1 - (w * 2), to: 1 - w, color: '#f59e0b' },
    { from: 1 - w, to: 1.0, color: '#ef4444' }
  ]

  // Needle geometry
  const needleAngle = (-90) + (needlePercent * 180) // degrees

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={width} height={height + 4} viewBox={`0 0 ${width} ${height + 4}`} role="img" aria-label={label ? label : `Gas level gauge`}>
        {/* Base arc track (soft) */}
        <path d={arcPath(cx, cy, r, 0, 1)} stroke="#cbd5e1" strokeWidth={8} strokeLinecap="round" fill="none" opacity={0.18} />
        {/* Zones */}
        {zones.map((z, i) => (
          <path key={i} d={arcPath(cx, cy, r, z.from, z.to)} stroke={z.color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ))}

        {/* Ticks */}
        {[0,0.25,0.5,0.75,1,w,1-w,w*2,1-(w*2)].map((t, i) => {
          const p = pointOnArc(cx, cy, r, t)
          const inner = pointOnArc(cx, cy, r - 10, t)
          return <line key={i} x1={inner.x} y1={inner.y} x2={p.x} y2={p.y} stroke="#cbd5e1" strokeWidth={2} strokeLinecap="round" />
        })}

        {/* Needle */}
        <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${needleAngle}deg)`, transition: prefersReduced ? 'none' : 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - r + 12} stroke={needleColor} strokeWidth={3} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={6} fill={needleColor} />
        </g>

        {/* End labels */}
        {showLabels && (
          <>
            <text x={pointOnArc(cx, cy, r + 2, 0).x} y={pointOnArc(cx, cy, r + 2, 0).y} textAnchor="start" className="fill-gray-300 dark:fill-gray-400" fontSize={12}>{min}</text>
            <text x={pointOnArc(cx, cy, r + 2, 1).x} y={pointOnArc(cx, cy, r + 2, 1).y} textAnchor="end" className="fill-gray-300 dark:fill-gray-400" fontSize={12}>{max}</text>
          </>
        )}
      </svg>
    </div>
  )
}

export default Gauge