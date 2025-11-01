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