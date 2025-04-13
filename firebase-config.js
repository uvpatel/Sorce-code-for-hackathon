// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC5H7g9UVTcWsQVoXdNspBRUE-r-JGGe7I",
  authDomain: "career-connect-hackathon.firebaseapp.com",
  projectId: "career-connect-hackathon",
  storageBucket: "career-connect-hackathon.appspot.com",
  messagingSenderId: "1053668817544",
  appId: "1:1053668817544:web:25ae34be31ce9ac82be7f9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const twitterProvider = new TwitterAuthProvider();

// Password validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters long`);
  if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
  if (!hasNumbers) errors.push('Password must contain at least one number');
  if (!hasSpecialChar) errors.push('Password must contain at least one special character');

  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};

// Calculate password strength (0-100)
const calculatePasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/\d/.test(password)) strength += 20;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 10;
  return Math.min(100, strength);
};

// Set auth persistence
export const setAuthPersistence = async (rememberMe) => {
  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Authentication functions
export const signInWithEmail = async (email, password, rememberMe = false) => {
  try {
    await setAuthPersistence(rememberMe);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { 
      success: false, 
      error: getReadableErrorMessage(error.code) 
    };
  }
};

export const signUpWithEmail = async (email, password) => {
  try {
    // Validate password
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return { 
        success: false, 
        error: validation.errors.join('\n'),
        passwordStrength: validation.strength 
      };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { 
      success: false, 
      error: getReadableErrorMessage(error.code) 
    };
  }
};

// Social sign-in functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return { 
      success: false, 
      error: getReadableErrorMessage(error.code) 
    };
  }
};

export const signInWithFacebook = async () => {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return { 
      success: false, 
      error: getReadableErrorMessage(error.code) 
    };
  }
};

export const signInWithTwitter = async () => {
  try {
    const result = await signInWithPopup(auth, twitterProvider);
    return { success: true, user: result.user };
  } catch (error) {
    return { 
      success: false, 
      error: getReadableErrorMessage(error.code) 
    };
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: getReadableErrorMessage(error.code) 
    };
  }
};

// Convert Firebase error codes to readable messages
const getReadableErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
    'auth/weak-password': 'Please choose a stronger password.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email. Please sign up.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid login credentials. Please check your email and password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your internet connection.',
    'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site.',
    'auth/popup-closed-by-user': 'Sign-in cancelled. Please try again.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.'
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

export { auth, db };