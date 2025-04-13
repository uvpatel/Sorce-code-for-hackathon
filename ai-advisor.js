// AI Advisor JavaScript with Firebase and OpenAI Integration

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { saveConversation, getAssessmentHistory } from "./firestore-utils.js";
import firebaseConfig from './firebase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const suggestionChips = document.querySelectorAll('.chip');
    const loginPrompt = document.getElementById('loginPrompt');
    const chatContainer = document.getElementById('chatContainer');
    const loginButton = document.getElementById('login-button');
    const signupButton = document.getElementById('signup-button');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    // OpenAI API Key - this should be securely stored on your backend
    // For development, we'll use a placeholder that will be replaced with your actual backend call
    const BACKEND_API_URL = '/api/chat';
    
    // Current user
    let currentUser = null;
    
    // Check if user has logged in previously - include all auth methods
    let hasLoggedInBefore = localStorage.getItem('hasLoggedInBefore') === 'true';
    let bypassAuth = localStorage.getItem('bypassAuth') === 'true';
    let tempAccess = localStorage.getItem('tempAdvisorAccess') === 'true';
    
    // Determine if user has any form of authorization
    let isAuthorized = hasLoggedInBefore || bypassAuth || tempAccess;
    
    console.log("Auth status on load:");
    console.log("- hasLoggedInBefore:", hasLoggedInBefore);
    console.log("- bypassAuth:", bypassAuth);
    console.log("- tempAccess:", tempAccess);
    console.log("- isAuthorized:", isAuthorized);

    // Chat history for context
    let chatHistory = [];
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    // Function to process skills assessment data
    function processSkillsAssessment(skills) {
        // Find top skills (rating of 4 or 5)
        const topSkills = [];
        for (const [key, value] of Object.entries(skills)) {
            if (value >= 4) {
                topSkills.push(key);
            }
        }
        
        // Calculate category strengths
        const technicalSkills = ['programming', 'data-analysis', 'web-development', 'security', 'cloud'];
        const softSkills = ['communication', 'leadership', 'problem-solving', 'teamwork', 'adaptability'];
        const industrySkills = ['healthcare', 'finance', 'technology', 'marketing', 'education'];
        
        const categories = {
            technical: calculateCategoryScore(skills, technicalSkills),
            soft: calculateCategoryScore(skills, softSkills),
            industry: calculateCategoryScore(skills, industrySkills)
        };
        
        // Determine top category
        let topCategory = 'balanced';
        if (categories.technical > categories.soft && categories.technical > 3) {
            topCategory = 'technical';
        } else if (categories.soft > categories.technical && categories.soft > 3) {
            topCategory = 'soft';
        }
        
        // Determine top industry
        let topIndustry = '';
        let highestIndustryScore = 0;
        
        for (const skill of industrySkills) {
            if (skills[skill] && skills[skill] > highestIndustryScore) {
                highestIndustryScore = skills[skill];
                topIndustry = skill;
            }
        }
        
        return {
            topSkills,
            topCategory,
            topIndustry,
            categories
        };
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
    
    // Check for URL parameters that indicate the source
    function checkForRedirectSource() {
        const urlParams = new URLSearchParams(window.location.search);
        const source = urlParams.get('source');
        
        if (source === 'assessment') {
            // Get skills assessment data from session storage
            const skillsData = sessionStorage.getItem('skillsAssessment');
            if (skillsData) {
                const skills = JSON.parse(skillsData);
                
                // Process the skills data
                const assessmentResult = processSkillsAssessment(skills);
                
                // Add assessment-based welcome message
                setTimeout(() => {
                    // Give some time for the auth check to complete
                    const initialMessage = generateAssessmentWelcomeMessage(assessmentResult);
                    addMessageToChat(initialMessage, 'bot');
                }, 1000);
            }
        }
    }
    
    // Generate welcome message based on assessment
    function generateAssessmentWelcomeMessage(assessment) {
        let message = `<p>I've analyzed your skills assessment, and here's what I found:</p>`;
        
        if (assessment.topSkills.length > 0) {
            message += `<p>Your top skills are: <strong>${assessment.topSkills.join(', ')}</strong></p>`;
        }
        
        message += `<p>Your profile shows strong ${assessment.topCategory} skills`;
        
        if (assessment.topIndustry) {
            message += ` with interest in the ${assessment.topIndustry} industry.`;
        } else {
            message += `.`;
        }
        
        message += `</p><p>I can help you explore career paths that align with these strengths or suggest ways to enhance your skills further. What would you like to know about?</p>`;
        
        return message;
    }
    
    // Check authentication state
    onAuthStateChanged(auth, async (user) => {
        console.log("Auth state changed, user:", user ? "logged in" : "not logged in");
        console.log("hasLoggedInBefore:", hasLoggedInBefore);
        
        if (user) {
            // User is signed in
            currentUser = user;
            
            if (loginPrompt && chatContainer) {
                loginPrompt.style.display = 'none';
                chatContainer.style.display = 'flex';
            }
            
            // Check if redirected after login
            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                sessionStorage.removeItem('redirectAfterLogin');
                // Don't redirect if we're already on the right page
                if (!window.location.href.includes(redirectPath)) {
                    window.location.href = redirectPath;
                    return;
                }
            }
            
            // Check for assessment data in the URL
            checkForRedirectSource();
            
            // Clear user input field and focus
            if (userInput) {
                userInput.value = '';
                userInput.focus();
            }
        } else {
            // User is signed out
            currentUser = null;
            
            if (loginPrompt && chatContainer) {
                // If the user has logged in before or has any other authorization, show chat interface instead of login prompt
                if (hasLoggedInBefore || bypassAuth || tempAccess || isAuthorized) {
                    console.log("User has some form of authorization, showing chat interface");
                    loginPrompt.style.display = 'none';
                    chatContainer.style.display = 'flex';
                    
                    // Focus on input field
                    if (userInput) {
                        userInput.focus();
                    }
                } else {
                    console.log("User has no authorization, showing login prompt");
                    loginPrompt.style.display = 'flex';
                    chatContainer.style.display = 'none';
                }
            }
        }
    });
    
    // Event listeners
    if (sendButton) {
        sendButton.addEventListener('click', handleUserMessage);
    }
    
    if (userInput) {
        userInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleUserMessage();
            }
        });
    }
    
    // Suggestion chip event listeners
    if (suggestionChips) {
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', function() {
                const query = this.getAttribute('data-query');
                userInput.value = query;
                handleUserMessage();
            });
        });
    }
    
    // Handle user message submission
    function handleUserMessage() {
        const message = userInput.value.trim();
        
        if (message) {
            // Add user message to chat
            addMessageToChat(message, 'user');
            
            // Add to chat history
            chatHistory.push({ role: 'user', content: message });
            
            // Clear input
            userInput.value = '';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Get response from OpenAI API
            getAIResponse(message);
        }
    }
    
    // Add message to chat
    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        // Use innerHTML to support HTML content
        messageElement.innerHTML = `<p>${formatMessage(message)}</p>`;
        
        if (chatMessages) {
            chatMessages.appendChild(messageElement);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Format message with HTML support
    function formatMessage(text) {
        // If text already contains HTML tags, return it as is
        if (text.startsWith('<p>') || text.startsWith('<div>')) {
            return text;
        }
        
        // Convert URLs to clickable links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        
        // Format code blocks
        text = text.replace(/```([\s\S]*?)```/g, '<div class="code-block">$1</div>');
        
        // Preserve line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot-message typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        typingIndicator.id = 'typingIndicator';
        
        if (chatMessages) {
            chatMessages.appendChild(typingIndicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Get response from OpenAI API via your backend
    async function getAIResponse(message) {
        try {
            // Get skills assessment data if available
            let skillsContext = '';
            const skillsData = sessionStorage.getItem('skillsAssessment');
            
            if (skillsData) {
                const skills = JSON.parse(skillsData);
                const assessmentResult = processSkillsAssessment(skills);
                
                skillsContext = `The user has completed a skills assessment with the following results:
                - Top skills: ${assessmentResult.topSkills.join(', ')}
                - Strongest category: ${assessmentResult.topCategory}
                - Industry interest: ${assessmentResult.topIndustry || 'None specified'}
                
                Technical skills score: ${assessmentResult.categories.technical.toFixed(1)}/5
                Soft skills score: ${assessmentResult.categories.soft.toFixed(1)}/5
                Industry knowledge score: ${assessmentResult.categories.industry.toFixed(1)}/5`;
            }
            
            // Create the system message for career advice context
            const systemMessage = `You are Smart Career Advisor, an AI-powered virtual career counselor designed to provide personalized guidance. Your goal is to help users navigate their career journeys by analyzing their background, skills, and aspirations. When interacting with users:
            1. Ask for relevant information about their education, work experience, skills, and career interests if not provided
            2. Analyze their profile to identify suitable career paths based on their qualifications and interests
            3. Assess skill gaps for their desired roles and recommend specific resources for upskilling
            4. Provide targeted advice for resume enhancement, interview preparation, and career progression
            5. Share relevant industry insights and job market trends related to their field of interest
            6. Maintain a conversational, supportive tone throughout the interaction
            7. Present information in a structured, easy-to-understand format
            
            ${skillsContext}`;
            
            // Check if user is authenticated or has any authorization
            if (currentUser || hasLoggedInBefore || bypassAuth || tempAccess || isAuthorized) {
                try {
                    console.log("Attempting to get AI response - user has authorization");
                    // If using your backend API
                    const headers = {
                        'Content-Type': 'application/json'
                    };
                    
                    // Add authentication token if user is currently logged in
                    if (currentUser) {
                        headers['Authorization'] = `Bearer ${await currentUser.getIdToken()}`;
                    }
                    
                    const response = await fetch(BACKEND_API_URL, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({
                            messages: [
                                { role: "system", content: systemMessage },
                                ...chatHistory
                            ]
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const botResponse = data.response;
                        
                        // Add to chat history
                        chatHistory.push({ role: 'assistant', content: botResponse });
                        
                        // Save conversation to Firebase if user is logged in
                        if (currentUser) {
                            try {
                                await saveConversation(currentUser.uid, {
                                    messages: chatHistory,
                                    lastMessage: botResponse,
                                    timestamp: new Date().toISOString()
                                });
                            } catch (error) {
                                console.error('Error saving conversation:', error);
                            }
                        }
                        
                        // Remove typing indicator and add bot message
                        removeTypingIndicator();
                        addMessageToChat(botResponse, 'bot');
                    } else {
                        // If API call fails, use fallback response
                        handleAPIError(message);
                    }
                } catch (error) {
                    console.error('Error calling API:', error);
                    handleAPIError(message);
                }
            } else {
                // If not authenticated and never logged in before, use fallback responses
                console.log("User not authorized for AI responses, using fallback");
                handleAPIError(message);
            }
        } catch (error) {
            console.error('Error with AI API:', error);
            handleAPIError(message);
        }
    }
    
    // Handle API errors with fallback responses
    function handleAPIError(message) {
        const lowercaseMessage = message.toLowerCase();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Generate fallback response based on message content
        let response = '';
        
        if (lowercaseMessage.includes('resume') || lowercaseMessage.includes('cv')) {
            response = `Here are some tips to improve your resume:
            
1. Tailor your resume for each job application by matching keywords from the job description
2. Use action verbs and quantify achievements (e.g., "Increased sales by 20%")
3. Keep it concise - usually 1 page for early career, 2 pages maximum for experienced professionals
4. Include a professional summary that highlights your key qualifications
5. Proofread carefully for grammar and spelling errors
            
Would you like specific advice on a particular section of your resume?`;
        } 
        else if (lowercaseMessage.includes('interview')) {
            response = `Here are some interview preparation tips:
            
1. Research the company thoroughly - understand their products, culture, and recent news
2. Prepare stories using the STAR method (Situation, Task, Action, Result) for behavioral questions
3. Practice common questions for your industry and role
4. Prepare thoughtful questions to ask the interviewer
5. Do mock interviews to practice your responses and body language
            
Would you like advice for a specific type of interview question?`;
        }
        else if (lowercaseMessage.includes('career change') || lowercaseMessage.includes('switch career')) {
            response = `When considering a career change, consider these steps:
            
1. Identify your transferable skills that can apply to the new field
2. Research the new industry to understand requirements and growth potential
3. Consider education or certification needs and options
4. Build a network in the new industry through informational interviews
5. Adjust your resume to highlight relevant experience for the new career path
            
What specific field are you considering moving into?`;
        }
        else {
            response = `I'm your AI Career Advisor, and I can help with:
            
1. Career path guidance and exploration
2. Resume and cover letter optimization
3. Interview preparation and techniques
4. Skill development recommendations
5. Job search strategies
            
What specific aspect of your career journey can I assist with today?`;
        }
        
        addMessageToChat(response, 'bot');
    }
    
    // Add event listener to connect with the main page
    const connectWithMainPage = () => {
        // Add a link to the AI advisor in the main page if needed
        const mainPageAdvisorLink = document.querySelector('.navbar a[href="ai-advisor.html"]');
        if (mainPageAdvisorLink) {
            mainPageAdvisorLink.classList.add('active');
        }
    };
    
    // Initialize
    connectWithMainPage();

    // Add event listeners for login and signup buttons
    if (loginButton) {
        loginButton.addEventListener("click", () => {
            window.location.href = "login.html?redirect=ai-advisor.html";
        });
    }

    if (signupButton) {
        signupButton.addEventListener("click", () => {
            window.location.href = "signup.html?redirect=ai-advisor.html";
        });
    }
}); 