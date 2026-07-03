/* ═══════════════════════════════════════════════════════════════
   FIREBASE CONFIG — Thangamalar Jewellers (public site)
   ───────────────────────────────────────────────────────────────
   Replace the values below with the ones from your own Firebase
   project: Firebase Console → Project settings → General →
   "Your apps" → Web app → SDK setup and configuration → Config.

   This same file (with the same values) also lives in
   admin/js/firebase-config.js — keep both copies in sync.

   These values are safe to expose in client-side code; Firebase
   security is enforced by firestore.rules (see /backend), not by
   hiding this config.
═══════════════════════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyDatQDrxbXTUqAj6KyZzO32vBkrrZjUh8Y",
  authDomain: "thangamalarjewellerss.firebaseapp.com",
  projectId: "thangamalarjewellerss",
  storageBucket: "thangamalarjewellerss.firebasestorage.app",
  messagingSenderId: "241914735213",
  appId: "1:241914735213:web:e87f68fa600ba4fc442d64",
  measurementId: "G-8KQ7JW6PJR"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
