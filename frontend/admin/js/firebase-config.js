/* ═══════════════════════════════════════════════════════════════
   FIREBASE CONFIG — Thangamalar Jewellers (admin panel)
   ───────────────────────────────────────────────────────────────
   MUST be the exact same values as frontend/js/firebase-config.js —
   both the public site and the admin panel talk to the same
   Firebase project.
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
const auth = firebase.auth();
