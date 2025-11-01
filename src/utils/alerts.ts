import type { AlertLevel, GasReading, Threshold } from '../types';

export const calculateAlertLevel = (
  reading: GasReading,
  threshold: Threshold | null
): AlertLevel => {
  if (!threshold) {
    return {
      level: 'warning',
      message: 'Aucun seuil configuré',
      color: 'text-warning-600'
    };
  }

  const { gasLevel, humidity, temperature } = reading;
  const {
    gasMin,
    gasMax,
    humidityMin,
    humidityMax,
    temperatureMin,
    temperatureMax
  } = threshold;

  // Check for critical gas levels (immediate danger)
  if (gasLevel > gasMax * 1.5) {
    return {
      level: 'critical',
      message: 'DANGER CRITIQUE: Niveau de gaz extrêmement élevé!',
      color: 'text-red-800'
    };
  }

  // Check for dangerous conditions
  if (
    gasLevel > gasMax ||
    gasLevel < gasMin ||
    humidity > humidityMax ||
    humidity < humidityMin ||
    temperature > temperatureMax ||
    temperature < temperatureMin
  ) {
    let message = 'ATTENTION: ';
    const issues = [];

    if (gasLevel > gasMax) issues.push('Gaz élevé');
    if (gasLevel < gasMin) issues.push('Gaz faible');
    if (humidity > humidityMax) issues.push('Humidité élevée');
    if (humidity < humidityMin) issues.push('Humidité faible');
    if (temperature > temperatureMax) issues.push('Température élevée');
    if (temperature < temperatureMin) issues.push('Température faible');

    message += issues.join(', ');

    return {
      level: 'danger',
      message,
      color: 'text-danger-600'
    };
  }

  // Check for warning conditions (approaching limits)
  const gasWarningRange = (gasMax - gasMin) * 0.1;
  const humidityWarningRange = (humidityMax - humidityMin) * 0.1;
  const temperatureWarningRange = (temperatureMax - temperatureMin) * 0.1;

  if (
    gasLevel > gasMax - gasWarningRange ||
    gasLevel < gasMin + gasWarningRange ||
    humidity > humidityMax - humidityWarningRange ||
    humidity < humidityMin + humidityWarningRange ||
    temperature > temperatureMax - temperatureWarningRange ||
    temperature < temperatureMin + temperatureWarningRange
  ) {
    return {
      level: 'warning',
      message: 'Attention: Valeurs approchant les limites',
      color: 'text-warning-600'
    };
  }

  // All values are within safe ranges
  return {
    level: 'safe',
    message: 'Tous les paramètres sont normaux',
    color: 'text-success-600'
  };
};

export const getAlertIcon = (level: AlertLevel['level']): string => {
  switch (level) {
    case 'safe':
      return '✅';
    case 'warning':
      return '⚠️';
    case 'danger':
      return '🚨';
    case 'critical':
      return '🔴';
    default:
      return '❓';
  }
};

export const getAlertBadgeClasses = (level: AlertLevel['level']): string => {
  switch (level) {
    case 'safe':
      return 'bg-success-100 text-success-800 border-success-200';
    case 'warning':
      return 'bg-warning-100 text-warning-800 border-warning-200';
    case 'danger':
      return 'bg-danger-100 text-danger-800 border-danger-200';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};