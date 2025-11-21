import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { getHistoricalReadings, subscribeToLatestReadingCompat as subscribeToLatestReading } from '../utils/firebase';
import type { GasReading } from '../types';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const History: React.FC = () => {
  const [readings, setReadings] = useState<GasReading[]>([]);
  const [limit, setLimit] = useState<number>(100);
  const [isLiveBuffer, setIsLiveBuffer] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setIsLiveBuffer(false);
    let liveUnsub: (() => void) | null = null;
    (async () => {
      try {
        const data = await getHistoricalReadings(limit);
        const chronological = data.reverse();
        // Seed with historical, then always append live readings
        setReadings(chronological);
        setIsLiveBuffer(true);
        liveUnsub = subscribeToLatestReading((reading) => {
          if (!reading) return;
          setReadings((prev) => {
            const toMillis = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);
            const lastTs = prev.length ? toMillis(prev[prev.length - 1].timestamp) : 0;
            const incomingTs = toMillis(reading.timestamp);
            // If incoming timestamp is invalid or older than last point, use now
            const ts = Number.isFinite(incomingTs) && incomingTs > lastTs ? incomingTs : Date.now();
            const normalized: GasReading = { ...reading, timestamp: ts };
            // Deduplicate by id+timestamp
            const exists = prev.some(r => r.id === normalized.id && toMillis(r.timestamp) === ts);
            const base = exists ? prev : [...prev, normalized];
            // keep within limit, chronological left->right
            return base.slice(Math.max(0, base.length - limit));
          });
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Erreur lors du chargement des historiques';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (liveUnsub) liveUnsub(); };
  }, [limit]);

  // Handle timestamps in seconds or milliseconds
  const toMillis = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);
  const labels = readings.map(r => new Date(toMillis(r.timestamp)).toLocaleString('fr-FR'));

  const data = {
    labels,
    datasets: [
      {
        label: 'Gaz (ppm)',
        data: readings.map(r => r.gasLevel),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        pointRadius: 0,
        yAxisID: 'yGas',
      },
      {
        label: 'Humidité (%)',
        data: readings.map(r => r.humidity),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        pointRadius: 0,
        yAxisID: 'yHum',
      },
      {
        label: 'Température (°C)',
        data: readings.map(r => r.temperature),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.3,
        pointRadius: 0,
        yAxisID: 'yTemp',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      yGas: {
        type: 'linear' as const,
        position: 'left' as const,
        grid: { color: '#fee2e2' },
        ticks: { color: '#ef4444' },
      },
      yHum: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: '#3b82f6' },
      },
      yTemp: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: '#f59e0b' },
      },
    },
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Historique des mesures</h1>
          <p className="text-gray-600 dark:text-gray-400">Visualisation des données historiques : gaz, humidité et température</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Points</label>
          <select
            className="input-field"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          {isLiveBuffer && (
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Live buffer
            </span>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center">
            <p className="text-danger-700">{error}</p>
          </div>
        ) : (
          <div className="h-96">
            <Line data={data} options={options} />
          </div>
        )}
      </div>
    </div>
  );
};

export default History;