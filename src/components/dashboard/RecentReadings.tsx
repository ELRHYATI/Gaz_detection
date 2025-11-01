import React, { useEffect, useState } from 'react';
import { subscribeToLatestReading } from '../../utils/firebase';
import { calculateAlertLevel, getAlertBadgeClasses } from '../../utils/alerts';
import type { GasReading, Threshold } from '../../types';

interface RecentReadingsProps {
  thresholdOverride?: Threshold | null;
}

const fallbackThreshold: Threshold = {
  id: 'current',
  gasMin: 0,
  gasMax: 200,
  humidityMin: 20,
  humidityMax: 80,
  temperatureMin: 0,
  temperatureMax: 40,
  updatedAt: Date.now(),
  updatedBy: 'system'
};

const RecentReadings: React.FC<RecentReadingsProps> = ({ thresholdOverride }) => {
  const [readings, setReadings] = useState<GasReading[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToLatestReading((reading) => {
      if (!reading) return;
      setReadings((prev) => {
        const next = [reading, ...prev];
        return next.slice(0, 10);
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lectures récentes</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Dernières 10 mesures en temps réel</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Heure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gaz (ppm)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Température (°C)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Humidité (%)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {readings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-6 text-center text-gray-500 dark:text-gray-400">Aucune donnée pour le moment</td>
              </tr>
            ) : (
              readings.map((r, idx) => {
                const levelObj = calculateAlertLevel(r, thresholdOverride || fallbackThreshold);
                const badge = getAlertBadgeClasses(levelObj.level);
                const time = r.timestamp ? new Date(r.timestamp).toLocaleTimeString('fr-FR') : '-';
                return (
                  <tr key={`${r.timestamp || idx}-${idx}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{r.gasLevel?.toFixed(1) ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{r.temperature?.toFixed(1) ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{r.humidity?.toFixed(1) ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge}`}>
                        {levelObj.level === 'critical' ? 'Critique' : levelObj.level === 'danger' ? 'Danger' : levelObj.level === 'warning' ? 'Attention' : 'Sûr'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentReadings;