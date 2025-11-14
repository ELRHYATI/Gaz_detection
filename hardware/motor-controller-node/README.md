# Motor Controller (Node.js)

Listens to Firebase `motor/status` and actuates a motor (servo/relay) to open/close, then confirms by writing `motor/state`. Logs operations to `motor/logs`.

## Prerequisites

- Node.js 18+
- A Raspberry Pi or similar with GPIO access
- Service account JSON for your Firebase project

## Setup

```bash
npm install firebase-admin pigpio
```

Place your service account JSON as `serviceAccount.json` next to `index.js`.

## Run

```bash
node index.js --dbUrl https://<your-project>.firebaseio.com --gpio 18
```

## Notes

- Uses `pigpio` for PWM control of a servo on the given GPIO pin.
- Replace the `openMotor`/`closeMotor` timings with values suitable for your hardware.
- The script writes to `motor/state` after successful movement and logs to `motor/logs`.
- Ensure RTDB rules allow device writes (e.g., custom token with `device: true`) or use admin SDK (this script uses admin).