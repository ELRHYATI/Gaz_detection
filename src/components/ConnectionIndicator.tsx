import React from 'react';
import type { ConnectionStatus } from '../hooks/useRealtimeStatus';

type Props = {
  status: ConnectionStatus;
  updating?: boolean;
  className?: string;
};

const colorFor = (status: ConnectionStatus) => {
  switch (status) {
    case 'connected': return '#16a34a';
    case 'reconnecting': return '#f59e0b';
    case 'polling': return '#3b82f6';
    case 'disconnected': return '#ef4444';
    case 'inactive': return '#FF0000';
    default: return '#6b7280';
  }
};

export const ConnectionIndicator: React.FC<Props> = ({ status, updating = false, className }) => {
  const color = colorFor(status);
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        title={`Status: ${status}${updating ? ' (updating)' : ''}`}
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: color,
          position: 'relative',
          boxShadow: updating ? `0 0 0 3px ${color}33` : 'none',
          animation: updating ? 'pulse 0.6s ease-out infinite' : 'none',
        }}
      />
      <span style={{ fontSize: 12, color: '#374151' }}>
        {status === 'connected' && (updating ? 'Live • updating' : 'Live')}
        {status === 'reconnecting' && 'Reconnecting…'}
        {status === 'polling' && (updating ? 'Polling • updating' : 'Polling')}
        {status === 'disconnected' && 'Offline'}
        {status === 'inactive' && 'Inactive'}
      </span>
      <style>
        {`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 ${color}66; }
          70% { box-shadow: 0 0 0 6px ${color}00; }
          100% { box-shadow: 0 0 0 0 ${color}00; }
        }
        `}
      </style>
    </div>
  );
};

export default ConnectionIndicator;