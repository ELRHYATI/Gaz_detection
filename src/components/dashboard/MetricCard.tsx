import React from 'react';
import type { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import type { AlertLevel } from '../../types';
import { getAlertBadgeClasses } from '../../utils/alerts';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: IconType;
  trend?: 'up' | 'down';
  alertLevel: AlertLevel;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  alertLevel,
  className = ''
}) => {
  const badgeClasses = getAlertBadgeClasses(alertLevel.level);
  const progressColor =
    alertLevel.level === 'critical' ? 'bg-red-500' :
    alertLevel.level === 'danger' ? 'bg-danger-500' :
    alertLevel.level === 'warning' ? 'bg-yellow-500' :
    'bg-green-500';

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
            <Icon className={`h-6 w-6 text-gray-700 dark:text-gray-200`} />
          </div>
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
            {trend === 'up' ? <FiTrendingUp className="h-4 w-4" /> : <FiTrendingDown className="h-4 w-4" />}
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value.toFixed(1)}</div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{unit}</div>
      </div>

      {alertLevel.level !== 'safe' && (
        <div className="mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses}`}>
            {alertLevel.level === 'critical' ? 'Critique' : alertLevel.level === 'danger' ? 'Danger' : 'Attention'}
          </span>
        </div>
      )}

      <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min((value / 200) * 100, 100)}%` }} />
      </div>
    </div>
  );
};

export default MetricCard;