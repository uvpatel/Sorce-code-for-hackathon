// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const googleProvider = new GoogleAuthProvider();

// Handle Error Messages
const showError = (message) => {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
};

// Handle Success Messages
const showSuccess = (message) => {
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 5000);
};

// Email/Password Sign Up
export const signUpWithEmail = async (email, password, name) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            createdAt: new Date().toISOString(),
            profileCompleted: false
        });

        showSuccess("Account created successfully!");
        return { success: true, user };
    } catch (error) {
        showError(error.message);
        return { success: false, error: error.message };
    }
};

// Email/Password Sign In
export const signInWithEmail = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        showSuccess("Signed in successfully!");
        window.location.href = 'index.html';
        return { success: true, user: userCredential.user };
    } catch (error) {
        showError(error.message);
        return { success: false, error: error.message };
    }
};

// Google Sign In
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user profile exists
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
            // Create new user profile
            await setDoc(doc(db, "users", user.uid), {
                name: user.displayName,
                email: user.email,
                createdAt: new Date().toISOString(),
                profileCompleted: false
            });
        }

        showSuccess("Signed in with Google successfully!");
        window.location.href = 'index.html';
        return { success: true, user };
    } catch (error) {
        showError(error.message);
        return { success: false, error: error.message };
    }
};

// Sign Out
export const signOutUser = async () => {
    try {
        await signOut(auth);
        showSuccess("Signed out successfully!");
        window.location.href = 'signup.html';
        return { success: true };
    } catch (error) {
        showError(error.message);
        return { success: false, error: error.message };
    }
};

// Auth State Observer
export const initAuthStateObserver = (callback) => {
    onAuthStateChanged(auth, (user) => {
        callback(user);
    });
};

document.addEventListener('DOMContentLoaded', () => {
  const signInForm = document.querySelector('.sign-in-form');
  const signUpForm = document.querySelector('.sign-up-form');
  const googleBtn = document.querySelector('.google-btn');
  const errorMessage = document.querySelector('.error-message');
  const successMessage = document.querySelector('.success-message');

  // Show error message
  const showError = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast error';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Show success message
  const showSuccess = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Sign In Form Submit
  if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = signInForm.querySelector('input[type="email"]').value;
      const password = signInForm.querySelector('input[type="password"]').value;

      try {
        const result = await signInWithEmail(email, password);
        if (result.success) {
          showSuccess('Successfully signed in!');
          window.location.href = 'index.html';
        } else {
          showError(result.error);
        }
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // Sign Up Form Submit
  if (signUpForm) {
    signUpForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = signUpForm.querySelector('input[type="email"]').value;
      const password = signUpForm.querySelector('input[type="password"]').value;
      const confirmPassword = signUpForm.querySelector('input[name="confirm-password"]').value;

      if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
      }

      try {
        const result = await signUpWithEmail(email, password);
        if (result.success) {
          showSuccess('Account created successfully!');
          window.location.href = 'index.html';
        } else {
          showError(result.error);
        }
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // Google Sign In
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      try {
        const result = await signInWithGoogle();
        if (result.success) {
          showSuccess('Successfully signed in with Google!');
          window.location.href = 'index.html';
        } else {
          showError(result.error);
        }
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // Sign Out
  const signOutBtn = document.querySelector('.sign-out-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        const result = await signOutUser();
        if (result.success) {
          showSuccess('Successfully signed out!');
          window.location.href = 'index.html';
        } else {
          showError(result.error);
        }
      } catch (error) {
        showError(error.message);
      }
    });
  }

  // Auth state observer
  auth.onAuthStateChanged((user) => {
    const authButtons = document.querySelectorAll('.auth-btn');
    if (user) {
      // User is signed in
      authButtons.forEach(btn => {
        if (btn.classList.contains('sign-in')) {
          btn.style.display = 'none';
        } else if (btn.classList.contains('sign-out')) {
          btn.style.display = 'block';
        }
      });
    } else {
      // User is signed out
      authButtons.forEach(btn => {
        if (btn.classList.contains('sign-in')) {
          btn.style.display = 'block';
        } else if (btn.classList.contains('sign-out')) {
          btn.style.display = 'none';
        }
      });
    }
  });
});
