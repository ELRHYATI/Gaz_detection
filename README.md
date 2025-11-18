# Gas Detection Dashboard

A React + TypeScript + Vite app that visualizes gas, humidity, and temperature readings from Firebase Realtime Database and controls a window servo.

## Authentication

- Registration and password reset are removed.
- Login uses a hardcoded local session.
- Credentials: `username` is `admin`, `password` is `admin123`.

## Removed Neon/Postgres

- All Neon dual‑write and callable functions have been removed.
- The app now relies solely on Firebase Realtime Database for reads/writes.

## Run Locally

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Open the browser at the printed URL and sign in with the credentials above.

## Optional Emulators

You can point to local Firebase emulators during development by setting env flags:

- `VITE_USE_FUNCTIONS_EMULATOR=true`
- `VITE_USE_AUTH_EMULATOR=true`
- `VITE_USE_DB_EMULATOR=true`

These are read by `src/config/firebase.ts` and will connect to `localhost` on standard emulator ports.

## Hardware Controller

The `hardware/motor-controller-node` folder contains a Node script for controlling a physical servo and updating RTDB state. It uses `firebase-admin` and should be installed in a Node environment when running the hardware controller. This is separate from the web app dependencies.
