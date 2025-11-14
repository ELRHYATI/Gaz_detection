export const APP_CONFIG = {
  locationLabel: 'Main Lab',
  alerts: {
    enableVibration: true,
    sound: {
      // Frequencies in Hz and durations in ms
      warning: { frequency: 800, duration: 1000 },
      danger: { frequency: 1000, duration: 1500 },
      critical: { frequency: 1500, duration: 3000 },
    },
  },
  emergency: {
    phone: '112', // change to your local emergency number
    email: '', // optional fallback email for assistance
  },
};