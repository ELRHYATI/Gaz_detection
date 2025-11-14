import { ref, set, get, onValue, off, push, remove } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { database, functionsClient } from '../config/firebase';
import { buildEmergencyMessage } from './emergency';
import type { GasReading, Threshold, ServoMotorState, ActuatorStates, AlertRecord, SensorReadings, SystemData, OnOff, FenetreState, MotorStatus, MotorLog } from '../types';

// Gas readings operations
export const saveGasReading = async (reading: Omit<GasReading, 'id'>) => {
  try {
    const readingsRef = ref(database, 'gasReadings');
    const newReadingRef = push(readingsRef);
    await set(newReadingRef, {
      ...reading,
      id: newReadingRef.key
    });
    return newReadingRef.key;
  } catch (error) {
    console.error('Error saving gas reading:', error);
    throw error;
  }
};

export const subscribeToLatestReading = (callback: (reading: GasReading | null) => void) => {
  const latestReadingRef = ref(database, 'latestReading');
  onValue(latestReadingRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  return () => off(latestReadingRef);
};

// Compatibility stream: if 'latestReading' is missing or invalid, fall back to 'capteurs' (MQ2/timestamp)
const isValidGasReading = (r: any): r is GasReading => {
  return r && typeof r === 'object'
    && typeof r.gasLevel === 'number'
    && typeof r.timestamp === 'number'
    && typeof r.humidity === 'number'
    && typeof r.temperature === 'number';
};

export const subscribeToLatestReadingCompat = (callback: (reading: GasReading | null) => void) => {
  const latestRef = ref(database, 'latestReading');
  const sensorsRef = ref(database, 'capteurs');
  let hasValidLatest = false;

  onValue(latestRef, (snap) => {
    const val = snap.val();
    if (isValidGasReading(val)) {
      hasValidLatest = true;
      callback(val);
    } else {
      hasValidLatest = false;
      // do not emit here; wait for sensors fallback
    }
  });

  onValue(sensorsRef, (snap) => {
    if (hasValidLatest) return; // prefer latestReading when valid
    const s = snap.val();
    if (!s || typeof s !== 'object') {
      callback(null);
      return;
    }
    const mq2Node = (s as any).MQ2 ?? (s as any).mq2;
    const mq2Raw = typeof mq2Node === 'object' && mq2Node !== null ? (mq2Node.concentration ?? mq2Node.value ?? mq2Node.level) : mq2Node;
    const tsRaw = (s as any).timestamp ?? (s as any).time ?? (s as any).ts;
    const gasLevel = typeof mq2Raw === 'number' ? mq2Raw : Number.isFinite(Number(mq2Raw)) ? Number(mq2Raw) : 0;
    const timestamp = typeof tsRaw === 'number' ? tsRaw : Number.isFinite(Number(tsRaw)) ? Number(tsRaw) : Date.now();
    const fallback: GasReading = {
      id: 'compat',
      gasLevel,
      humidity: 0,
      temperature: 0,
      timestamp,
    };
    callback(fallback);
  });

  return () => { off(latestRef); off(sensorsRef); };
};

export const getHistoricalReadings = async (limit: number = 100): Promise<GasReading[]> => {
  try {
    const readingsRef = ref(database, 'gasReadings');
    const snapshot = await get(readingsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const values = Object.values(data) as GasReading[];
      return values
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    }
    return [];
  } catch (error) {
    console.error('Error fetching historical readings:', error);
    throw error;
  }
};

// Threshold operations
export const saveThreshold = async (threshold: Omit<Threshold, 'id'>) => {
  try {
    const thresholdRef = ref(database, 'thresholds/current');
    await set(thresholdRef, {
      ...threshold,
      id: 'current'
    });
  } catch (error) {
    console.error('Error saving threshold:', error);
    throw error;
  }
};

export const getThreshold = async (): Promise<Threshold | null> => {
  try {
    const thresholdRef = ref(database, 'thresholds/current');
    const snapshot = await get(thresholdRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as Threshold;
    }
    return null;
  } catch (error) {
    console.error('Error fetching threshold:', error);
    throw error;
  }
};

export const subscribeToThreshold = (callback: (threshold: Threshold | null) => void) => {
  const thresholdRef = ref(database, 'thresholds/current');
  onValue(thresholdRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  return () => off(thresholdRef);
};

// Servo motor operations
export const updateServoMotorState = async (state: Omit<ServoMotorState, 'id'>) => {
  try {
    const servoRef = ref(database, 'servoMotor/current');
    await set(servoRef, {
      ...state,
      id: 'current'
    });
  } catch (error) {
    console.error('Error updating servo motor state:', error);
    throw error;
  }
};

export const getServoMotorState = async (): Promise<ServoMotorState | null> => {
  try {
    const servoRef = ref(database, 'servoMotor/current');
    const snapshot = await get(servoRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as ServoMotorState;
    }
    return null;
  } catch (error) {
    console.error('Error fetching servo motor state:', error);
    throw error;
  }
};

export const subscribeToServoMotorState = (callback: (state: ServoMotorState | null) => void) => {
  const servoRef = ref(database, 'servoMotor/current');
  onValue(servoRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  return () => off(servoRef);
};

// Window control operations (bidirectional sync with Cloud Functions)
export type WindowState = 'open' | 'closed';
export interface WindowControl {
  current_state: WindowState;
  servo_position: number;
  last_updated: number;
  manual_override: boolean;
}

export const subscribeToWindowControl = (
  callback: (ctrl: WindowControl | null) => void,
  onError?: (error: Error) => void
) => {
  const wcRef = ref(database, 'window_control');
  const cancel = (err: unknown) => onError?.(err as Error);
  onValue(wcRef, (snap) => {
    const val = snap.val();
    if (!val || typeof val !== 'object') {
      callback(null);
      return;
    }
    callback(val as WindowControl);
  }, cancel);
  return () => off(wcRef);
};

export const setWindowManualOverride = async (enabled: boolean) => {
  try {
    const refOverride = ref(database, 'window_control/manual_override');
    await set(refOverride, enabled);
  } catch (error) {
    console.error('Error setting manual override:', error);
    throw error;
  }
};

export const setWindowControlState = async (state: WindowState) => {
  try {
    const ts = Date.now();
    const wcStateRef = ref(database, 'window_control/current_state');
    const wcServoRef = ref(database, 'window_control/servo_position');
    const wcUpdatedRef = ref(database, 'window_control/last_updated');
    await set(wcStateRef, state);
    await set(wcServoRef, state === 'open' ? 90 : 0);
    await set(wcUpdatedRef, ts);
  } catch (error) {
    console.error('Error setting window control state:', error);
    throw error;
  }
};

// Commandes: servo_manuel — open/close manually via RTDB
export const subscribeToServoManuelCommand = (
  callback: (cmd: 'open' | 'closed' | null) => void,
  onError?: (error: Error) => void
) => {
  const cmdRef = ref(database, 'commandes/servo_manuel');
  onValue(cmdRef, (snap) => {
    const val = snap.val();
    let state: 'open' | 'closed' | null = null;
    if (typeof val === 'boolean') state = val ? 'open' : 'closed';
    else if (typeof val === 'number') state = val !== 0 ? 'open' : 'closed';
    else if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      if (['ouvert','ouvrir','open','on'].includes(s)) state = 'open';
      else if (['ferme','fermer','closed','close','off'].includes(s)) state = 'closed';
    }
    callback(state);
  }, (err) => onError?.(err as Error));
  return () => off(cmdRef);
};

export const setServoManuelCommand = async (state: 'open' | 'closed') => {
  await set(ref(database, 'commandes/servo_manuel'), state);
};

// User settings: WhatsApp phone number
export const getUserWhatsAppPhone = async (uid: string): Promise<string | null> => {
  try {
    const r = ref(database, `user_settings/${uid}/whatsapp_phone`);
    const snap = await get(r);
    const val = snap.val();
    return typeof val === 'string' ? val : null;
  } catch (e) {
    console.warn('Failed to read WhatsApp phone', e);
    return null;
  }
};

export const setUserWhatsAppPhone = async (uid: string, phone: string): Promise<void> => {
  // E.164 format validation
  if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
    throw new Error('Invalid phone format. Use +[country][number].');
  }
  const r = ref(database, `user_settings/${uid}/whatsapp_phone`);
  await set(r, phone);
};

// (SMS via Email-to-SMS removed)

// Callable function: send WhatsApp panic alert
export interface WhatsAppSendParams {
  to: string;
  body: string;
  meta?: Record<string, unknown>;
}

export const sendWhatsAppPanic = async (params: WhatsAppSendParams): Promise<{ sid: string; status: string } | null> => {
  try {
    const fn = httpsCallable(functionsClient, 'sendWhatsAppAlert');
    const res = await fn({ to: params.to, body: params.body, meta: params.meta });
    const data = res.data as { sid: string; status: string };
    return data || null;
  } catch (e) {
    console.error('sendWhatsAppPanic error', e);
    return null;
  }
};

export const composeEmergencyWhatsApp = (inp: {
  type: 'gas' | 'humidity' | 'temperature';
  severity: 'danger' | 'critical';
  value: number;
  timestamp: number;
  location?: string;
  actions?: string[];
  contacts?: string[];
}) => buildEmergencyMessage(inp);

// --- Message templates CRUD ---
export type SeverityKey = 'critical' | 'high' | 'medium' | 'low';
export interface TemplateVersion {
  id: string;
  template: string;
  actions?: string[];
  created_at: number;
  created_by?: string;
}

export const getActiveTemplate = async (severity: SeverityKey): Promise<TemplateVersion | null> => {
  const av = await get(ref(database, `message_templates/${severity}/active_version`));
  const activeId = av.val();
  if (!activeId) return null;
  const snap = await get(ref(database, `message_templates/${severity}/versions/${activeId}`));
  const val = snap.val() || null;
  if (!val) return null;
  const { id: _omit, ...rest } = val as TemplateVersion;
  return { id: activeId, ...(rest as Omit<TemplateVersion, 'id'>) };
};

export const listTemplateVersions = async (severity: SeverityKey): Promise<TemplateVersion[]> => {
  const snap = await get(ref(database, `message_templates/${severity}/versions`));
  const val = (snap.val() || {}) as Record<string, Omit<TemplateVersion, 'id'>>;
  return Object.entries(val)
    .map(([id, v]) => {
      const rest = (v || {}) as Omit<TemplateVersion, 'id'>;
      return { id, ...rest } as TemplateVersion;
    })
    .sort((a, b) => b.created_at - a.created_at);
};

export const saveTemplateVersion = async (severity: SeverityKey, data: Omit<TemplateVersion, 'id' | 'created_at'> & { created_by?: string }): Promise<string> => {
  const versionsRef = ref(database, `message_templates/${severity}/versions`);
  const newRef = push(versionsRef);
  const id = newRef.key as string;
  await set(newRef, { template: data.template, actions: data.actions || [], created_at: Date.now(), created_by: data.created_by || '' });
  return id;
};

export const activateTemplateVersion = async (severity: SeverityKey, versionId: string): Promise<void> => {
  await set(ref(database, `message_templates/${severity}/active_version`), versionId);
};

export const renderTemplate = (template: string, vars: Record<string, string | number>) => {
  let out = template || '';
  Object.entries(vars).forEach(([k, v]) => {
    out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(v));
  });
  return out;
};

// --- Notification providers settings (admin-managed) ---
export interface NotificationProvidersSettings {
  primary?: 'callmebot' | 'telegram';
  callmebot?: { phone?: string; apikey?: string };
  telegram?: { token?: string; chat_id?: string };
}

export const getNotificationProvidersSettings = async (): Promise<NotificationProvidersSettings | null> => {
  try {
    const snap = await get(ref(database, 'notification_settings/providers'));
    const val = snap.val();
    return val || null;
  } catch (e) {
    console.warn('Failed to read notification providers settings', e);
    return null;
  }
};

export const saveNotificationProvidersSettings = async (settings: NotificationProvidersSettings): Promise<void> => {
  await set(ref(database, 'notification_settings/providers'), settings);
};

export const mapSeverityKey = (severity: 'critical' | 'danger' | 'warning' | 'safe'): SeverityKey => {
  switch (severity) {
    case 'critical': return 'critical';
    case 'danger': return 'high';
    case 'warning': return 'medium';
    default: return 'low';
  }
};

// ===== External RTDB: actuators, alerts, sensors =====

const isOnOff = (v: unknown): v is OnOff => v === 'ON' || v === 'OFF';
const isFenetre = (v: unknown): v is FenetreState => v === 'FERME' || v === 'OUVERT';

// Flexible normalization: accept booleans, numbers, and common strings
const normalizeOnOff = (v: unknown): OnOff | undefined => {
  if (v === 'ON' || v === 'OFF') return v as OnOff;
  if (typeof v === 'boolean') return v ? 'ON' : 'OFF';
  if (typeof v === 'number') return v !== 0 ? 'ON' : 'OFF';
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'on' || s === '1' || s === 'true' || s === 'yes') return 'ON';
    if (s === 'off' || s === '0' || s === 'false' || s === 'no') return 'OFF';
  }
  return undefined;
};

const normalizeFenetre = (v: unknown): FenetreState | undefined => {
  if (v === 'OUVERT' || v === 'FERME') return v as FenetreState;
  if (typeof v === 'boolean') return v ? 'OUVERT' : 'FERME';
  if (typeof v === 'number') return v !== 0 ? 'OUVERT' : 'FERME';
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'ouvert' || s === 'open' || s === '1' || s === 'true' || s === 'yes') return 'OUVERT';
    if (s === 'ferme' || s === 'closed' || s === '0' || s === 'false' || s === 'no') return 'FERME';
  }
  return undefined;
};

// Actuators: LED_rouge, LED_verte, buzzer, fenetres
export const subscribeToActuatorStates = (
  callback: (states: ActuatorStates) => void,
  onError?: (error: Error) => void
) => {
  const paths = ['LED_rouge', 'LED_verte', 'buzzer', 'fenetres'] as const;
  const current: ActuatorStates = {};

  const cleanups = paths.map((p) => {
    const r = ref(database, p);
    const cancel = (err: unknown) => onError?.(err as Error);
    onValue(r, (snap) => {
      const val = snap.val();
      try {
        if (p === 'fenetres') {
          current.fenetres = normalizeFenetre(val);
        } else if (p === 'LED_rouge') {
          current.LED_rouge = normalizeOnOff(val);
        } else if (p === 'LED_verte') {
          current.LED_verte = normalizeOnOff(val);
        } else if (p === 'buzzer') {
          current.buzzer = normalizeOnOff(val);
        }
        callback({ ...current });
      } catch (e) {
        onError?.(e as Error);
      }
    }, cancel);
    return () => off(r);
  });

  return () => {
    cleanups.forEach((u) => u());
  };
};

// Actionneurs/fenetres helpers
export const subscribeToActionneursFenetre = (
  callback: (state: FenetreState | null) => void,
  onError?: (error: Error) => void
) => {
  const fenRef = ref(database, 'actionneurs/fenetres');
  const cancel = (err: unknown) => onError?.(err as Error);
  onValue(fenRef, (snap) => {
    const val = snap.val();
    callback(isFenetre(val) ? val : null);
  }, cancel);
  return () => off(fenRef);
};

export const setActionneursFenetre = async (state: FenetreState, actor?: string) => {
  try {
    const fenRef = ref(database, 'actionneurs/fenetres');
    await set(fenRef, state);
    // optional lightweight log
    const logRef = ref(database, `actuators_logs`);
    const newLog = push(logRef);
    await set(newLog, { timestamp: Date.now(), changes: `actionneurs/fenetres=${state}${actor ? ` by ${actor}` : ''}` });
  } catch (error) {
    console.error('Error setting actionneurs/fenetres:', error);
    throw error;
  }
};

// Update actuators with validation; supports partial updates and logs each change
export const setActuatorStates = async (updates: Partial<ActuatorStates>, actor?: string) => {
  const tasks: Promise<any>[] = [];
  const changes: string[] = [];
  if (updates.LED_rouge !== undefined) {
    if (!isOnOff(updates.LED_rouge)) throw new Error('Invalid LED_rouge value');
    tasks.push(set(ref(database, 'LED_rouge'), updates.LED_rouge));
    changes.push(`LED_rouge=${updates.LED_rouge}`);
  }
  if (updates.LED_verte !== undefined) {
    if (!isOnOff(updates.LED_verte)) throw new Error('Invalid LED_verte value');
    tasks.push(set(ref(database, 'LED_verte'), updates.LED_verte));
    changes.push(`LED_verte=${updates.LED_verte}`);
  }
  if (updates.buzzer !== undefined) {
    if (!isOnOff(updates.buzzer)) throw new Error('Invalid buzzer value');
    tasks.push(set(ref(database, 'buzzer'), updates.buzzer));
    changes.push(`buzzer=${updates.buzzer}`);
  }
  if (updates.fenetres !== undefined) {
    if (!isFenetre(updates.fenetres)) throw new Error('Invalid fenetres value');
    tasks.push(set(ref(database, 'fenetres'), updates.fenetres));
    changes.push(`fenetres=${updates.fenetres}`);
  }
  if (tasks.length === 0) return;
  await Promise.all(tasks);
  // log
  const logRef = push(ref(database, 'actuators_logs'));
  await set(logRef, {
    id: logRef.key,
    timestamp: Date.now(),
    actor: actor || 'system',
    changes: changes.join(', '),
  });
};

// Alerts under "alertes" (IDs as keys)
export const subscribeToAlerts = (
  callback: (alerts: AlertRecord[]) => void,
  onError?: (error: Error) => void
) => {
  const alertsRef = ref(database, 'alertes');
  onValue(
    alertsRef,
    (snapshot) => {
      try {
        const val = snapshot.val();
        if (!val || typeof val !== 'object') {
          callback([]);
          return;
        }
        const entries = Object.entries(val);
        const list: AlertRecord[] = entries.map(([id, data]) => ({ id, ...(typeof data === 'object' ? data : { value: data }) }));
        callback(list);
      } catch (e) {
        onError?.(e as Error);
      }
    },
    (err) => onError?.(err as Error)
  );

  return () => off(alertsRef);
};

// Ensure a set of alert IDs exist under 'alertes'
export const ensureAlertIds = async (ids: string[]) => {
  const alertsRef = ref(database, 'alertes');
  const snapshot = await get(alertsRef);
  const existing = snapshot.exists() ? snapshot.val() : {};
  const tasks: Promise<any>[] = [];
  ids.forEach((id) => {
    if (!existing || !existing[id]) {
      tasks.push(set(ref(database, `alertes/${id}`), { createdAt: Date.now(), status: 'active' }));
    }
  });
  await Promise.all(tasks);
};

// Append structured alert log under 'alerts_logs'
export interface AlertLogEntry {
  id?: string;
  timestamp: number;
  severity: 'warning' | 'danger' | 'critical';
  parameter: 'gas' | 'humidity' | 'temperature';
  value: number;
  threshold?: Partial<Threshold>;
  location?: string;
  message?: string;
  acknowledged?: boolean;
}

export const appendAlertLog = async (entry: AlertLogEntry) => {
  const logsRef = ref(database, 'alerts_logs');
  const newRef = push(logsRef);
  const record = { ...entry, id: newRef.key };
  await set(newRef, record);
  return record.id as string;
};

export const acknowledgeAlertLog = async (id: string) => {
  const logRef = ref(database, `alerts_logs/${id}/acknowledged`);
  await set(logRef, true);
};

export const deleteAlertLog = async (id: string) => {
  const logRef = ref(database, `alerts_logs/${id}`);
  await remove(logRef);
};

// Subscribe to structured alert logs under 'alerts_logs'
export const subscribeToAlertLogs = (
  callback: (logs: AlertLogEntry[]) => void,
  onError?: (error: Error) => void,
  limit?: number
) => {
  const logsRef = ref(database, 'alerts_logs');
  onValue(
    logsRef,
    (snapshot) => {
      try {
        const val = snapshot.val();
        if (!val || typeof val !== 'object') {
          callback([]);
          return;
        }
        const logs = Object.values(val) as AlertLogEntry[];
        const sorted = logs
          .filter((l) => typeof l.timestamp === 'number')
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        const sliced = typeof limit === 'number' && limit > 0 ? sorted.slice(0, limit) : sorted;
        callback(sliced);
      } catch (e) {
        onError?.(e as Error);
      }
    },
    (err) => onError?.(err as Error)
  );
  return () => off(logsRef);
};

// Active alerts with expiry tracking
export interface ActiveAlertRecord {
  severity: 'warning' | 'danger' | 'critical';
  parameter: 'gas' | 'humidity' | 'temperature';
  value: number;
  location?: string;
  message?: string;
  started_at: number;
  last_updated: number;
  expires_at: number; // started_at + 10min for danger
  dismissed?: boolean;
  dismiss_reason?: 'manual' | 'resolved' | 'expired';
  resolved_at?: number;
}

const activeAlertPath = (fingerprint: string) => `alerts_active/${fingerprint}`;

export const upsertActiveAlert = async (fingerprint: string, record: Omit<ActiveAlertRecord, 'started_at' | 'expires_at' | 'last_updated'> & { started_at?: number; expires_at?: number }) => {
  const path = activeAlertPath(fingerprint);
  const snap = await get(ref(database, path));
  const now = Date.now();
  const started = snap.exists() && typeof (snap.val() as any).started_at === 'number' ? (snap.val() as any).started_at : (record.started_at || now);
  const expires = record.expires_at ?? (started + 10 * 60 * 1000);
  const merged: ActiveAlertRecord = {
    severity: record.severity,
    parameter: record.parameter,
    value: record.value,
    location: record.location,
    message: record.message,
    started_at: started,
    last_updated: now,
    expires_at: expires,
    dismissed: snap.exists() ? (snap.val() as any).dismissed : false,
    dismiss_reason: snap.exists() ? (snap.val() as any).dismiss_reason : undefined,
    resolved_at: snap.exists() ? (snap.val() as any).resolved_at : undefined,
  };
  await set(ref(database, path), merged);
  return merged;
};

export const dismissActiveAlert = async (
  fingerprint: string,
  reason: 'manual' | 'resolved' | 'expired',
  context?: { severity: ActiveAlertRecord['severity']; parameter: ActiveAlertRecord['parameter']; value?: number; message?: string }
) => {
  const path = activeAlertPath(fingerprint);
  const now = Date.now();
  await set(ref(database, path), {
    ...(await (async () => {
      const s = await get(ref(database, path));
      return s.exists() ? s.val() : {};
    })()),
    dismissed: true,
    dismiss_reason: reason,
    resolved_at: reason === 'resolved' ? now : undefined,
  });
  // audit log
  const msg =
    context?.message ?? (reason === 'expired' ? 'Auto-dismiss after 10 minutes' : reason === 'manual' ? 'Manual dismissal' : 'Resolved before expiry');
  if (context) {
    await appendAlertLog({
      timestamp: now,
      severity: context.severity,
      parameter: context.parameter,
      value: context.value ?? 0,
      message: msg,
      acknowledged: true,
    });
  }
};

// Sensors under "capteurs" (e.g., MQ2, timestamp)
export const subscribeToSensorReadings = (
  callback: (readings: SensorReadings) => void,
  onError?: (error: Error) => void
) => {
  const sensorsRef = ref(database, 'capteurs');
  onValue(
    sensorsRef,
    (snapshot) => {
      try {
        const val = snapshot.val();
        const readings: SensorReadings = {};
        if (val && typeof val === 'object') {
          const mq2Node = (val as any).MQ2 ?? (val as any).mq2;
          const mq2Raw = typeof mq2Node === 'object' && mq2Node !== null ? (mq2Node.concentration ?? mq2Node.value ?? mq2Node.level) : mq2Node;
          const tsRaw = (val as any).timestamp ?? (val as any).time ?? (val as any).ts;
          readings.MQ2 = typeof mq2Raw === 'number' ? mq2Raw : Number.isFinite(Number(mq2Raw)) ? Number(mq2Raw) : null;
          readings.timestamp = typeof tsRaw === 'number' ? tsRaw : Number.isFinite(Number(tsRaw)) ? Number(tsRaw) : null;
        } else if (typeof val === 'number') {
          readings.MQ2 = val;
        }
        callback(readings);
      } catch (e) {
        onError?.(e as Error);
      }
    },
    (err) => onError?.(err as Error)
  );
  return () => off(sensorsRef);
};

// Unified subscription to maintain consistency across actuators, alerts, and sensors
export const subscribeToSystemData = (
  callback: (data: SystemData) => void,
  onError?: (error: Error) => void
) => {
  const data: SystemData = { actuators: {}, alerts: [], sensors: {} };

  const u1 = subscribeToActuatorStates((a) => {
    data.actuators = a;
    callback({ ...data });
  }, onError);
  const u2 = subscribeToAlerts((al) => {
    data.alerts = al;
    callback({ ...data });
  }, onError);
  const u3 = subscribeToSensorReadings((s) => {
    data.sensors = s;
    callback({ ...data });
  }, onError);

  return () => {
    u1();
    u2();
    u3();
  };
};

// ===== Motor control with string-based status =====

const isMotorStatus = (v: unknown): v is MotorStatus => v === 'open' || v === 'closed';

// Monitor commanded status under 'motor/status'
export const subscribeToMotorStatus = (
  callback: (status: MotorStatus | null) => void,
  onError?: (error: Error) => void
) => {
  const statusRef = ref(database, 'motor/status');
  onValue(
    statusRef,
    (snap) => {
      const val = snap.val();
      callback(isMotorStatus(val) ? val : null);
    },
    (err) => onError?.(err as Error)
  );
  return () => off(statusRef);
};

// Monitor physical/confirmed state under 'motor/state'
export const subscribeToMotorState = (
  callback: (state: MotorStatus | null) => void,
  onError?: (error: Error) => void
) => {
  const stateRef = ref(database, 'motor/state');
  onValue(
    stateRef,
    (snap) => {
      const val = snap.val();
      callback(isMotorStatus(val) ? val : null);
    },
    (err) => onError?.(err as Error)
  );
  return () => off(stateRef);
};

// Set commanded status and append a command log
export const setMotorStatus = async (status: MotorStatus, actor?: string) => {
  if (!isMotorStatus(status)) {
    const err = new Error('Invalid motor status');
    // best-effort log
    await appendMotorLog({ timestamp: Date.now(), event: 'error', message: 'Rejected invalid command', error: String(status), actor });
    throw err;
  }
  const statusRef = ref(database, 'motor/status');
  await set(statusRef, status);
  await appendMotorLog({ timestamp: Date.now(), event: 'command', to: status, actor, success: true, message: `Command set to ${status}` });
};

// Hardware confirms physical state and logs
export const setMotorState = async (state: MotorStatus, source?: string) => {
  if (!isMotorStatus(state)) {
    await appendMotorLog({ timestamp: Date.now(), event: 'error', message: 'Rejected invalid state', error: String(state), actor: source });
    throw new Error('Invalid motor state');
  }
  const stateRef = ref(database, 'motor/state');
  await set(stateRef, state);
  await appendMotorLog({ timestamp: Date.now(), event: 'state', to: state, actor: source, success: true, message: `Physical state set to ${state}` });
};

// Append log entry under 'motor/logs'
export const appendMotorLog = async (entry: Omit<MotorLog, 'id'>) => {
  const logsRef = ref(database, 'motor/logs');
  const newLogRef = push(logsRef);
  await set(newLogRef, { ...entry, id: newLogRef.key });
  return newLogRef.key;
};