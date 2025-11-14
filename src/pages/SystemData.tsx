import React, { useEffect, useState } from 'react';
import { FiAlertOctagon, FiDatabase, FiSliders, FiCheckCircle } from 'react-icons/fi';
import useSystemData from '../hooks/useSystemData';
import { subscribeToLatestReadingCompat as subscribeToLatestReading, getHistoricalReadings } from '../utils/firebase';
import type { GasReading } from '../types';

const Badge: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>{text}</span>
);

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 shadow-sm p-4">
    <div className="flex items-center space-x-2 mb-3">
      <div className="h-8 w-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</h3>
    </div>
    {children}
  </div>
);

const SystemData: React.FC = () => {
  const { data, error, loading } = useSystemData();
  const [latest, setLatest] = useState<GasReading | null>(null);
  const [history, setHistory] = useState<GasReading[]>([]);
  const [histLoading, setHistLoading] = useState<boolean>(false);
  const [histError, setHistError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToLatestReading((r) => setLatest(r));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setHistLoading(true);
    setHistError(null);
    (async () => {
      try {
        const list = await getHistoricalReadings(200);
        setHistory(list);
      } catch (e: unknown) {
        setHistError(e instanceof Error ? e.message : 'Failed to load gas history');
      } finally {
        setHistLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Badge text="Loading system data…" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Badge text={`Error: ${error}`} className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Badge text="No data available" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" />
      </div>
    );
  }

  const { actuators, alerts, sensors } = data;

  const statusClass = (v?: string) =>
    v === 'ON' || v === 'OUVERT'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      : v === 'OFF' || v === 'FERME'
      ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';

  return (
    <div className="space-y-6">
      {/* Actuators */}
      <SectionCard title="Actuator States" icon={<FiSliders className="h-4 w-4 text-primary-600 dark:text-primary-400" />}> 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-sm text-gray-700 dark:text-gray-200">LED rouge</span>
            <Badge text={actuators.LED_rouge ?? 'unknown'} className={statusClass(actuators.LED_rouge)} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-sm text-gray-700 dark:text-gray-200">LED verte</span>
            <Badge text={actuators.LED_verte ?? 'unknown'} className={statusClass(actuators.LED_verte)} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-sm text-gray-700 dark:text-gray-200">Buzzer</span>
            <Badge text={actuators.buzzer ?? 'unknown'} className={statusClass(actuators.buzzer)} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-sm text-gray-700 dark:text-gray-200">Fenetres</span>
            <Badge text={actuators.fenetres ?? 'unknown'} className={statusClass(actuators.fenetres)} />
          </div>
        </div>
      </SectionCard>

      {/* Alerts */}
      <SectionCard title="Alert Records" icon={<FiAlertOctagon className="h-4 w-4 text-red-600 dark:text-red-400" />}> 
        {alerts.length === 0 ? (
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">No alerts</div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {alerts.map((a) => (
              <li key={a.id} className="py-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{a.id}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{JSON.stringify(a)}</p>
                  </div>
                  <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* Sensors */}
      <SectionCard title="Sensor Readings" icon={<FiDatabase className="h-4 w-4 text-blue-600 dark:text-blue-400" />}> 
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-200">MQ2 gas concentration</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sensors.MQ2 ?? 'n/a'}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-700 dark:text-gray-200">Timestamp</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{sensors.timestamp ?? 'n/a'}</p>
          </div>
        </div>
      </SectionCard>

      {/* Gas Data Details */}
      <SectionCard title="Gas Data Details" icon={<FiDatabase className="h-4 w-4 text-blue-600 dark:text-blue-400" />}> 
        {/* Most Recent Measurement */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Most Recent Gas Measurement</p>
          {latest ? (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-600 dark:text-gray-300">gasLevel (ppm)</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{latest.gasLevel}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-600 dark:text-gray-300">timestamp</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{latest.timestamp}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-600 dark:text-gray-300">humidity (%)</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{latest.humidity}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <p className="text-xs text-gray-600 dark:text-gray-300">temperature (°C)</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{latest.temperature}</p>
              </div>
            </div>
          ) : (
            <div className="mt-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">No latest reading available</div>
          )}
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
            Path: <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{latest?.id === 'compat' ? 'capteurs/MQ2 + capteurs/timestamp (fallback)' : 'latestReading'}</code>
          </div>
        </div>

        {/* Historical Readings */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">All Gas Level Readings</p>
          {histLoading ? (
            <div className="p-3">Loading history…</div>
          ) : histError ? (
            <div className="p-3 text-danger-700">{histError}</div>
          ) : history.length === 0 ? (
            <div className="p-3">No historical readings available</div>
          ) : (
            <div className="mt-2">
              {/* Calculated metric: average gas level */}
              <div className="mb-2 text-xs text-gray-600 dark:text-gray-300">
                Average gas level: <span className="font-semibold">{
                  Math.round((history.reduce((sum, r) => sum + r.gasLevel, 0) / history.length) * 100) / 100
                }</span> ppm (from {history.length} readings)
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-800">
                      <th className="py-2 pr-4">id</th>
                      <th className="py-2 pr-4">gasLevel</th>
                      <th className="py-2 pr-4">timestamp</th>
                      <th className="py-2 pr-4">humidity</th>
                      <th className="py-2 pr-4">temperature</th>
                      <th className="py-2 pr-4">location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.id} className="border-b border-gray-100 dark:border-gray-900">
                        <td className="py-2 pr-4">{r.id}</td>
                        <td className="py-2 pr-4">{r.gasLevel}</td>
                        <td className="py-2 pr-4">{r.timestamp}</td>
                        <td className="py-2 pr-4">{r.humidity}</td>
                        <td className="py-2 pr-4">{r.temperature}</td>
                        <td className="py-2 pr-4">{r.location ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                Path: <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">gasReadings</code>
              </div>
            </div>
          )}
        </div>

        {/* Raw paths reference */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Data Paths in Firebase</p>
          <ul className="mt-1 text-xs text-gray-700 dark:text-gray-300 list-disc pl-4">
            <li><code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">latestReading</code> — Preferred current reading object</li>
            <li><code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">capteurs/MQ2</code> and <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">capteurs/timestamp</code> — Fallback live values</li>
            <li><code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">gasReadings</code> — Historical list of readings</li>
          </ul>
        </div>
      </SectionCard>
    </div>
  );
};

export default SystemData;