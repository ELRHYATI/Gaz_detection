import React from 'react';

interface AlertModalProps {
  isOpen: boolean;
  severity: 'warning' | 'danger' | 'critical';
  location: string;
  parameter: 'gas' | 'humidity' | 'temperature';
  value: number;
  timestamp: number;
  message: string;
  onAcknowledge: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, severity, location, parameter, value, timestamp, message, onAcknowledge }) => {
  if (!isOpen) return null;
  const dt = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(timestamp);
  const borderClass = severity === 'critical' ? 'border-red-600' : severity === 'danger' ? 'border-orange-600' : 'border-yellow-600';
  const icon = severity === 'critical' ? '🔴' : severity === 'danger' ? '🚨' : '⚠️';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className={`bg-white dark:bg-gray-900 w-full max-w-lg rounded-lg shadow-lg border ${borderClass}`}>
        <div className="p-4 flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Danger detected</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{message}</p>
          </div>
        </div>
        <div className="px-4 pb-4 text-sm text-gray-700 dark:text-gray-200 space-y-1">
          <p><span className="font-medium">Location:</span> {location}</p>
          <p><span className="font-medium">Parameter:</span> {parameter}</p>
          <p><span className="font-medium">Value:</span> {value}</p>
          <p><span className="font-medium">Timestamp:</span> {dt}</p>
        </div>
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-b-lg flex justify-end">
          <button className="btn-danger" onClick={onAcknowledge}>Acknowledge</button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;