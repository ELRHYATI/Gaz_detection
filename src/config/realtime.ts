// Configurable refresh intervals (ms) and timeouts for polling fallback
export const REALTIME_CONFIG = {
  // Time to wait after disconnected before starting polling fallback
  pollingStartDelayMs: 3000,
  // Per-data-type poll intervals
  intervals: {
    gas: 1000,
    thresholds: 10000,
    actuators: 4000,
    motor: 4000,
  },
};