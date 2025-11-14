import { useEffect, useState } from 'react';
import { subscribeToSystemData } from '../utils/firebase';
import type { SystemData } from '../types';

export const useSystemData = () => {
  const [data, setData] = useState<SystemData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToSystemData(
      (d) => {
        setData(d);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || 'Unknown Firebase error');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  return { data, error, loading };
};

export default useSystemData;