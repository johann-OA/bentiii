// ==========================================================================
// Cosmic Garden: Real Cloud Database Configuration (Firebase Firestore)
// ==========================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBEgkiGrF0am38f5tb50yt7VTFnjDhoab8",
  authDomain: "gifffff0.firebaseapp.com",
  projectId: "gifffff0",
  storageBucket: "gifffff0.firebasestorage.app",
  messagingSenderId: "111600419527",
  appId: "1:111600419527:web:b1ef36bda8c5ab719b34e2",
  measurementId: "G-QFMB5Z5KDK"
};

// Check if valid credentials have been configured
function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "PASTE_YOUR_API_KEY_HERE" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "PASTE_YOUR_PROJECT_ID"
  );
}

// Export for global browser use
window.FIREBASE_CONFIG = firebaseConfig;
window.isFirebaseConfigured = isFirebaseConfigured;
