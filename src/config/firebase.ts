import { initializeApp } from 'firebase/app';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import { getAnalytics, isSupported as isAnalyticsSupported, logEvent } from 'firebase/analytics';

// Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAKqEeA3onW-PVxGJR3bUGkQZypUnUecb4",
  authDomain: "gas-detection-system-726c6.firebaseapp.com",
  databaseURL: "https://gas-detection-system-726c6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gas-detection-system-726c6",
  storageBucket: "gas-detection-system-726c6.firebasestorage.app",
  messagingSenderId: "582346067029",
  appId: "1:582346067029:web:c8a740643f101cb64d58dc"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Cloud Functions (callable) client
export const functionsClient = getFunctions(app, 'europe-west1');
// In development, optionally connect to local emulators via env flags
// Set VITE_USE_FUNCTIONS_EMULATOR=true, VITE_USE_AUTH_EMULATOR=true, VITE_USE_DB_EMULATOR=true to enable
if (import.meta.env.DEV) {
  const useFunctions = import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true';
  const useAuth = import.meta.env.VITE_USE_AUTH_EMULATOR === 'true';
  const useDb = import.meta.env.VITE_USE_DB_EMULATOR === 'true';
  try {
    if (useFunctions) connectFunctionsEmulator(functionsClient, 'localhost', 5001);
    if (useAuth) connectAuthEmulator(auth, 'http://localhost:9099');
    if (useDb) connectDatabaseEmulator(database, 'localhost', 9000);
  } catch {
    // ignore if emulator not available; calls will go to production
  }
}

// Messaging: expose a helper to obtain instance only when supported
export async function getMessagingIfSupported() {
  try {
    const supported = await isSupported();
    return supported ? getMessaging(app) : undefined;
  } catch {
    return undefined;
  }
}

// Analytics: expose an optional instance and helper to log events safely
export let analytics: ReturnType<typeof getAnalytics> | undefined;
void (async () => {
  try {
    const supported = await isAnalyticsSupported();
    analytics = supported ? getAnalytics(app) : undefined;
  } catch {
    analytics = undefined;
  }
})();

export function logAuthEventSafe(eventName: string, params?: Record<string, unknown>) {
  try {
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  } catch {
    // ignore analytics errors in web envs without full support
  }
}

export default app;