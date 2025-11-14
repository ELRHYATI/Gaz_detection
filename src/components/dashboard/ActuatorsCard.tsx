import React, { useEffect, useState } from 'react';
import { subscribeToActuatorStates, setActuatorStates } from '../../utils/firebase';
import type { ActuatorStates } from '../../types';

const Badge: React.FC<{ label: string; value?: string; color?: string }> = ({ label, value, color }) => (
  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div className={`text-sm font-semibold ${color || 'text-gray-900 dark:text-gray-100'}`}>{label}</div>
    <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? '--'}</div>
  </div>
);

const ActuatorsCard: React.FC = () => {
  const [states, setStates] = useState<ActuatorStates>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToActuatorStates((s) => setStates(s), (e) => setError(e.message));
    return () => unsubscribe();
  }, []);

  const toggle = async (key: 'LED_rouge' | 'LED_verte' | 'buzzer') => {
    const current = states[key] || 'OFF';
    const next = current === 'ON' ? 'OFF' : 'ON';
    if (!confirm(`Confirm switching ${key} to ${next}?`)) return;
    try {
      setBusy(true);
      await setActuatorStates({ [key]: next });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleWindow = async () => {
    const current = states.fenetres || 'FERME';
    const next = current === 'OUVERT' ? 'FERME' : 'OUVERT';
    if (!confirm(`Confirm switching fenetres to ${next}?`)) return;
    try {
      setBusy(true);
      await setActuatorStates({ fenetres: next });
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actuators</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">{busy ? 'Applying...' : 'Live'}</div>
      </div>
      {error && (
        <div className="mb-3 text-sm text-red-600">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cursor-pointer" onClick={() => toggle('LED_rouge')}>
          <Badge label="LED rouge" value={states.LED_rouge} color={states.LED_rouge === 'ON' ? 'text-red-600' : 'text-gray-600'} />
        </div>
        <div className="cursor-pointer" onClick={() => toggle('LED_verte')}>
          <Badge label="LED verte" value={states.LED_verte} color={states.LED_verte === 'ON' ? 'text-green-600' : 'text-gray-600'} />
        </div>
        <div className="cursor-pointer" onClick={() => toggle('buzzer')}>
          <Badge label="Buzzer" value={states.buzzer} color={states.buzzer === 'ON' ? 'text-yellow-600' : 'text-gray-600'} />
        </div>
        <div className="cursor-pointer" onClick={toggleWindow}>
          <Badge label="Fenetres" value={states.fenetres} color={states.fenetres === 'OUVERT' ? 'text-emerald-600' : 'text-gray-600'} />
        </div>
      </div>
    </div>
  );
};

export default ActuatorsCard;