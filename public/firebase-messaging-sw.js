// Firebase Messaging Service Worker
// Uses compat to ease setup without bundling
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAKqEeA3onW-PVxGJR3bUGkQZypUnUecb4",
  authDomain: "gas-detection-system-726c6.firebaseapp.com",
  databaseURL: "https://gas-detection-system-726c6-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gas-detection-system-726c6",
  storageBucket: "gas-detection-system-726c6.firebasestorage.app",
  messagingSenderId: "582346067029",
  appId: "1:582346067029:web:c8a740643f101cb64d58dc"
});

const messaging = firebase.messaging();

// Optional: customize background notification handling
messaging.onBackgroundMessage((payload) => {
  const title = payload?.notification?.title || 'Alert';
  const body = payload?.notification?.body || '';
  const icon = '/vite.svg';
  self.registration.showNotification(title, { body, icon });
});