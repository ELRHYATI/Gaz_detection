import { initializeApp } from 'firebase/app';
import { getFunctions } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

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

export default app;