// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGfPQxPXrfx3Nrl8_b1JBsHzDc8qNVVtM",
  authDomain: "emulites-test.firebaseapp.com",
  projectId: "emulites-test",
  storageBucket: "emulites-test.firebasestorage.app",
  messagingSenderId: "122937034892",
  appId: "1:122937034892:web:39b30453feea55ee7853a9"
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
