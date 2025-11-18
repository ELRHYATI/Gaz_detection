export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export interface GasReading {
  id: string;
  gasLevel: number;
  humidity: number;
  temperature: number;
  timestamp: number;
  location?: string;
}

export interface Threshold {
  id: string;
  gasMin: number;
  gasMax: number;
  humidityMin: number;
  humidityMax: number;
  temperatureMin: number;
  temperatureMax: number;
  updatedAt: number;
  updatedBy: string;
}

export interface ServoMotorState {
  id: string;
  isOpen: boolean;
  lastUpdated: number;
  updatedBy: string;
}

export interface AlertLevel {
  level: 'safe' | 'warning' | 'danger' | 'critical';
  message: string;
  color: string;
}

export interface DashboardMetrics {
  currentGasLevel: number;
  currentHumidity: number;
  currentTemperature: number;
  alertLevel: AlertLevel;
  lastUpdated: number;
}

export interface ChartDataPoint {
  x: number; // timestamp
  y: number; // value
}

export interface HistoricalData {
  gasLevels: ChartDataPoint[];
  humidity: ChartDataPoint[];
  temperature: ChartDataPoint[];
}

// Actuators and sensors from external RTDB structure
export type OnOff = 'ON' | 'OFF';
export type FenetreState = 'FERME' | 'OUVERT';

export interface ActuatorStates {
  LED_rouge?: OnOff;
  LED_verte?: OnOff;
  buzzer?: OnOff;
  fenetres?: FenetreState;
}

export interface AlertRecord {
  id: string;
  [key: string]: unknown;
}

export interface SensorReadings {
  MQ2?: number | null;
  timestamp?: number | null;
}

export interface SystemData {
  actuators: ActuatorStates;
  alerts: AlertRecord[];
  sensors: SensorReadings;
}

// Motor control types for string-based status and logging
export type MotorStatus = 'open' | 'closed';

export interface MotorLog {
  id?: string;
  timestamp: number;
  event: 'command' | 'state' | 'error';
  from?: MotorStatus;
  to?: MotorStatus;
  message?: string;
  actor?: string;
  success?: boolean;
  error?: string;
}

// Per-user notification preferences
export interface UserNotificationPreferences {
  enabled?: boolean;
  telegram_username_mask?: string; // stored mask for display only
  telegram_chat_id?: string; // resolved chat id when available
  types?: {
    messages?: boolean;
    updates?: boolean;
    promotions?: boolean;
  };
  last_updated?: number;
}