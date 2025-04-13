import { 
    signUpUser, 
    signInUser, 
    signOutUser, 
    subscribeToAuthChanges,
    getUserProfile 
} from './firebase-config.js';

// DOM Elements
const authForm = document.getElementById('authForm');
const nameField = document.getElementById('nameField');
const emailField = document.getElementById('emailField');
const passwordField = document.getElementById('passwordField');
const submitButton = document.getElementById('submitButton');
const toggleButton = document.getElementById('toggleButton');
const errorMessage = document.getElementById('errorMessage');
const userSection = document.getElementById('userSection');
const loginSection = document.getElementById('loginSection');

let isLoginMode = true;

// Toggle between login and signup
toggleButton.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    nameField.style.display = isLoginMode ? 'none' : 'block';
    submitButton.textContent = isLoginMode ? 'Login' : 'Sign Up';
    toggleButton.textContent = isLoginMode ? 'Need an account? Sign Up' : 'Already have an account? Login';
    errorMessage.textContent = '';
});

// Handle form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMessage.textContent = '';

    const email = emailField.value;
    const password = passwordField.value;

    try {
        if (isLoginMode) {
            // Login
            const { user, error } = await signInUser(email, password);
            if (error) {
                throw new Error(error);
            }
            
            // Get user profile
            const { profile, profileError } = await getUserProfile(user.uid);
            if (profileError) {
                throw new Error(profileError);
            }

            // Redirect to dashboard or show welcome message
            handleSuccessfulAuth(profile);
        } else {
            // Sign up
            const name = nameField.value;
            if (!name) {
                throw new Error('Name is required');
            }

            const { user, error } = await signUpUser(email, password, name);
            if (error) {
                throw new Error(error);
            }

            // Redirect to dashboard or show welcome message
            handleSuccessfulAuth({ name, email });
        }
    } catch (error) {
        errorMessage.textContent = error.message;
    }
});

// Auth state observer
subscribeToAuthChanges((user) => {
    if (user) {
        // User is signed in
        loginSection.style.display = 'none';
        userSection.style.display = 'block';
        
        // Get and display user profile
        getUserProfile(user.uid).then(({ profile, error }) => {
            if (profile) {
                userSection.innerHTML = `
                    <h2>Welcome, ${profile.name}!</h2>
                    <p>Email: ${profile.email}</p>
                    <button id="signOutButton">Sign Out</button>
                `;
                
                // Add sign out functionality
                document.getElementById('signOutButton').addEventListener('click', async () => {
                    const { error } = await signOutUser();
                    if (error) {
                        errorMessage.textContent = error;
                    }
                });
            }
        });
    } else {
        // User is signed out
        loginSection.style.display = 'block';
        userSection.style.display = 'none';
    }
});

// Handle successful authentication
function handleSuccessfulAuth(profile) {
    // Clear form
    authForm.reset();
    errorMessage.textContent = '';
    
    // You can redirect to another page or update UI here
    console.log('Authentication successful:', profile);
}
