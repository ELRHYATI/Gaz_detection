// Simulate alert scenarios by writing dangerous readings into RTDB
// Usage: set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON, then run:
//   node admin/simulate_alerts.cjs [scenario]
// Scenarios: danger_gas | critical_gas | danger_humidity | danger_temperature | safe

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://gas-detection-system-726c6-default-rtdb.europe-west1.firebasedatabase.app',
});

const db = admin.database();

const now = () => Date.now();

async function writeLatest(reading) {
  await db.ref('latestReading').set(reading);
  await db.ref('gasReadings').push(reading);
  await db.ref('capteurs').update({ MQ2: reading.gasLevel, timestamp: reading.timestamp });
}

async function main() {
  const scenario = process.argv[2] || 'danger_gas';
  // Example thresholds (update to match RTDB thresholds if needed)
  const thresholds = { gasMin: 0, gasMax: 200, humidityMin: 30, humidityMax: 70, temperatureMin: 10, temperatureMax: 35 };

  const base = { humidity: 50, temperature: 22, location: 'Main Lab', timestamp: now() };
  let reading;

  switch (scenario) {
    case 'critical_gas':
      reading = { ...base, gasLevel: thresholds.gasMax * 1.6 };
      break;
    case 'danger_gas':
      reading = { ...base, gasLevel: thresholds.gasMax + 30 };
      break;
    case 'danger_humidity':
      reading = { ...base, gasLevel: 150, humidity: thresholds.humidityMax + 10 };
      break;
    case 'danger_temperature':
      reading = { ...base, gasLevel: 150, temperature: thresholds.temperatureMax + 5 };
      break;
    case 'safe':
      reading = { ...base, gasLevel: 120 };
      break;
    default:
      throw new Error(`Unknown scenario: ${scenario}`);
  }

  await writeLatest(reading);
  console.log('Wrote scenario', scenario, 'reading:', reading);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });