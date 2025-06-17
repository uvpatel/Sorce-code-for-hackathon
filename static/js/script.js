// script.js - Career Compass Frontend JavaScript

// API Configuration
const API_URL = 'http://localhost:3000/api';
let socket = null;
let authToken = localStorage.getItem('authToken');

// Authentication Functions
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        const data = await response.json();
        if (data.token) {
            authToken = data.token;
            localStorage.setItem('authToken', authToken);
            initializeSocket();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    }
}

function initializeSocket() {
    socket = io('http://localhost:3000', {
        auth: {
            token: authToken
        }
    });

    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus('Connected');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus('Disconnected');
    });

    socket.on('botResponse', (message) => {
        addMessageToChat(message, 'bot');
    });

    socket.on('assessmentResults', (results) => {
        displayAssessmentResults(results);
    });

    socket.on('error', (errorMessage) => {
        showError(errorMessage);
    });
}

// Career API Functions
async function getCareerRecommendations(skills) {
    try {
        const response = await fetch(`${API_URL}/careers/recommendations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ skills }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data.recommendations;
    } catch (error) {
        showError('Failed to get recommendations: ' + error.message);
        return [];
    }
}

async function getCareerDetails(careerId) {
    try {
        const response = await fetch(`${API_URL}/careers/details/${careerId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data.details;
    } catch (error) {
        showError('Failed to get career details: ' + error.message);
        return null;
    }
}

// UI Functions
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = `status-${status.toLowerCase()}`;
    }
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

function addMessageToChat(message, sender) {
    const chatMessages = document.querySelector('.chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayAssessmentResults(results) {
    const resultsContainer = document.getElementById('assessment-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';
    const title = document.createElement('h3');
    title.textContent = 'Assessment Results';
    resultsContainer.appendChild(title);

    results.forEach(result => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        resultDiv.innerHTML = `
            <h4>${result.career}</h4>
            <p>Match Score: ${result.matchScore}%</p>
            <p>${result.description}</p>
        `;
        resultsContainer.appendChild(resultDiv);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize socket if user is authenticated
    if (authToken) {
        initializeSocket();
    }

    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const success = await login(email, password);
            if (success) {
                window.location.href = '/dashboard.html';
            } else {
                showError('Login failed. Please check your credentials.');
            }
        });
    }

    // Chat form handler
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const messageInput = document.getElementById('user-message');
            const message = messageInput.value.trim();
            if (message && socket) {
                socket.emit('userMessage', message);
                addMessageToChat(message, 'user');
                messageInput.value = '';
            }
        });
    }

    // Skills assessment form handler
    const assessmentForm = document.getElementById('assessment-form');
    if (assessmentForm) {
        assessmentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const skills = {};
            const inputs = assessmentForm.querySelectorAll('input[type="range"]');
            inputs.forEach(input => {
                skills[input.name] = parseInt(input.value);
            });
            if (socket) {
                socket.emit('skillsAssessment', skills);
            }
        });
    }
});

// script.js - Career Compass Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    // Skills Assessment Category Switching
    const categories = document.querySelectorAll('.category');
    
    categories.forEach(category => {
        category.addEventListener('click', function() {
            // Remove active class from all categories
            categories.forEach(cat => cat.classList.remove('active'));
            
            // Add active class to clicked category
            this.classList.add('active');
            
            // Hide all skill groups
            document.querySelectorAll('.skills-group').forEach(group => {
                group.classList.remove('active');
            });
            
            // Show corresponding skill group
            const categoryId = this.getAttribute('data-category');
            document.getElementById(`${categoryId}-skills`).classList.add('active');
        });
    });
    
    // Star Rating System
    const stars = document.querySelectorAll('.star');
    
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const rating = this.parentElement;
            const stars = rating.querySelectorAll('.star');
            
            // Clear active class from all stars
            stars.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked star and all stars before it
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-value')) <= parseInt(value)) {
                    s.classList.add('active');
                }
            });
            
            // Update skill value
            rating.setAttribute('data-rating', value);
        });
    });
    
    // Get Results Button
    const getResultsBtn = document.getElementById('getResults');
    
    if (getResultsBtn) {
        getResultsBtn.addEventListener('click', function() {
            // Collect all ratings
            const skills = {};
            document.querySelectorAll('.rating').forEach(rating => {
                const skill = rating.getAttribute('data-skill');
                const value = rating.getAttribute('data-rating') || '0';
                skills[skill] = parseInt(value);
            });
            
            // Process skills and show chatbot with recommendations
            processSkills(skills);
            showChatbot();
        });
    }
    
    // Process skills and generate career recommendations
    function processSkills(skills) {
        // Calculate strongest skill categories
        const technicalSkills = ['programming', 'data-analysis', 'web-development', 'security', 'cloud'];
        const softSkills = ['communication', 'leadership', 'problem-solving', 'teamwork', 'adaptability'];
        const industrySkills = ['healthcare', 'finance', 'technology', 'marketing', 'education'];
        
        const technicalScore = calculateCategoryScore(skills, technicalSkills);
        const softScore = calculateCategoryScore(skills, softSkills);
        const industryScore = calculateCategoryScore(skills, industrySkills);
        
        // Find top industry preference
        let topIndustry = '';
        let topIndustryScore = 0;
        
        industrySkills.forEach(skill => {
            if (skills[skill] > topIndustryScore) {
                topIndustryScore = skills[skill];
                topIndustry = skill;
            }
        });
        
        // Generate career recommendations based on skills
        const recommendations = generateRecommendations(technicalScore, softScore, topIndustry);
        
        // Add recommendations to the chatbot
        displayRecommendations(recommendations);
    }
    
    // Calculate average score for a category of skills
    function calculateCategoryScore(skills, category) {
        let total = 0;
        let count = 0;
        
        category.forEach(skill => {
            if (skills[skill]) {
                total += skills[skill];
                count++;
            }
        });
        
        return count > 0 ? total / count : 0;
    }
    
    // Generate career recommendations based on skills
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
                recommendations.push('Medical Technology Coordinator');
            } else if (topIndustry === 'finance') {
                recommendations.push('Financial Technology Consultant');
                recommendations.push('Data Analyst');
            } else if (topIndustry === 'technology') {
                recommendations.push('IT Project Manager');
                recommendations.push('QA Specialist');
            } else if (topIndustry === 'marketing') {
                recommendations.push('Digital Marketing Manager');
                recommendations.push('SEO Specialist');
            } else if (topIndustry === 'education') {
                recommendations.push('Instructional Designer');
                recommendations.push('Educational Content Developer');
            }
        }
        
        // Soft skills focused careers
        if (softScore >= 4) {
            if (topIndustry === 'healthcare') {
                recommendations.push('Healthcare Administrator');
                recommendations.push('Patient Advocate');
            } else if (topIndustry === 'finance') {
                recommendations.push('Financial Advisor');
                recommendations.push('Investment Relationship Manager');
            } else if (topIndustry === 'technology') {
                recommendations.push('Technology Consultant');
                recommendations.push('IT Team Lead');
            } else if (topIndustry === 'marketing') {
                recommendations.push('Brand Manager');
                recommendations.push('Public Relations Specialist');
            } else if (topIndustry === 'education') {
                recommendations.push('Education Administrator');
                recommendations.push('Corporate Trainer');
            }
        } else if (softScore >= 3) {
            if (topIndustry === 'healthcare') {
                recommendations.push('Health Services Coordinator');
                recommendations.push('Medical Office Manager');
            } else if (topIndustry === 'finance') {
                recommendations.push('Account Manager');
                recommendations.push('Client Services Representative');
            } else if (topIndustry === 'technology') {
                recommendations.push('Technical Product Manager');
                recommendations.push('Customer Success Manager');
            } else if (topIndustry === 'marketing') {
                recommendations.push('Marketing Coordinator');
                recommendations.push('Communications Specialist');
            } else if (topIndustry === 'education') {
                recommendations.push('Academic Advisor');
                recommendations.push('Program Coordinator');
            }
        }
        
        // If no strong preferences, add general recommendations
        if (recommendations.length === 0) {
            recommendations.push('Career Development Coach');
            recommendations.push('Administrative Coordinator');
            recommendations.push('Customer Service Representative');
            recommendations.push('Operations Assistant');
        }
        
        return recommendations;
    }
    
    // Display recommendations in chatbot
    function displayRecommendations(recommendations) {
        const chatMessages = document.querySelector('.chat-messages');
        
        if (chatMessages) {
            // Create recommendation message
            const message = document.createElement('div');
            message.className = 'message bot-message';
            
            let messageContent = `<p>Based on your skills assessment, here are some career paths that might be a good fit for you:</p>
            <ul style="margin-top: 10px; margin-left: 20px;">`;
            
            recommendations.forEach(rec => {
                messageContent += `<li style="margin-bottom: 5px;">${rec}</li>`;
            });
            
            messageContent += `</ul>
            <p style="margin-top: 10px;">Would you like more information about any of these careers? Or would you like resume tips for these roles?</p>`;
            
            message.innerHTML = messageContent;
            chatMessages.appendChild(message);
            
            // Scroll to bottom of chat
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Chatbot Toggle
    const chatbotHeader = document.querySelector('.chatbot-header');
    const chatbot = document.querySelector('.chatbot');
    const chatbotToggle = document.querySelector('.chatbot-toggle');
    
    if (chatbotHeader && chatbot && chatbotToggle) {
        chatbotHeader.addEventListener('click', function() {
            chatbot.classList.toggle('active');
            chatbotToggle.innerHTML = chatbot.classList.contains('active') ? 
                '<i class="fas fa-chevron-down"></i>' : 
                '<i class="fas fa-chevron-up"></i>';
        });
    }
    
    // Show chatbot function
    function showChatbot() {
        if (chatbot) {
            chatbot.classList.add('active');
            chatbotToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    }
    
    // Send Message in Chatbot
    const sendMessageBtn = document.getElementById('sendMessage');
    const userMessageInput = document.getElementById('userMessage');
    
    if (sendMessageBtn && userMessageInput) {
        // Send message when button is clicked
        sendMessageBtn.addEventListener('click', function() {
            sendUserMessage();
        });
        
        // Send message when Enter key is pressed
        userMessageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendUserMessage();
            }
        });
    }
    
    // Send user message and get AI response
    function sendUserMessage() {
        const message = userMessageInput.value.trim();
        
        if (message !== '') {
            // Add user message to chat
            addMessageToChat(message, 'user');
            
            // Clear input
            userMessageInput.value = '';
            
            // Simulate AI response (would integrate with backend API in production)
            setTimeout(() => {
                processAIResponse(message);
            }, 1000);
        }
    }
    
    // Add message to chat
    function addMessageToChat(message, sender) {
        const chatMessages = document.querySelector('.chat-messages');
        
        if (chatMessages) {
            // Create message element
            const messageElement = document.createElement('div');
            messageElement.className = `message ${sender}-message`;
            messageElement.textContent = message;
            
            // Add to chat
            chatMessages.appendChild(messageElement);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Process and generate AI response (would be handled by backend in production)
    function processAIResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        let response = '';
        
        // Simple rule-based responses (would be replaced by actual AI backend)
        if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
            response = 'To improve your resume, focus on quantifiable achievements rather than just listing job duties. Use action verbs, and tailor your resume for each job application by matching keywords from the job description.';
        } else if (lowerMessage.includes('interview')) {
            response = 'For interview preparation, research the company thoroughly, prepare stories that demonstrate your skills, and practice the STAR method (Situation, Task, Action, Result) for answering behavioral questions.';
        } else if (lowerMessage.includes('networking')) {
            response = 'To build your professional network, attend industry events, join relevant LinkedIn groups, and don\'t hesitate to reach out to people for informational interviews. Follow up with new connections to maintain relationships.';
        } else if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) {
            response = 'To develop in-demand skills, consider online courses from platforms like Coursera, edX, or LinkedIn Learning. Look for skills that appear frequently in job postings for your target role.';
        } else if (lowerMessage.includes('thank')) {
            response = 'You\'re welcome! I\'m happy to help with your career planning. Is there anything else you\'d like to know?';
        } else {
            response = 'I\'m here to help with your career questions. You can ask me about resume tips, interview preparation, networking strategies, or specific careers you\'re interested in.';
        }
        
        // Add AI response to chat
        addMessageToChat(response, 'bot');
    }
});