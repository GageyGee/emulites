// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCM3n1ppVblGQZv2gIowDGbXemYh4SLBzE",
  authDomain: "emulites-fa2c9.firebaseapp.com",
  projectId: "emulites-fa2c9",
  storageBucket: "emulites-fa2c9.firebasestorage.app",
  messagingSenderId: "489721961642",
  appId: "1:489721961642:web:c26f5ef7008263e5ed44d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Make available globally for the main script
window.db = db;
window.auth = auth;
window.app = app;

// Export for module usage (keeping your existing export)
export { db };
