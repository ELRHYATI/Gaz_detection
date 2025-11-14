// Validate and correct datetime fields in Firebase RTDB to a consistent format
// Usage:
//   set FIREBASE_DB_URL to your RTDB URL or pass --dbUrl=...
//   ensure admin/serviceAccount.json exists, then run:
//     node admin/fix_timestamps.js --dryRun
//     node admin/fix_timestamps.js --apply
// Options:
//   --dryRun   do not write, only report (default)
//   --apply    write corrections
//   --paths=a,b,c  comma-separated subset of paths to process
//
// The report is saved to admin/reports/timestamp_corrections.json

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const argv = process.argv.slice(2);
const kv = Object.fromEntries(argv.map(a => { const [k,v] = a.replace(/^--/, '').split('='); return [k,v ?? true]; }));
const dbUrl = kv.dbUrl || process.env.FIREBASE_DB_URL;
const apply = !!kv.apply;
const dryRun = !apply;
const includePaths = typeof kv.paths === 'string' ? kv.paths.split(',').map(s => s.trim()) : null;

let serviceAccount;
try { serviceAccount = require('./serviceAccount.json'); } catch (e) {
  console.error('Missing admin/serviceAccount.json');
  process.exit(1);
}
if (!dbUrl) {
  console.error('Missing RTDB URL. Set FIREBASE_DB_URL or pass --dbUrl');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: dbUrl });
const db = admin.database();

const fmtUTC = (ms) => {
  const d = new Date(Number(ms));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
};

const normalizeTs = (value) => {
  let beforeMs;
  if (value == null) return { valid: false, reason: 'null/undefined' };
  if (typeof value === 'number') beforeMs = value;
  else if (typeof value === 'string') {
    const num = Number(value);
    if (Number.isFinite(num)) beforeMs = num; else {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) beforeMs = parsed; else return { valid: false, reason: 'unparseable string' };
    }
  } else return { valid: false, reason: `unsupported type ${typeof value}` };

  let ms = beforeMs;
  let note = 'ms';
  // Heuristics: seconds -> ms if too small
  if (ms > 0 && ms < 1e10) { // seconds or small numbers
    ms = ms * 1000;
    note = 'seconds->ms';
  }
  if (ms <= 0) return { valid: false, reason: 'non-positive timestamp', beforeMs };
  return { valid: true, beforeMs, afterMs: ms, note };
};

const report = { generatedAt: fmtUTC(Date.now()), dryRun, corrections: [] };

const addCorrection = (entry) => report.corrections.push(entry);

async function processLatestReading() {
  const ref = db.ref('latestReading');
  const snap = await ref.get();
  if (!snap.exists()) return;
  const val = snap.val();
  const tsInfo = normalizeTs(val.timestamp);
  if (!tsInfo.valid) {
    addCorrection({ path: 'latestReading', key: 'timestamp', before: String(val.timestamp), after: null, status: 'invalid', reason: tsInfo.reason });
    return;
  }
  if (tsInfo.afterMs !== tsInfo.beforeMs) {
    const afterFmt = fmtUTC(tsInfo.afterMs);
    const beforeFmt = fmtUTC(tsInfo.beforeMs);
    addCorrection({ path: 'latestReading', key: 'timestamp', before: beforeFmt, after: afterFmt, status: dryRun ? 'pending' : 'updated', note: tsInfo.note });
    if (!dryRun) await ref.update({ timestamp: tsInfo.afterMs });
  }
}

async function processGasReadings() {
  const ref = db.ref('gasReadings');
  const snap = await ref.get();
  if (!snap.exists()) return;
  const obj = snap.val();
  const keys = Object.keys(obj);
  // verify ordering
  const timestamps = [];
  for (const k of keys) {
    const rec = obj[k];
    const info = normalizeTs(rec.timestamp);
    if (!info.valid) {
      addCorrection({ path: `gasReadings/${k}`, key: 'timestamp', before: String(rec.timestamp), after: null, status: 'invalid', reason: info.reason });
      continue;
    }
    timestamps.push(info.afterMs);
    if (info.afterMs !== info.beforeMs) {
      addCorrection({ path: `gasReadings/${k}`, key: 'timestamp', before: fmtUTC(info.beforeMs), after: fmtUTC(info.afterMs), status: dryRun ? 'pending' : 'updated', note: info.note });
      if (!dryRun) await ref.child(k).update({ timestamp: info.afterMs });
    }
  }
  const sorted = [...timestamps].sort((a,b)=>a-b);
  const isChrono = timestamps.every((t,i)=>t===sorted[i]);
  addCorrection({ path: 'gasReadings', key: 'order', before: 'n/a', after: isChrono ? 'chronological' : 'not chronological', status: 'checked' });
}

async function processCapteurs() {
  const ref = db.ref('capteurs');
  const snap = await ref.get();
  if (!snap.exists()) return;
  const val = snap.val();
  if ('timestamp' in val) {
    const info = normalizeTs(val.timestamp);
    if (!info.valid) {
      addCorrection({ path: 'capteurs', key: 'timestamp', before: String(val.timestamp), after: null, status: 'invalid', reason: info.reason });
    } else if (info.afterMs !== info.beforeMs) {
      addCorrection({ path: 'capteurs', key: 'timestamp', before: fmtUTC(info.beforeMs), after: fmtUTC(info.afterMs), status: dryRun ? 'pending' : 'updated', note: info.note });
      if (!dryRun) await ref.update({ timestamp: info.afterMs });
    }
  }
}

async function processWindowControl() {
  const ref = db.ref('window_control/last_updated');
  const snap = await ref.get();
  if (!snap.exists()) return;
  const info = normalizeTs(snap.val());
  if (!info.valid) {
    addCorrection({ path: 'window_control/last_updated', key: 'timestamp', before: String(snap.val()), after: null, status: 'invalid', reason: info.reason });
  } else if (info.afterMs !== info.beforeMs) {
    addCorrection({ path: 'window_control/last_updated', key: 'timestamp', before: fmtUTC(info.beforeMs), after: fmtUTC(info.afterMs), status: dryRun ? 'pending' : 'updated', note: info.note });
    if (!dryRun) await ref.set(info.afterMs);
  }
}

async function processActuatorsLogs() {
  const ref = db.ref('actuators_logs');
  const snap = await ref.get();
  if (!snap.exists()) return;
  const obj = snap.val();
  for (const k of Object.keys(obj)) {
    const rec = obj[k];
    const info = normalizeTs(rec.timestamp);
    if (!info.valid) {
      addCorrection({ path: `actuators_logs/${k}`, key: 'timestamp', before: String(rec.timestamp), after: null, status: 'invalid', reason: info.reason });
      continue;
    }
    if (info.afterMs !== info.beforeMs) {
      addCorrection({ path: `actuators_logs/${k}`, key: 'timestamp', before: fmtUTC(info.beforeMs), after: fmtUTC(info.afterMs), status: dryRun ? 'pending' : 'updated', note: info.note });
      if (!dryRun) await ref.child(k).update({ timestamp: info.afterMs });
    }
  }
}

async function processMotorLogs() {
  const ref = db.ref('motor/logs');
  const snap = await ref.get();
  if (!snap.exists()) return;
  const obj = snap.val();
  for (const k of Object.keys(obj)) {
    const rec = obj[k];
    const info = normalizeTs(rec.timestamp);
    if (!info.valid) {
      addCorrection({ path: `motor/logs/${k}`, key: 'timestamp', before: String(rec.timestamp), after: null, status: 'invalid', reason: info.reason });
      continue;
    }
    if (info.afterMs !== info.beforeMs) {
      addCorrection({ path: `motor/logs/${k}`, key: 'timestamp', before: fmtUTC(info.beforeMs), after: fmtUTC(info.afterMs), status: dryRun ? 'pending' : 'updated', note: info.note });
      if (!dryRun) await ref.child(k).update({ timestamp: info.afterMs });
    }
  }
}

async function main() {
  const tasks = [
    { name: 'latestReading', fn: processLatestReading },
    { name: 'gasReadings', fn: processGasReadings },
    { name: 'capteurs', fn: processCapteurs },
    { name: 'window_control', fn: processWindowControl },
    { name: 'actuators_logs', fn: processActuatorsLogs },
    { name: 'motor/logs', fn: processMotorLogs },
  ];

  const selected = includePaths ? tasks.filter(t => includePaths.includes(t.name)) : tasks;
  for (const t of selected) {
    try {
      await t.fn();
    } catch (e) {
      addCorrection({ path: t.name, key: 'error', before: 'n/a', after: String(e.message || e), status: 'error' });
    }
  }

  const outDir = path.join(__dirname, 'reports');
  const outFile = path.join(outDir, 'timestamp_corrections.json');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`Report saved to ${outFile}`);
  console.log(`Corrections: ${report.corrections.length}`);
  process.exit(0);
}

main().catch((e)=>{ console.error(e); process.exit(1); });