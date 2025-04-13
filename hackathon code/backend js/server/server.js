// server.js - Main server file for Career Compass backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import routes
const careerRoutes = require('../routes/careerRoutes');
const chatRoutes = require('../routes/chatRoutes');
const assessmentRoutes = require('../routes/assessmentRoutes');
const authRoutes = require('../routes/authRoutes');

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.io
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
const staticPath = path.join(__dirname, '../../..');
app.use(express.static(staticPath));
console.log('Serving static files from:', staticPath);

// API Routes
app.use('/api/careers', careerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/auth', authRoutes);

// API error handling middleware
app.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({ 
        error: 'Server error', 
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
    });
});

// Serve the main HTML file for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Handle user messages
    socket.on('userMessage', async (message) => {
        try {
            // Process the message (this would integrate with OpenAI API in production)
            console.log('Received message:', message);
            
            // Simulated delay to mimic AI processing
            setTimeout(() => {
                // Generate a response
                const response = generateResponse(message);
                
                // Send response back to client
                socket.emit('botResponse', response);
            }, 1000);
        } catch (error) {
            console.error('Error processing message:', error);
            socket.emit('error', 'Sorry, there was an error processing your message.');
        }
    });
    
    // Handle skills assessment
    socket.on('assessmentResults', (skills) => {
        try {
            console.log('Received skills assessment:', skills);
            
            // Process skills and generate recommendations
            const recommendations = processSkillsAssessment(skills);
            
            // Send recommendations back to client
            socket.emit('careerRecommendations', recommendations);
        } catch (error) {
            console.error('Error processing assessment:', error);
            socket.emit('error', 'Sorry, there was an error processing your skills assessment.');
        }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Simple response generator (would be replaced by OpenAI API in production)
function generateResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
        return 'To improve your resume, focus on quantifiable achievements rather than just listing job duties. Use action verbs, and tailor your resume for each job application by matching keywords from the job description.';
    } else if (lowerMessage.includes('interview')) {
        return 'For interview preparation, research the company thoroughly, prepare stories that demonstrate your skills, and practice the STAR method (Situation, Task, Action, Result) for answering behavioral questions.';
    } else if (lowerMessage.includes('networking')) {
        return 'To build your professional network, attend industry events, join relevant LinkedIn groups, and don\'t hesitate to reach out to people for informational interviews. Follow up with new connections to maintain relationships.';
    } else if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) {
        return 'To develop in-demand skills, consider online courses from platforms like Coursera, edX, or LinkedIn Learning. Look for skills that appear frequently in job postings for your target role.';
    } else if (lowerMessage.includes('thank')) {
        return 'You\'re welcome! I\'m happy to help with your career planning. Is there anything else you\'d like to know?';
    } else {
        return 'I\'m here to help with your career questions. You can ask me about resume tips, interview preparation, networking strategies, or specific careers you\'re interested in.';
    }
}

// Process skills assessment (simplified for demo)
function processSkillsAssessment(skills) {
    // Calculate strongest skill categories
    const technicalSkills = ['programming', 'data-analysis', 'web-development', 'security', 'cloud'];
    const softSkills = ['communication', 'leadership', 'problem-solving', 'teamwork', 'adaptability'];
    const industrySkills = ['healthcare', 'finance', 'technology', 'marketing', 'education'];
    
    // Calculate average scores
    const technicalScore = calculateCategoryScore(skills, technicalSkills);
    const softScore = calculateCategoryScore(skills, softSkills);
    
    // Find top industry
    let topIndustry = '';
    let topIndustryScore = 0;
    
    for (const skill of industrySkills) {
        if (skills[skill] > topIndustryScore) {
            topIndustryScore = skills[skill];
            topIndustry = skill;
        }
    }
    
    // Generate recommendations based on skills
    return generateRecommendations(technicalScore, softScore, topIndustry);
}

// Calculate average score for a category
function calculateCategoryScore(skills, category) {
    let total = 0;
    let count = 0;
    
    for (const skill of category) {
        if (skills[skill]) {
            total += skills[skill];
            count++;
        }
    }
    
    return count > 0 ? total / count : 0;
}

// Generate career recommendations
function generateRecommendations(technicalScore, softScore, topIndustry) {
    const recommendations = [];
    
    // Technical-focused careers
    if (technicalScore >= 4) {
        if (topIndustry === 'healthcare') {
            recommendations.push('Healthcare IT Specialist');
            recommendations.push('Medical Data Analyst');
        } else if (topIndustry === 'finance') {
            recommendations.push('Financial Systems Analyst');
            recommendations.push('Blockchain Developer');
        } else if (topIndustry === 'technology') {
            recommendations.push('Software Engineer');
            recommendations.push('DevOps Engineer');
        } else if (topIndustry === 'marketing') {
            recommendations.push('Marketing Technology Specialist');
            recommendations.push('Digital Marketing Analyst');
        } else if (topIndustry === 'education') {
            recommendations.push('Educational Technology Specialist');
            recommendations.push('E-Learning Developer');
        }
    } else if (technicalScore >= 3) {
        if (topIndustry === 'healthcare') {
            recommendations.push('Health Informatics Specialist');
        } else if (topIndustry === 'finance') {
            recommendations.push('Financial Technology Consultant');
        } else if (topIndustry === 'technology') {
            recommendations.push('IT Project Manager');
        } else if (topIndustry === 'marketing') {
            recommendations.push('Digital Marketing Manager');
        } else if (topIndustry === 'education') {
            recommendations.push('Instructional Designer');
        }
    }
    
    // Soft skills focused careers
    if (softScore >= 4) {
        if (topIndustry === 'healthcare') {
            recommendations.push('Healthcare Administrator');
        } else if (topIndustry === 'finance') {
            recommendations.push('Financial Advisor');
        } else if (topIndustry === 'technology') {
            recommendations.push('Technology Consultant');
        } else if (topIndustry === 'marketing') {
            recommendations.push('Brand Manager');
        } else if (topIndustry === 'education') {
            recommendations.push('Education Administrator');
        }
    } else if (softScore >= 3) {
        if (topIndustry === 'healthcare') {
            recommendations.push('Health Services Coordinator');
        } else if (topIndustry === 'finance') {
            recommendations.push('Account Manager');
        } else if (topIndustry === 'technology') {
            recommendations.push('Customer Success Manager');
        } else if (topIndustry === 'marketing') {
            recommendations.push('Communications Specialist');
        } else if (topIndustry === 'education') {
            recommendations.push('Academic Advisor');
        }
    }
    
    // If no strong preferences, add general recommendations
    if (recommendations.length === 0) {
        recommendations.push('Career Development Coach');
        recommendations.push('Administrative Coordinator');
        recommendations.push('Customer Service Representative');
    }
    
    return recommendations;
}

// Connect to MongoDB (commented out for now as we're not using it yet)
/*
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/careercompass', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
*/

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 