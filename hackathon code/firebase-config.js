// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth, connectAuthEmulator } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Your web app's Firebase configuration
// For development, use the project's .env file or hardcode these values
// For production, these would be properly secured

// Check if we're in a development or test environment
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // For development, use emulators if available
  if (isDevelopment) {
    try {
      // If Firebase emulators are running, connect to them
      // connectAuthEmulator(auth, 'http://localhost:9099');
      // connectFirestoreEmulator(db, 'localhost', 8080);
      
      console.log("Development mode: Firebase emulators might be used if uncommented.");
    } catch (emulatorError) {
      console.warn("Could not connect to Firebase emulators:", emulatorError);
    }
  }
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  
  // Create fallback objects to prevent app crashes
  if (!app) app = { name: "fallback" };
  if (!auth) auth = { 
    currentUser: null, 
    onAuthStateChanged: (callback) => callback(null),
    signInWithEmailAndPassword: () => Promise.reject(new Error("Firebase Auth not initialized")),
    createUserWithEmailAndPassword: () => Promise.reject(new Error("Firebase Auth not initialized")),
    signOut: () => Promise.reject(new Error("Firebase Auth not initialized"))
  };
  if (!db) db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.reject(new Error("Firestore not initialized")),
        set: () => Promise.reject(new Error("Firestore not initialized")),
        update: () => Promise.reject(new Error("Firestore not initialized")),
      })
    })
  };
}

export { app, auth, db }; 