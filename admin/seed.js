// Seed and configure Firebase RTDB for IoT gas detection system
// Usage: set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON, then run `node admin/seed.js`

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://gas-detection-system-726c6-default-rtdb.europe-west1.firebasedatabase.app',
});

const db = admin.database();

async function seed() {
  const requiredAlerts = [
    'OcRfhriO1eH19IBo5lM',
    'OcRhG9I-a0XTq87JZCH',
    'OcRj7WStg5MODXnhmOe',
    'OcRjLQ6MoBDho76dg8z',
    'OcRjMzsxjnUId4Yggbk',
    'OcRs8IhKMHRelyXmVSQ',
    'OcaVDEFF1x7d5OVD4xq',
    'OcaVzsglR5v0aOPVP5z',
    'OcaW9GmJD6RzVYwMwAJ',
  ];

  // Actuators
  await db.ref('LED_rouge').set('OFF');
  await db.ref('LED_verte').set('ON');
  await db.ref('buzzer').set('OFF');
  await db.ref('fenetres').set('FERME');
  await db.ref('actuators_logs').push({ timestamp: Date.now(), actor: 'seed', changes: 'LED_rouge=OFF, LED_verte=ON, buzzer=OFF, fenetres=FERME' });

  // Alerts
  const alertsRef = db.ref('alertes');
  await alertsRef.update(Object.fromEntries(requiredAlerts.map((id) => [id, { status: 'active', createdAt: Date.now() }])));

  // Sensor sample
  const sample = { gasLevel: 226, humidity: 0, temperature: 0, timestamp: Date.now() };
  await db.ref('capteurs').update({ MQ2: sample.gasLevel, timestamp: sample.timestamp });
  await db.ref('latestReading').set(sample);
  await db.ref('gasReadings').push({ ...sample });

  console.log('Seeding complete.');
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });