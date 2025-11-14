import React from 'react';

const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 h-10 w-10" />
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
      <div className="h-4 w-8 bg-gray-200 dark:bg-gray-800 rounded" />
    </div>
    <div className="flex items-baseline space-x-2">
      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
      <div className="h-4 w-10 bg-gray-200 dark:bg-gray-800 rounded" />
    </div>
    <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden" />
  </div>
);

export default SkeletonCard;