import React, { useEffect, useState } from 'react';
import { subscribeToActuatorStates } from '../../utils/firebase';
import type { ActuatorStates } from '../../types';

const Badge: React.FC<{ label: string; value?: string; color?: string }> = ({ label, value, color }) => (
  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div className={`text-sm font-semibold ${color || 'text-gray-900 dark:text-gray-100'}`}>{label}</div>
    <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value ?? '--'}</div>
  </div>
);

const ActuatorsCard: React.FC = () => {
  const [states, setStates] = useState<ActuatorStates>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToActuatorStates((s) => setStates(s), (e) => setError(e.message));
    return () => unsubscribe();
  }, []);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actuators</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">Live</div>
      </div>
      {error && (
        <div className="mb-3 text-sm text-red-600">{error}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div aria-readonly="true">
          <Badge label="LED rouge" value={states.LED_rouge} color={states.LED_rouge === 'ON' ? 'text-red-600' : 'text-gray-600'} />
        </div>
        <div aria-readonly="true">
          <Badge label="LED verte" value={states.LED_verte} color={states.LED_verte === 'ON' ? 'text-green-600' : 'text-gray-600'} />
        </div>
        <div aria-readonly="true">
          <Badge label="Buzzer" value={states.buzzer} color={states.buzzer === 'ON' ? 'text-yellow-600' : 'text-gray-600'} />
        </div>
        <div aria-readonly="true">
          <Badge label="Fenetres" value={states.fenetres} color={states.fenetres === 'OUVERT' ? 'text-emerald-600' : 'text-gray-600'} />
        </div>
      </div>
    </div>
  );
};

export default ActuatorsCard;