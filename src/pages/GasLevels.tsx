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
import { subscribeToLatestReading } from '../utils/firebase';
import type { GasReading } from '../types';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const GasLevels: React.FC = () => {
  const [points, setPoints] = useState<{ x: string; y: number }[]>([]);
  const [isDark, setIsDark] = useState<boolean>(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const unsubscribe = subscribeToLatestReading((reading: GasReading | null) => {
      if (!reading) return;
      const time = new Date(reading.timestamp).toLocaleTimeString('fr-FR');
      setPoints((prev) => {
        const next = [...prev, { x: time, y: reading.gasLevel }];
        return next.slice(-20);
      });
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const data = {
    labels: points.map((p) => p.x),
    datasets: [
      {
        label: 'Gaz (ppm)',
        data: points.map((p) => p.y),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: isDark ? '#e5e7eb' : '#374151',
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? '#e5e7eb' : '#374151',
        },
      },
      y: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e5e7eb',
        },
        ticks: {
          stepSize: 20,
          color: isDark ? '#e5e7eb' : '#374151',
        },
      },
    },
  } as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Niveaux de gaz</h1>
          <p className="text-gray-600 dark:text-gray-300">Évolution en temps réel des mesures de gaz</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="h-80">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default GasLevels;