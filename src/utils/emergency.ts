import { APP_CONFIG } from '../config/app';

export interface EmergencyTemplateInput {
  type: 'gas' | 'humidity' | 'temperature';
  severity: 'danger' | 'critical';
  value: number;
  timestamp: number;
  location?: string;
  actions?: string[];
  contacts?: string[];
}

const formatTimestamp = (ts: number) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(ts));
  } catch {
    return new Date(ts).toISOString();
  }
};

export const buildEmergencyMessage = (inp: EmergencyTemplateInput): string => {
  const heading = '*EMERGENCY ALERT*';
  const typeLabel = inp.type === 'gas' ? 'Gas' : inp.type === 'humidity' ? 'Humidity' : 'Temperature';
  const severityLabel = inp.severity === 'critical' ? 'CRITICAL' : 'DANGER';
  const ts = formatTimestamp(inp.timestamp);
  const loc = inp.location || APP_CONFIG.locationLabel || 'Unknown location';
  const recommended = inp.actions && inp.actions.length
    ? inp.actions
    : [
        inp.severity === 'critical' ? 'Evacuate immediately.' : 'Increase ventilation and monitor closely.',
        'Open windows and doors.',
        'Contact emergency services if symptoms appear.'
      ];
  const contacts = inp.contacts && inp.contacts.length ? inp.contacts : [APP_CONFIG.emergency?.phone ? `Emergency: ${APP_CONFIG.emergency.phone}` : 'Emergency: 112'];

  const lines: string[] = [
    heading,
    `Type: ${typeLabel} ${severityLabel}`,
    `Value: ${inp.value}`,
    `Time: ${ts}`,
    `Location: ${loc}`,
    '',
    'Recommended Actions:',
    ...recommended.map((a, i) => `${i + 1}. ${a}`),
    '',
    'Contacts:',
    ...contacts,
  ];
  return lines.join('\n');
};