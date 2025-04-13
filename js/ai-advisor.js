import { auth, db } from '../firebase-config.js';
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import hljs from 'highlight.js';

class AIAdvisor {
    constructor() {
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatContainer = document.getElementById('chat-container');
        this.suggestionsContainer = document.getElementById('suggestions-container');
        this.isProcessing = false;
        this.chatHistory = [];
        this.lastMessage = '';
        this.lastCategory = '';

        // Initialize event listeners
        this.sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSubmit();
            }
        });

        // Handle suggestion clicks
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (!this.isProcessing) {
                    this.messageInput.value = chip.textContent;
                    this.handleSubmit(chip.dataset.category);
                }
            });
        });
    }

    async handleSubmit(category = '') {
        if (this.isProcessing) return;

        const message = this.messageInput.value.trim();
        if (!message) return;

        this.lastMessage = message;
        this.lastCategory = category;
        this.isProcessing = true;
        this.updateUIState(true);

        try {
            // 1. Immediate Feedback
            this.addMessage('user', message, false, true);
            this.messageInput.value = '';
            this.showFeedback('Thinking...');

            // 2. Quick Response Setup
            const responsePromise = this.getAIResponse(message, category);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('timeout')), 4000)
            );

            // Show quick suggestion after 2 seconds
            const suggestionTimer = setTimeout(() => {
                if (this.isProcessing) {
                    this.showQuickSuggestion(category, message);
                }
            }, 2000);

            try {
                // 3. Get Full Response
                const response = await Promise.race([responsePromise, timeoutPromise]);
                clearTimeout(suggestionTimer);
                this.removeTemporaryMessages();
                this.addMessage('assistant', response, false, true);
                
                // 4. Save to History
                if (auth.currentUser) {
                    await this.saveChatHistory(auth.currentUser.uid);
                }
            } catch (error) {
                if (error.message === 'timeout') {
                    // Keep the quick suggestion and show retry button
                    this.showRetryOption();
                } else {
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            this.handleError(error);
        } finally {
            this.updateUIState(false);
        }
    }

    updateUIState(isProcessing) {
        this.messageInput.disabled = isProcessing;
        this.sendButton.disabled = isProcessing;
        if (!isProcessing) {
            this.hideTypingIndicator();
            this.hideFeedback();
            this.messageInput.focus();
        }
        this.isProcessing = isProcessing;
    }

    showFeedback(message) {
        const feedback = document.createElement('div');
        feedback.className = 'feedback-message';
        feedback.innerHTML = `
            <div class="feedback-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
                <p>${message}</p>
            </div>
        `;
        this.chatContainer.appendChild(feedback);
        this.scrollToBottom();
    }

    hideFeedback() {
        const feedback = this.chatContainer.querySelector('.feedback-message');
        if (feedback) {
            feedback.remove();
        }
    }

    showQuickSuggestion(category, message) {
        const suggestion = this.getQuickSuggestion(category, message);
        this.addMessage('assistant', suggestion, true, true);
        this.showFeedback('Getting more detailed response...');
    }

    getQuickSuggestion(category, message) {
        const suggestions = {
            career: {
                pattern: /career|job|profession/i,
                response: "Here's a quick tip while I analyze your career question:\n• Research industry trends\n• Update your skills\n• Network with professionals"
            },
            skills: {
                pattern: /skill|learn|improve/i,
                response: "Quick learning tip while I prepare detailed advice:\n• Start with fundamentals\n• Practice regularly\n• Join relevant communities"
            },
            job: {
                pattern: /interview|resume|application/i,
                response: "Quick job search tip while I analyze further:\n• Tailor your resume\n• Research the company\n• Prepare STAR examples"
            },
            default: "Processing your request...\n• Analyzing context\n• Preparing personalized response\n• Finding relevant resources"
        };

        const matchedCategory = category && suggestions[category] ? suggestions[category] :
            Object.values(suggestions).find(s => s.pattern?.test(message)) || suggestions.default;

        return typeof matchedCategory === 'string' ? matchedCategory : matchedCategory.response;
    }

    showRetryOption() {
        const retryButton = document.createElement('button');
        retryButton.className = 'retry-button';
        retryButton.textContent = 'Get Detailed Response';
        retryButton.onclick = () => {
            this.handleSubmit(this.lastCategory);
        };

        const retryContainer = document.createElement('div');
        retryContainer.className = 'retry-container';
        retryContainer.appendChild(retryButton);

        this.chatContainer.appendChild(retryContainer);
        this.scrollToBottom();
    }

    addMessage(role, content, isTemporary = false, animate = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}${animate ? ' animate' : ''}`;
        if (isTemporary) messageDiv.dataset.temporary = 'true';

        const timestamp = new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="message-content ${animate ? 'fade-in' : ''}">
                ${this.formatMessageContent(content)}
                <div class="message-meta">
                    <span class="message-time">${timestamp}</span>
                    ${role === 'assistant' ? '<span class="ai-badge">AI</span>' : ''}
                </div>
            </div>
        `;

        if (animate) {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(20px)';
            requestAnimationFrame(() => {
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
            });
        }

        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();

        if (!isTemporary) {
            this.chatHistory.push({ role, content, timestamp });
        }
    }

    formatMessageContent(content) {
        return content
            .split('\n')
            .map(line => {
                if (line.startsWith('•')) {
                    return `<div class="bullet-point">${line}</div>`;
                } else if (line.match(/^\d+\./)) {
                    return `<div class="numbered-point">${line}</div>`;
                } else if (line.trim()) {
                    return `<div class="text-line">${line}</div>`;
                }
                return '';
            })
            .join('');
    }

    showEnhancedTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator animated';
        indicator.innerHTML = `
            <div class="typing-content">
                <div class="dots">
                    <span></span><span></span><span></span>
                </div>
                <div class="typing-text">AI is thinking</div>
            </div>
            <div class="typing-status"></div>
        `;
        this.chatContainer.appendChild(indicator);
        this.scrollToBottom();
    }

    showProgressIndicator(message) {
        const status = this.chatContainer.querySelector('.typing-status');
        if (status) {
            status.textContent = message;
            status.style.opacity = '1';
        }
    }

    hideProgressIndicator() {
        const status = this.chatContainer.querySelector('.typing-status');
        if (status) {
            status.style.opacity = '0';
        }
    }

    removeTemporaryMessages() {
        const tempMessages = this.chatContainer.querySelectorAll('[data-temporary="true"]');
        tempMessages.forEach(msg => {
            msg.classList.add('fade-out');
            setTimeout(() => msg.remove(), 300);
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    highlightCode(messageDiv) {
        messageDiv.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
    }

    async getAIResponse(message, category = '') {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
            throw new Error('AuthError');
        }

        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message, category })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('AuthError');
            }
            throw new Error('NetworkError');
        }

        const data = await response.json();
        return data.response;
    }

    async getUserContext() {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                return { skills: [], interests: [], experience: [] };
            }

            const response = await fetch('http://localhost:3000/api/user/context', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to get user context');
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting user context:', error);
            return { skills: [], interests: [], experience: [] };
        }
    }

    async saveChatHistory(userId) {
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) return;

            const response = await fetch('http://localhost:3000/api/ai/history', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const { chats } = await response.json();
                this.chatHistory = chats;
            }
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    addSystemMessage(message) {
        const systemMessage = {
            role: 'system',
            content: message,
            timestamp: new Date().toLocaleTimeString()
        };
        this.chatHistory.push(systemMessage);
        this.updateChatUI();
    }

    updateChatUI() {
        this.chatContainer.innerHTML = this.chatHistory
            .map(msg => this.createMessageElement(msg))
            .join('');
        this.scrollToBottom();
    }

    createMessageElement(message) {
        const className = message.role === 'user' ? 'user-message' : 'ai-message';
        return `
            <div class="message ${className}">
                <div class="message-content">
                    ${this.formatMessage(message.content)}
                </div>
                <div class="message-time">${message.timestamp}</div>
            </div>
        `;
    }

    formatMessage(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/•/g, '<span class="bullet">•</span>');
    }

    addQuickResponse(category, message) {
        const quickResponse = this.getQuickResponse(category, message);
        this.addMessage('assistant', quickResponse, true);
    }

    getQuickResponse(category, message) {
        const responses = {
            career: {
                assessment: `Quick Career Assessment:
• Analyzing your current skills and experience
• Identifying potential career paths
• Researching industry requirements
• Preparing detailed recommendations

I'll provide a full analysis shortly. In the meantime, consider:
• Updating your LinkedIn profile
• Researching target companies
• Networking with industry professionals`,

                transition: `Quick Career Transition Tips:
• Identifying transferable skills
• Researching target industry
• Building relevant experience
• Creating transition plan

I'll provide detailed guidance soon. Meanwhile:
• Start learning key skills
• Connect with professionals
• Update your resume`,

                growth: `Quick Career Growth Tips:
• Assessing growth opportunities
• Identifying skill gaps
• Planning development path
• Setting achievable goals

Detailed plan coming up. For now:
• Document your achievements
• Seek mentorship opportunities
• Take on challenging projects`
            },
            skills: {
                technical: `Quick Technical Skills Advice:
• Assessing your current level
• Identifying key technologies
• Planning learning path
• Finding resources

Detailed recommendations coming. Meanwhile:
• Practice coding challenges
• Build portfolio projects
• Join tech communities`,

                soft: `Quick Soft Skills Development:
• Communication skills
• Leadership abilities
• Team collaboration
• Problem-solving

Detailed plan coming up. For now:
• Practice active listening
• Lead small projects
• Give presentations`,

                assessment: `Quick Skills Gap Analysis:
• Reviewing your skillset
• Comparing to job requirements
• Identifying priorities
• Planning development

Full analysis coming. Meanwhile:
• List your current skills
• Research job requirements
• Start online courses`
            },
            job: {
                search: `Quick Job Search Tips:
• Optimizing your resume
• Targeting right companies
• Preparing applications
• Interview preparation

Detailed strategy coming. Meanwhile:
• Set up job alerts
• Update LinkedIn
• Network actively`,

                interview: `Quick Interview Prep:
• Common questions
• STAR method responses
• Technical preparation
• Research companies

Detailed prep guide coming. For now:
• Practice responses
• Research companies
• Prepare questions`,

                resume: `Quick Resume Tips:
• Highlighting achievements
• Using keywords
• Formatting properly
• Tailoring content

Detailed review coming. Meanwhile:
• Update achievements
• Add metrics
• Proofread carefully`
            }
        };

        // Try to match the message to a specific subcategory
        const messageLC = message.toLowerCase();
        let response;

        if (category in responses) {
            const subcategories = responses[category];
            for (const [key, value] of Object.entries(subcategories)) {
                if (messageLC.includes(key)) {
                    response = value;
                    break;
                }
            }
            // If no specific subcategory matches, use the first one
            if (!response) {
                response = Object.values(subcategories)[0];
            }
        }

        return response || this.getFallbackResponse(category, message);
    }

    addErrorMessage(title, message, recoverable) {
        const errorContent = `
⚠️ ${title}
${message}
${recoverable ? '\nTrying again might help.' : ''}`;
        
        this.addMessage('error', errorContent);
    }

    handleError(error) {
        const errorMessages = {
            'AbortError': {
                title: 'Response Timeout',
                message: 'The AI is taking longer than expected. Here\'s a quick response instead.',
                recoverable: true
            },
            'NetworkError': {
                title: 'Connection Error',
                message: 'Please check your internet connection and try again.',
                recoverable: true
            },
            'AuthError': {
                title: 'Authentication Error',
                message: 'Please sign in again to continue.',
                recoverable: false
            },
            'default': {
                title: 'Error',
                message: 'Something went wrong. Please try again.',
                recoverable: true
            }
        };

        const errorType = error.name in errorMessages ? error.name : 'default';
        const errorInfo = errorMessages[errorType];

        this.addErrorMessage(errorInfo.title, errorInfo.message, errorInfo.recoverable);
    }

    // Initialize AI Advisor when the page loads
    static async init() {
        window.aiAdvisor = new AIAdvisor();
    }
}

document.addEventListener('DOMContentLoaded', AIAdvisor.init);
