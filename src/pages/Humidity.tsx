import React, { useEffect, useState } from 'react';
import { FiDroplet } from 'react-icons/fi';
import { subscribeToLatestReadingCompat as subscribeToLatestReading } from '../utils/firebase';
import type { GasReading } from '../types';

const Humidity: React.FC = () => {
  const [humidity, setHumidity] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToLatestReading((reading: GasReading | null) => {
      if (!reading) return;
      setHumidity(reading.humidity ?? 0);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Humidité</h1>
          <p className="text-gray-600 dark:text-gray-400">Humidité ambiante en temps réel</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <FiDroplet className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{humidity?.toFixed(1) ?? '--'}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Humidity;