// script.js - Career Compass Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Import Firebase modules
    let auth, db;
    let currentUser = null;

    // Initialize Firebase (if the module is loaded)
    const initFirebase = async () => {
        try {
            const firebaseModule = await import('./firebase-config.js');
            auth = firebaseModule.auth;
            db = firebaseModule.db;
            
            // Listen for auth state changes
            auth.onAuthStateChanged((user) => {
                currentUser = user;
                console.log('Auth state changed:', user ? 'logged in' : 'logged out');
            });
        } catch (error) {
            console.error('Error loading Firebase:', error);
        }
    };

    // Initialize Firebase
    initFirebase();
    
    // Initialize Socket.io connection
    let socket;
    try {
        socket = io();
        
        // Setup socket event listeners
        socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        socket.on('botResponse', (message) => {
            addMessageToChat(message, 'bot');
        });
        
        socket.on('careerRecommendations', (recommendations) => {
            displayRecommendations(recommendations);
        });
        
        socket.on('error', (errorMessage) => {
            addMessageToChat(`Error: ${errorMessage}`, 'bot error');
        });
    } catch (error) {
        console.error('Error initializing Socket.io:', error);
        socket = { connected: false, emit: () => {} }; // Create dummy socket
    }
    
    // Career API Interaction Functions
    
    // Get career recommendations based on skills
    function getCareerRecommendations(skills) {
        return fetch('/api/careers/recommendations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ skills }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.recommendations;
            } else {
                throw new Error(data.error || 'Failed to get recommendations');
            }
        });
    }
    
    // Get details about a specific career
    function getCareerDetails(career) {
        return fetch(`/api/careers/details/${encodeURIComponent(career)}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.details;
            } else {
                throw new Error(data.error || 'Failed to get career details');
            }
        });
    }
    
    // Get market demand data
    function getMarketDemandData() {
        return fetch('/api/careers/market-demand')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.marketData;
            } else {
                throw new Error(data.error || 'Failed to get market demand data');
            }
        });
    }
    
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
                    // Change the star icon to filled
                    s.querySelector('i').className = 'fas fa-star';
                } else {
                    // Change the star icon to outline
                    s.querySelector('i').className = 'far fa-star';
                }
            });
            
            // Update skill value
            rating.setAttribute('data-rating', value);
        });
    });
    
    // Function to save assessment results to Firebase
    async function saveAssessmentToFirebase(userId, skills) {
        if (!db) return false;
        
        try {
            // Import Firestore utility functions
            const { saveAssessmentResults } = await import('./firestore-utils.js');
            
            // Process skills for better organization
            const assessmentData = {
                technicalSkills: {},
                softSkills: {},
                industryKnowledge: {},
                timestamp: new Date().toISOString(),
                topSkills: [],
                suggestedCareers: []
            };
            
            // Organize skills by category
            for (const [key, value] of Object.entries(skills)) {
                if (['programming', 'data-analysis', 'web-development', 'security', 'cloud'].includes(key)) {
                    assessmentData.technicalSkills[key] = value;
                } else if (['communication', 'leadership', 'problem-solving', 'teamwork', 'adaptability'].includes(key)) {
                    assessmentData.softSkills[key] = value;
                } else {
                    assessmentData.industryKnowledge[key] = value;
                }
            }
            
            // Find top skills (rating of 4 or 5)
            for (const [key, value] of Object.entries(skills)) {
                if (value >= 4) {
                    assessmentData.topSkills.push(key);
                }
            }
            
            // Generate career suggestions based on skills
            const processed = processSkills(skills);
            assessmentData.suggestedCareers = processed;
            
            // Save to Firebase
            const result = await saveAssessmentResults(userId, assessmentData);
            return result.success;
        } catch (error) {
            console.error('Error saving assessment to Firebase:', error);
            return false;
        }
    }
    
    // Get Results Button
    const getResultsBtn = document.getElementById('getResults');
    
    if (getResultsBtn) {
        getResultsBtn.addEventListener('click', async function() {
            // Collect all ratings
            const skills = {};
            document.querySelectorAll('.rating').forEach(rating => {
                const skill = rating.getAttribute('data-skill');
                const value = rating.getAttribute('data-rating') || '0';
                skills[skill] = parseInt(value);
            });
            
            // Check if any skills are rated
            const hasRatedSkills = Object.values(skills).some(value => value > 0);
            if (!hasRatedSkills) {
                alert('Please rate at least one skill before continuing.');
                return;
            }

            // Store assessment data in session storage for use in AI advisor
            sessionStorage.setItem('skillsAssessment', JSON.stringify(skills));
            
            // If user is logged in, save to Firebase
            if (currentUser) {
                try {
                    // Save to Firebase
                    await saveAssessmentToFirebase(currentUser.uid, skills);
                    
                    // Redirect to AI advisor
                    window.location.href = 'ai-advisor.html?source=assessment';
                } catch (error) {
                    console.error('Error saving assessment:', error);
                    
                    // Still redirect even if save fails
                    window.location.href = 'ai-advisor.html?source=assessment';
                }
            } else {
                // If not logged in, prompt to log in first
                if (confirm('You need to log in to save your assessment and get personalized recommendations. Would you like to log in now?')) {
                    // Save current URL to return after login
                    sessionStorage.setItem('redirectAfterLogin', 'ai-advisor.html?source=assessment');
                    window.location.href = 'login.html';
                } else {
                    // Continue to AI advisor without saving
                    window.location.href = 'ai-advisor.html?source=assessment';
                }
            }
        });
    }
    
    // Career detail view
    const recommendationsList = document.querySelector('.recommendations-list');
    if (recommendationsList) {
        recommendationsList.addEventListener('click', function(e) {
            if (e.target.classList.contains('view-details')) {
                const career = e.target.getAttribute('data-career');
                if (career) {
                    getCareerDetails(career)
                        .then(details => {
                            displayCareerDetails(details);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            addMessageToChat(`Error fetching details for ${career}. Please try again.`, 'bot error');
                        });
                }
            }
        });
    }
    
    // Display career details in the chat
    function displayCareerDetails(details) {
        let detailsHTML = `<div class="career-details">
            <h3>${details.title || 'Career Details'}</h3>
            <p><strong>Description:</strong> ${details.description}</p>
            <p><strong>Required Skills:</strong> ${details.skills.join(', ')}</p>
            <p><strong>Education:</strong> ${details.education}</p>
            <p><strong>Salary Range:</strong> ${details.salary}</p>
            <p><strong>Growth Outlook:</strong> ${details.growth}</p>
            <p><strong>Career Path:</strong> ${details.paths.join(' → ')}</p>
        </div>`;
        
        addMessageToChat(detailsHTML, 'bot');
    }
    
    // Process skills and generate career recommendations
    function processSkills(skills) {
        // Calculate strongest skill categories
        const technicalSkills = ['programming', 'data-analysis', 'web-development', 'security', 'cloud'];
        const softSkills = ['communication', 'leadership', 'problem-solving', 'teamwork', 'adaptability'];
        const industrySkills = ['healthcare', 'finance', 'technology', 'marketing', 'education'];
        
        // Calculate category scores
        const technicalScore = calculateCategoryScore(skills, technicalSkills);
        const softScore = calculateCategoryScore(skills, softSkills);
        
        // Determine top industry
        let topIndustry = '';
        let highestIndustryScore = 0;
        
        industrySkills.forEach(skill => {
            const score = skills[skill] || 0;
            if (score > highestIndustryScore) {
                highestIndustryScore = score;
                topIndustry = skill;
            }
        });
        
        // Generate recommendations based on skills
        return generateRecommendations(technicalScore, softScore, topIndustry);
    }
    
    // Calculate score for a category
    function calculateCategoryScore(skills, category) {
        let score = 0;
        let count = 0;
        
        category.forEach(skill => {
            if (skills[skill]) {
                score += skills[skill];
                count++;
            }
        });
        
        return count > 0 ? score / count : 0;
    }
    
    // Generate recommendations based on skills
    function generateRecommendations(technicalScore, softScore, topIndustry) {
        const recommendations = [];
        
        // High technical skills
        if (technicalScore >= 4) {
            if (topIndustry === 'healthcare') {
                recommendations.push('Health Informatics Specialist');
                recommendations.push('Medical Software Developer');
            } else if (topIndustry === 'finance') {
                recommendations.push('Financial Systems Analyst');
                recommendations.push('Quantitative Analyst');
            } else if (topIndustry === 'technology') {
                recommendations.push('Software Engineer');
                recommendations.push('Data Scientist');
            } else if (topIndustry === 'marketing') {
                recommendations.push('Digital Marketing Technologist');
                recommendations.push('Marketing Analytics Specialist');
            } else if (topIndustry === 'education') {
                recommendations.push('Educational Technology Developer');
                recommendations.push('Learning Systems Administrator');
            } else {
                recommendations.push('Software Developer');
                recommendations.push('Systems Analyst');
            }
        }
        // High soft skills
        else if (softScore >= 4) {
            if (topIndustry === 'healthcare') {
                recommendations.push('Health Services Manager');
                recommendations.push('Patient Advocate');
            } else if (topIndustry === 'finance') {
                recommendations.push('Financial Advisor');
                recommendations.push('Investment Relations Manager');
            } else if (topIndustry === 'technology') {
                recommendations.push('Product Manager');
                recommendations.push('IT Project Manager');
            } else if (topIndustry === 'marketing') {
                recommendations.push('Brand Manager');
                recommendations.push('Public Relations Specialist');
            } else if (topIndustry === 'education') {
                recommendations.push('School Administrator');
                recommendations.push('Corporate Trainer');
            } else {
                recommendations.push('Human Resources Manager');
                recommendations.push('Management Consultant');
            }
        }
        // Balanced skills
        else if (technicalScore >= 3 && softScore >= 3) {
            if (topIndustry === 'healthcare') {
                recommendations.push('Clinical Systems Coordinator');
                recommendations.push('Healthcare Consultant');
            } else if (topIndustry === 'finance') {
                recommendations.push('Business Analyst (Finance)');
                recommendations.push('Finance Operations Manager');
            } else if (topIndustry === 'technology') {
                recommendations.push('Technical Product Manager');
                recommendations.push('IT Consultant');
            } else if (topIndustry === 'marketing') {
                recommendations.push('Marketing Operations Manager');
                recommendations.push('CRM Specialist');
            } else if (topIndustry === 'education') {
                recommendations.push('Instructional Designer');
                recommendations.push('Education Technology Consultant');
            } else {
                recommendations.push('Business Analyst');
                recommendations.push('Project Coordinator');
            }
        }
        // Lower scores but with industry preference
        else if (topIndustry) {
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
        let recommendationsHTML = '<div class="recommendations">';
        recommendationsHTML += '<h3>Career Recommendations</h3>';
        recommendationsHTML += '<ul class="recommendations-list">';
        
        recommendations.forEach(career => {
            recommendationsHTML += `<li>
                <span class="career-title">${career}</span>
                <button class="view-details" data-career="${career}">View Details</button>
            </li>`;
        });
        
        recommendationsHTML += '</ul>';
        
        // Add market demand button
        recommendationsHTML += '<button id="viewMarketData" class="btn-secondary">View Market Trends</button>';
        
        recommendationsHTML += '</div>';
        
        addMessageToChat(recommendationsHTML, 'bot');
        
        // Add event listener for market data button
        setTimeout(() => {
            const marketDataBtn = document.getElementById('viewMarketData');
            if (marketDataBtn) {
                marketDataBtn.addEventListener('click', function() {
                    getMarketDemandData()
                        .then(marketData => {
                            displayMarketData(marketData);
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            addMessageToChat('Error fetching market data. Please try again.', 'bot error');
                        });
                });
            }
        }, 100);
    }
    
    // Display market demand data
    function displayMarketData(marketData) {
        let marketHTML = '<div class="market-demand">';
        marketHTML += '<h3>Market Demand by Industry</h3>';
        marketHTML += '<ul class="industry-list">';
        
        for (const [industry, data] of Object.entries(marketData)) {
            marketHTML += `<li>
                <div class="industry-header">
                    <h4>${industry.charAt(0).toUpperCase() + industry.slice(1)}</h4>
                    <span class="demand-badge ${data.demand.toLowerCase()}">${data.demand}</span>
                </div>
                <p>Growth: ${data.growth}%</p>
                <p>Top Skills: ${data.topSkills.join(', ')}</p>
            </li>`;
        }
        
        marketHTML += '</ul></div>';
        
        addMessageToChat(marketHTML, 'bot');
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
        
        if (message) {
            // Add user message to chat
            addMessageToChat(message, 'user');
            
            // Clear input
            userMessageInput.value = '';
            
            // Send message to the server via Socket.io
            socket.emit('userMessage', message);
            
            // If socket is not connected, use REST API as backup
            if (!socket.connected) {
                fetch('/api/chat/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message }),
                })
                .then(response => response.json())
                .then(data => {
                    addMessageToChat(data.response, 'bot');
                })
                .catch(error => {
                    console.error('Error:', error);
                    processAIResponse(message); // Fallback to client-side response
                });
            }
        }
    }
    
    // Add message to chat
    function addMessageToChat(message, sender) {
        const chatMessages = document.querySelector('.chat-messages');
        
        if (chatMessages) {
            // Create message element
            const messageElement = document.createElement('div');
            messageElement.className = `message ${sender}-message`;
            
            // Use innerHTML to render HTML content
            messageElement.innerHTML = message;
            
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
