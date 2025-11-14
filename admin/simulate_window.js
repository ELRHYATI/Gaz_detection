// Simulate window open/close to test bidirectional sync and interruptions
const admin = require('firebase-admin');

const argv = process.argv.slice(2);
const kv = Object.fromEntries(argv.map(a => { const [k,v] = a.replace(/^--/, '').split('='); return [k,v]; }));
const dbUrl = kv.dbUrl || process.env.FIREBASE_DB_URL;

if (!dbUrl) {
  console.error('Missing RTDB URL. Pass --dbUrl or set FIREBASE_DB_URL');
  process.exit(1);
}

let serviceAccount;
try { serviceAccount = require('./serviceAccount.json'); } catch (e) {
  console.error('Missing admin/serviceAccount.json for simulator');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: dbUrl });
const db = admin.database();

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const setFenetre = async (val) => {
  await db.ref('fenetres').set(val);
  await db.ref('actuators_logs').push().set({ timestamp: Date.now(), changes: `simulate fenetres=${val}` });
};

(async () => {
  console.log('Simulating window cycle: FERME -> OUVERT -> FERME');
  await setFenetre('FERME');
  await delay(1500);
  console.log('Opening...');
  await setFenetre('OUVERT');
  await delay(1500);
  console.log('Closing...');
  await setFenetre('FERME');
  console.log('Done.');

  // Simulate interruption: write during network hiccup
  console.log('Simulating network interruption scenario');
  try {
    // Write invalid value (should be rejected by rules)
    await db.ref('fenetres').set('INVALID');
  } catch (e) {
    console.log('Expected rejection for invalid fenetres:', e.message || String(e));
  }

  // Manual override test
  console.log('Enabling manual override and forcing open');
  await db.ref('window_control/manual_override').set(true);
  await db.ref('window_control/current_state').set('open');
  await delay(1000);
  console.log('Disabling manual override');
  await db.ref('window_control/manual_override').set(false);
  // Attempt change without override (should be blocked by rules, if client; admin bypasses rules)
  console.log('Attempting state change while override disabled (admin will bypass rules; check Cloud Functions behavior)');
  await db.ref('window_control/current_state').set('closed');
  console.log('Simulation complete');
  process.exit(0);
})();