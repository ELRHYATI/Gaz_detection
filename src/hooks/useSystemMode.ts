import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../config/firebase';

export type SystemMode = 'active' | 'inactive';

export const useSystemMode = () => {
  const [mode, setMode] = useState<SystemMode>('active');
  const [lastChangeTs, setLastChangeTs] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const statusRef = ref(database, 'system/status');
    onValue(statusRef, (snap) => {
      const v = snap.val();
      if (v === 'inactive' || v === 'active') {
        setMode(v);
        setLastChangeTs(Date.now());
      }
    }, (err) => setError(err?.message || 'System status error'));
    return () => off(statusRef);
  }, []);

  return { mode, lastChangeTs, error };
};

export default useSystemMode;