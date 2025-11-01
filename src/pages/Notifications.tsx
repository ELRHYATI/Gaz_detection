import React from 'react';
import { FiBell, FiAlertOctagon, FiInfo } from 'react-icons/fi';
import { useI18n } from '../contexts/I18nContext';

const Notifications: React.FC = () => {
  const { t } = useI18n();

  // Static sample notifications; can be wired to RTDB later
  const notifications = [
    {
      id: 'n1',
      type: 'critical' as const,
      title: t('notifications.gasAlert', 'Gas Level Alert'),
      description: t('notifications.gasAlertDesc', 'Gas levels have exceeded the threshold in Zone A'),
      time: '2 minutes ago',
      icon: <FiAlertOctagon className="h-5 w-5 text-red-600 dark:text-red-400" />,
      badgeClass: 'bg-red-100 dark:bg-red-900/40'
    },
    {
      id: 'n2',
      type: 'info' as const,
      title: t('notifications.systemUpdate', 'System Update'),
      description: t('notifications.systemUpdateDesc', 'Sensor calibration completed successfully'),
      time: '1 hour ago',
      icon: <FiInfo className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      badgeClass: 'bg-blue-100 dark:bg-blue-900/40'
    },
    {
      id: 'n3',
      type: 'success' as const,
      title: t('notifications.maintenance', 'Maintenance Complete'),
      description: t('notifications.maintenanceDesc', 'Scheduled maintenance has been completed'),
      time: '3 hours ago',
      icon: <FiBell className="h-5 w-5 text-green-600 dark:text-green-400" />,
      badgeClass: 'bg-green-100 dark:bg-green-900/40'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <FiBell className="h-6 w-6" />
            <span>{t('notifications.title', 'Notifications')}</span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">View and manage recent alerts.</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
          {notifications.map((n) => (
            <li key={n.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${n.badgeClass}`}>{n.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{n.description}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{n.time}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Notifications;