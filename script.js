// script.js - Career Compass Frontend JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Socket.io connection
    const socket = io();
    
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
        addMessageToChat(Error: ${errorMessage}, 'bot error');
    });
    
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
        return fetch(/api/careers/details/${encodeURIComponent(career)})
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
            document.getElementById(${categoryId}-skills).classList.add('active');
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
            
            // Send skills to the server using Socket.io
            socket.emit('assessmentResults', skills);
            
            // Also use the Career API as a backup
            getCareerRecommendations(skills)
                .then(recommendations => {
                    if (!socket.connected) {
                        displayRecommendations(recommendations);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    // Fallback to client-side processing
                    const clientRecommendations = processSkills(skills);
                    displayRecommendations(clientRecommendations);
                });
            
            showChatbot();
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
                            addMessageToChat(Error fetching details for ${career}. Please try again., 'bot error');
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
            messageElement.className = message ${sender}-message;
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