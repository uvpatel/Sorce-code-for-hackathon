// authRoutes.js - Routes for authentication and user management
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Path to the file where login responses will be stored
const dataFilePath = path.join(__dirname, '../data/userResponses.json');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize the user responses file if it doesn't exist
if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify({
        signups: [],
        logins: [],
        lastUpdated: new Date().toISOString()
    }, null, 2));
}

// Handle user sign up
router.post('/signup', (req, res, next) => {
    try {
        console.log('Signup request received:', req.body);
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Load existing user data
        let userData;
        try {
            userData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        } catch (error) {
            console.error('Error reading user data file:', error);
            // Initialize with empty data if file read fails
            userData = { signups: [], logins: [], lastUpdated: new Date().toISOString() };
        }
        
        // Check if email already exists
        const existingUser = userData.signups.find(user => user.email === email);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        
        // Add new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            // In a real app, you would hash the password
            // For demo purposes, we're storing it as-is (NOT recommended in production)
            password,
            createdAt: new Date().toISOString()
        };
        
        userData.signups.push(newUser);
        userData.lastUpdated = new Date().toISOString();
        
        // Save the updated data
        try {
            fs.writeFileSync(dataFilePath, JSON.stringify(userData, null, 2));
        } catch (error) {
            console.error('Error writing user data file:', error);
            return res.status(500).json({ error: 'Failed to save user data' });
        }
        
        // Return success without the password
        const { password: _, ...userWithoutPassword } = newUser;
        console.log('User registered successfully:', userWithoutPassword);
        res.status(201).json({ 
            success: true, 
            message: 'User registered successfully',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error during signup:', error);
        next(error);
    }
});

// Handle user login
router.post('/login', (req, res, next) => {
    try {
        console.log('Login request received:', req.body);
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        // Load existing user data
        let userData;
        try {
            userData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        } catch (error) {
            console.error('Error reading user data file:', error);
            return res.status(500).json({ error: 'Failed to read user data' });
        }
        
        // Find user by email
        const user = userData.signups.find(user => user.email === email);
        
        // Check if user exists and password matches
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Record login attempt
        const loginRecord = {
            userId: user.id,
            email,
            timestamp: new Date().toISOString(),
            successful: true
        };
        
        userData.logins.push(loginRecord);
        userData.lastUpdated = new Date().toISOString();
        
        // Save the updated data
        try {
            fs.writeFileSync(dataFilePath, JSON.stringify(userData, null, 2));
        } catch (error) {
            console.error('Error writing user data file:', error);
            return res.status(500).json({ error: 'Failed to save login data' });
        }
        
        // Return success without the password
        const { password: _, ...userWithoutPassword } = user;
        console.log('User logged in successfully:', userWithoutPassword);
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Error during login:', error);
        next(error);
    }
});

// Get all user responses (admin only route in a real app)
router.get('/responses', (req, res) => {
    try {
        // In a real app, this would be protected by authentication
        const userData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
        
        // Remove passwords before sending the data
        const sanitizedData = {
            signups: userData.signups.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }),
            logins: userData.logins,
            lastUpdated: userData.lastUpdated
        };
        
        res.json(sanitizedData);
    } catch (error) {
        console.error('Error fetching user responses:', error);
        res.status(500).json({ error: 'Failed to fetch user responses' });
    }
});

module.exports = router; 