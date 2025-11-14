Admin seeding tools for Firebase Realtime Database

This folder contains a simple Node.js script to seed and configure your Firebase Realtime Database for the IoT gas detection system.

What it does:
- Sets initial actuator states: `LED_rouge=OFF`, `LED_verte=ON`, `buzzer=OFF`, `fenetres=FERME`.
- Ensures the specified alert IDs exist under `alertes/` with `status=active`.
- Writes a sensor sample under `capteurs/` with `MQ2=226` and `timestamp=394268`.
- Optionally updates `latestReading` and appends the sample to `gasReadings` for history.

Prerequisites:
- Create a Firebase service account key JSON for your project (`gas-detection-system-726c6`).
- Install dependencies: `npm install firebase-admin`.

How to run:
1. Set env var `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON.
2. Run: `node admin/seed.js`.

Notes:
- The script uses the database URL `https://gas-detection-system-726c6-default-rtdb.europe-west1.firebasedatabase.app`.
- It is safe to run multiple times; it will upsert the required nodes.

---

Window control simulator & tests

Use `admin/simulate_window.js` to verify bidirectional synchronization between physical window state, servo motor position, and the database.

What it tests:
- Sync from `fenetres` (FR) to `actionneurs/fenetres` mirror and `window_control`.
- Automatic motor command via `motor/status` when window changes.
- Manual override path under `window_control`.
- Rejection of invalid writes by rules (client-side; admin bypasses rules).

How to run:
1. Ensure you have `admin/serviceAccount.json`.
2. Run: `node admin/simulate_window.js`.
3. Watch your app’s Motor Control and System Data pages for live updates.

Network interruptions:
- The simulator will attempt invalid writes to confirm rules block them.
- You can also disconnect your device/network temporarily and confirm that Cloud Functions reconcile the state when connectivity returns.

Security rules validation:

The Realtime Database rules secure:
- `actionneurs/fenetres`: only admin/operator/device can write; accepts `FERME|OUVERT`.
- `window_control`: structured node with validation:
  - `current_state`: `open|closed`, client writes only when `manual_override` is true and user has admin/operator role.
  - `servo_position`: `0|90`, same condition as `current_state`.
  - `last_updated`: positive timestamp; writeable by admin/operator/device.
  - `manual_override`: boolean; admin/operator only.

Cloud Functions (admin SDK) bypass rules and handle synchronization.

---

Timestamp validation & correction

Use `admin/fix_timestamps.cjs` to validate and correct datetime fields to the standard UTC format (`YYYY-MM-DD HH:MM:SS`) and millisecond epoch values.

What it does:
- Identifies malformed or inconsistent timestamps across:
  - `latestReading.timestamp`
  - `gasReadings/*/timestamp`
  - `capteurs.timestamp`
  - `window_control/last_updated`
  - `actuators_logs/*/timestamp`
  - `motor/logs/*/timestamp`
- Normalizes numeric seconds to milliseconds (`seconds->ms`).
- Parses string dates (ISO or common formats) to UTC milliseconds.
- Verifies chronological order of `gasReadings` and logs.
- Generates a validation report with before/after (UTC) without changing relationships.

Prerequisites:
- `admin/serviceAccount.json` with Firebase Admin credentials.
- Set `FIREBASE_DB_URL` to your RTDB URL (or pass `--dbUrl=...`).

How to run:
1. Dry run (no writes): `node admin/fix_timestamps.cjs --dryRun --dbUrl=https://<your-db>.firebasedatabase.app`
2. Apply fixes: `node admin/fix_timestamps.cjs --apply --dbUrl=https://<your-db>.firebasedatabase.app`
3. Report is saved to `admin/reports/timestamp_corrections.json`.

Safety:
- The script only updates timestamp fields; it does not alter other data or keys.
- Use `--paths=latestReading,gasReadings` to limit scope.