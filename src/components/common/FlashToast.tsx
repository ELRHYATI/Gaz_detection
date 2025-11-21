import React, { useEffect, useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';
import { createSafeStorage } from '../../utils/storage';

interface FlashPayload {
  type: 'success' | 'error' | 'info';
  message: string;
  ts?: number;
}

const storage = createSafeStorage('local', 'app:');
const KEY = 'flash_login_success';

// Small toast that shows once when a flash payload exists in storage.
const FlashToast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<FlashPayload | null>(null);

  useEffect(() => {
    const raw = storage.get(KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as FlashPayload;
      setPayload(data);
      setVisible(true);
    } catch {
      // ignore parse errors
    } finally {
      // Always clear flash so it only shows once
      storage.remove(KEY);
    }

    const t = window.setTimeout(() => setVisible(false), 4000);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible || !payload) return null;

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="px-4 py-3 rounded-lg shadow-lg border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center space-x-2">
        <FiCheckCircle className="h-5 w-5 text-emerald-600" />
        <span className="text-sm font-medium">{payload.message || 'Login successful'}</span>
      </div>
    </div>
  );
};

export default FlashToast;