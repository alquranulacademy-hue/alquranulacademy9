// =====================================================================
// AL QURANUL ACADEMY — Firebase initialization
// =====================================================================
// This is an ES module (loaded with <script type="module">), using the
// official Firebase JS SDK v10 straight from Google's CDN — no npm
// install or bundler needed, which keeps this compatible with the
// existing static HTML + GitHub + Vercel setup.
//
// It exposes `window.firebaseAuth`, `window.firebaseDB`, and a small
// `window.fb` helper object of the Firebase functions the rest of the
// site (js/site-data.js, js/main.js, js/admin.js) needs — so those
// plain <script> files can use Firebase without becoming modules
// themselves.
// =====================================================================

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  remove,
  query,
  orderByChild,
  equalTo,
  onValue
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// =====================================================================
// TODO — REPLACE WITH YOUR OWN FIREBASE PROJECT CONFIG
// Firebase Console → Project settings → General → "Your apps" → Web app
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyACxVAhWjqzlJ697Ged-Zo9VOs5ZpkM2SM",
  authDomain: "al-quranul-academy.firebaseapp.com",
  databaseURL: "https://al-quranul-academy-default-rtdb.firebaseio.com",
  projectId: "al-quranul-academy",
  storageBucket: "al-quranul-academy.firebasestorage.app",
  messagingSenderId: "115532067806",
  appId: "1:115532067806:web:5787fca6dd79573fb2634f",
  measurementId: "G-TYSJ707FYZ"
};
// =====================================================================

let app = null;
let auth = null;
let db = null;
let storage = null;
let initError = null;

try {
  // Guard against the placeholder config so a forgotten swap fails
  // quietly (site falls back to static content) instead of throwing
  // uncaught errors all over the console on every page load.
  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    throw new Error("Firebase config not set yet — using static fallback content.");
  }
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
  try {
    // Storage is optional — some projects haven't enabled it yet. If this
    // throws, everything else (Auth, Database) still works fine; only the
    // admin dashboard's image upload feature will show a friendly notice.
    storage = getStorage(app);
  } catch (storageErr) {
    storage = null;
  }
} catch (err) {
  initError = err;
  // No console.error by design (kept quiet in production) — callers
  // check window.firebaseDB / window.firebaseAuth for null and fall
  // back to static content or show a friendly message instead.
}

window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;
window.firebaseInitError = initError;

window.fb = {
  ref, get, set, push, update, remove, query, orderByChild, equalTo, onValue,
  signInWithEmailAndPassword, onAuthStateChanged, signOut,
  storageRef, uploadBytes, getDownloadURL
};

// Classic <script defer> tags execute after this module has finished
// running (see the script order in every page's <head>/end of <body>),
// so window.firebaseDB / window.firebaseAuth are guaranteed to be set
// (to either real instances or null) by the time site-data.js, main.js,
// or admin.js run. This event is provided as an extra hook for any
// script that wants to listen instead of relying on load order.
window.dispatchEvent(new CustomEvent('firebase-ready', { detail: { ready: !initError } }));
