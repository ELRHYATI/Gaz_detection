import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'polling' | 'disconnected';

export const useRealtimeStatus = () => {
  const [connected, setConnected] = useState<boolean>(true);
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [lastChangeTs, setLastChangeTs] = useState<number>(Date.now());

  useEffect(() => {
    const infoRef = ref(database, '.info/connected');
    onValue(infoRef, (snap) => {
      const c = !!snap.val();
      setConnected(c);
      setLastChangeTs(Date.now());
      setStatus(c ? 'connected' : 'reconnecting');
    });
    return () => off(infoRef);
  }, []);

  return { connected, status, lastChangeTs, setStatus };
};

export default useRealtimeStatus;