import React from 'react';
import type { AlertLevel } from '../../types';
import { getAlertIcon } from '../../utils/alerts';

interface AlertBannerProps {
  level: AlertLevel;
  message?: string;
  onDismiss?: () => void;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ level, message, onDismiss }) => {
  const icon = getAlertIcon(level.level);

  const getBannerClasses = (alert: AlertLevel['level']) => {
    switch (alert) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200';
      case 'danger':
        return 'bg-danger-50 border-danger-200 text-danger-800 dark:bg-danger-900/30 dark:border-danger-800 dark:text-danger-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200';
      default:
        return 'bg-green-50 border-green-200 text-green-800 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200';
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${getBannerClasses(level.level)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">
            {icon}
          </span>
          <div>
            <h3 className="font-semibold">
              {level.level === 'critical' ? 'Alerte Critique' :
               level.level === 'danger' ? 'Danger' :
               level.level === 'warning' ? 'Avertissement' : 'Normal'}
            </h3>
            <p className="text-sm mt-1">{message || level.message}</p>
          </div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {level.level === 'critical' && (
        <div className="mt-4 flex space-x-3">
          <button className="btn-danger text-sm">Évacuation d'urgence</button>
          <button className="btn-secondary text-sm">Contacter les secours</button>
        </div>
      )}
    </div>
  );
};

export default AlertBanner;