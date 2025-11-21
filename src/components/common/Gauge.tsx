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
}

// Utility to clamp
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))


const Gauge: React.FC<GaugeProps> = ({ value, min, max, severity = 'safe', className = '', size = 220, label }) => {
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

  // Map severity to stroke color for needle accent and overlay
  const severityColor = severity === 'critical' ? '#ef4444' : severity === 'danger' ? '#f97316' : severity === 'warning' ? '#f59e0b' : '#10b981'
  const needleColor = severityColor

  // Arc visuals disabled: no track/zones/ticks/labels

  // Needle geometry
  const needleAngle = (-90) + (needlePercent * 180) // degrees

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg width={width} height={height + 4} viewBox={`0 0 ${width} ${height + 4}`} role="img" aria-label={label ? label : `Gas level gauge`}>

        {/* Needle */}
        <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${needleAngle}deg)`, transition: prefersReduced ? 'none' : 'transform 120ms linear' }}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - r + 12} stroke={needleColor} strokeWidth={3} strokeLinecap="round" />
        </g>

        {/* No labels or arc */}
      </svg>
    </div>
  )
}

export default Gauge