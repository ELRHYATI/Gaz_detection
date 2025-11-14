import React, { useEffect, useState } from 'react';
import { subscribeToLatestReadingCompat as subscribeToLatestReading } from '../../utils/firebase';
import { getAlertBadgeClasses } from '../../utils/alerts';
import type { GasReading, Threshold } from '../../types';
import { usePersistentState } from '../../hooks/usePersistentState';

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
  const [compact, setCompact] = usePersistentState<boolean>('table.compact', false, {
    storage: 'local',
    namespace: 'app:',
    deserialize: (raw) => {
      if (!raw) return null;
      if (raw === 'true') return true;
      if (raw === 'false') return false;
      try { const parsed = JSON.parse(raw); return typeof parsed === 'boolean' ? parsed : null; } catch { return null; }
    },
    validate: (x: any): x is boolean => typeof x === 'boolean',
  });

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
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lectures récentes</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Dernières 10 mesures en temps réel</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={compact}
              onChange={(e) => { const v = e.target.checked; setCompact(v); }}
              className="rounded border-gray-300 dark:border-gray-700"
            />
            Compact view
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className={`bg-gray-50 dark:bg-gray-800 ${compact ? 'text-xs' : ''}`}>
            <tr>
              <th className={`px-6 ${compact ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Heure</th>
              <th className={`px-6 ${compact ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Gaz (ppm)</th>
              <th className={`px-6 ${compact ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Température (°C)</th>
              <th className={`px-6 ${compact ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Humidité (%)</th>
              <th className={`px-6 ${compact ? 'py-2' : 'py-3'} text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>Statut</th>
            </tr>
          </thead>
          <tbody className={`bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700 ${compact ? 'text-sm' : ''}`}>
            {readings.length === 0 ? (
              <tr>
                <td colSpan={5} className={`px-6 ${compact ? 'py-4' : 'py-6'} text-center text-gray-500 dark:text-gray-400`}>Aucune donnée pour le moment</td>
              </tr>
            ) : (
              readings.map((r, idx) => {
                const th = thresholdOverride || fallbackThreshold;
                const gas = r.gasLevel ?? 0;
                let level: 'safe' | 'warning' | 'danger' | 'critical' = 'safe';
                if (gas > th.gasMax * 1.5) level = 'critical';
                else if (gas > th.gasMax || gas < th.gasMin) level = 'danger';
                else {
                  const range = (th.gasMax - th.gasMin) * 0.1;
                  if (gas > th.gasMax - range || gas < th.gasMin + range) level = 'warning';
                }
                const badge = getAlertBadgeClasses(level);
                const time = r.timestamp ? new Date(r.timestamp).toLocaleTimeString('fr-FR') : '-';
                return (
                  <tr key={`${r.timestamp || idx}-${idx}`} className={`${compact ? 'text-xs' : 'text-sm'}`}>
                    <td className={`px-6 ${compact ? 'py-2' : 'py-4'} whitespace-nowrap text-gray-700 dark:text-gray-300`}>{time}</td>
                    <td className={`px-6 ${compact ? 'py-2' : 'py-4'} whitespace-nowrap text-gray-900 dark:text-gray-100`}>{r.gasLevel?.toFixed(1) ?? '-'}</td>
                    <td className={`px-6 ${compact ? 'py-2' : 'py-4'} whitespace-nowrap text-gray-900 dark:text-gray-100`}>{r.temperature?.toFixed(1) ?? '-'}</td>
                    <td className={`px-6 ${compact ? 'py-2' : 'py-4'} whitespace-nowrap text-gray-900 dark:text-gray-100`}>{r.humidity?.toFixed(1) ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge}`}>
                        {level === 'critical' ? 'Critique' : level === 'danger' ? 'Danger' : level === 'warning' ? 'Attention' : 'Sûr'}
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