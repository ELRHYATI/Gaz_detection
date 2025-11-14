import React from 'react';

interface SparklineProps {
  values: number[];
  min?: number;
  max?: number;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({ values, min, max, className = '' }) => {
  const width = 120;
  const height = 32;
  // Guard against unexpected non-array inputs to avoid render crashes
  const arr = Array.isArray(values) ? values : [];
  const pts = arr.slice(-30); // last 30 points
  const lo = min ?? Math.min(...pts, 0);
  const hi = max ?? Math.max(...pts, 1);
  const range = hi - lo || 1;
  const stepX = width / Math.max(pts.length - 1, 1);
  const path = pts.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - lo) / range) * height;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  const last = pts[pts.length - 1] ?? 0;
  const lastX = (pts.length - 1) * stepX;
  const lastY = height - ((last - lo) / range) * height;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className} aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} opacity={0.8} />
      {/* last point */}
      <circle cx={lastX} cy={lastY} r={2} className="text-primary-500" />
    </svg>
  );
};

export default Sparkline;