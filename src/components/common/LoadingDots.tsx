import React from 'react'

const LoadingDots: React.FC<{ label?: string }> = ({ label = 'Loading…' }) => {
  return (
    <div className="p-6 flex items-center justify-center">
      <span className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <span className="relative w-6 h-6">
          <span className="absolute inline-block w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ left: 0, animationDelay: '0ms' }} />
          <span className="absolute inline-block w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ left: '8px', animationDelay: '120ms' }} />
          <span className="absolute inline-block w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full animate-bounce" style={{ left: '16px', animationDelay: '240ms' }} />
        </span>
        <span className="text-sm">{label}</span>
      </span>
    </div>
  )
}

export default LoadingDots