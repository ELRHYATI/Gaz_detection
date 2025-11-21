// Node.js hardware motor controller
// Listens to RTDB 'motor/status' (open|closed), actuates, then writes 'motor/state' and logs under 'motor/logs'
// Adds physical window sensor feedback to sync DB: 'fenetres' & 'actionneurs/fenetres' and 'window_control'

const admin = require('firebase-admin');
const { Gpio } = require('pigpio');

// Simple args parsing: --dbUrl=... --gpio=...
const argv = process.argv.slice(2);
const kv = Object.fromEntries(argv.map(a => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v];
}));
const dbUrl = kv.dbUrl || process.env.FIREBASE_DB_URL;
const gpioPin = Number(kv.gpio || process.env.MOTOR_GPIO || 18);
const sensorPin = kv.sensor !== undefined ? Number(kv.sensor) : (process.env.SENSOR_GPIO !== undefined ? Number(process.env.SENSOR_GPIO) : undefined);

if (!dbUrl) {
  console.error('Missing RTDB URL. Pass --dbUrl or set FIREBASE_DB_URL');
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = require('./serviceAccount.json');
} catch (e) {
  console.error('Missing serviceAccount.json in hardware/motor-controller-node');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: dbUrl,
});

const db = admin.database();

const log = async (entry) => {
  const ref = db.ref('motor/logs').push();
  await ref.set({ ...entry, id: ref.key });
};

// Servo control using pigpio PWM
const servo = new Gpio(gpioPin, { mode: Gpio.OUTPUT });

// Adjust pulse widths for your servo (microseconds)
const OPEN_PULSE = 2000; // ~2ms
const CLOSED_PULSE = 1000; // ~1ms
const MOVE_MS = 800; // movement time

const openMotor = async () => {
  servo.servoWrite(OPEN_PULSE);
  await new Promise((r) => setTimeout(r, MOVE_MS));
  servo.servoWrite(0); // stop PWM
};

const closeMotor = async () => {
  servo.servoWrite(CLOSED_PULSE);
  await new Promise((r) => setTimeout(r, MOVE_MS));
  servo.servoWrite(0);
};

const setState = async (state) => db.ref('motor/state').set(state);

// Main subscription
const statusRef = db.ref('motor/status');
statusRef.on('value', async (snap) => {
  const val = snap.val();
  const ts = Date.now();
  if (val !== 'open' && val !== 'closed') {
    await log({ timestamp: ts, event: 'error', message: 'Invalid command', error: String(val) });
    return;
  }
  try {
    await log({ timestamp: ts, event: 'command', to: val, success: true, message: `Received ${val}` });
    if (val === 'open') {
      await openMotor();
    } else {
      await closeMotor();
    }
    await setState(val);
    await log({ timestamp: Date.now(), event: 'state', to: val, success: true, message: `State confirmed ${val}` });
  } catch (e) {
    await log({ timestamp: Date.now(), event: 'error', error: e.message || String(e), message: `Operation failed for ${val}` });
  }
});

// Physical sensor -> DB sync (optional if SENSOR_GPIO provided)
const mapStateToFenetre = (s) => (s === 'open' ? 'OUVERT' : 'FERME');
const mapFenetreFromLevel = (level) => (level === 1 ? 'OUVERT' : 'FERME');
const mapStateFromFenetre = (f) => (f === 'OUVERT' ? 'open' : 'closed');

if (typeof sensorPin === 'number' && !Number.isNaN(sensorPin)) {
  try {
    const sensor = new Gpio(sensorPin, { mode: Gpio.INPUT });
    // Reduce spurious triggers
    try { sensor.glitchFilter && sensor.glitchFilter(10000); } catch {}
    sensor.on('alert', async (level /* 0=closed,1=open */) => {
      const ts = Date.now();
      const fenetreVal = mapFenetreFromLevel(level);
      const state = mapStateFromFenetre(fenetreVal);
      try {
        await db.ref('fenetres').set(fenetreVal);
        await db.ref('actionneurs/fenetres').set(fenetreVal);
        await db.ref('window_control').update({
          current_state: state,
          servo_position: state === 'open' ? 90 : 0,
          last_updated: ts,
        });
        await log({ timestamp: ts, event: 'sensor', message: `Physical window ${state}`, level });
        // Optionally align motor/state if it differs
        const currentStateSnap = await db.ref('motor/state').get();
        if (currentStateSnap.val() !== state) {
          await setState(state);
          await log({ timestamp: Date.now(), event: 'state', to: state, success: true, message: `Sensor reconciled motor/state ${state}` });
        }
      } catch (e) {
        await log({ timestamp: Date.now(), event: 'error', error: e.message || String(e), message: 'Sensor update failed' });
      }
    });
    await log({ timestamp: Date.now(), event: 'init', message: `Sensor listening on GPIO ${sensorPin}` });
  } catch (e) {
    await log({ timestamp: Date.now(), event: 'error', error: e.message || String(e), message: `Failed to init sensor GPIO ${sensorPin}` });
  }
}

process.on('SIGINT', () => {
  try { servo.servoWrite(0); } catch {}
  process.exit(0);
});
