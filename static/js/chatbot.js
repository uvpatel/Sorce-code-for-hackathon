document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const suggestionChips = document.querySelectorAll('.chip');
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        });
    }
    
    // Event listeners
    sendButton.addEventListener('click', handleUserMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });
    
    // Suggestion chip event listeners
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const query = this.getAttribute('data-query');
            userInput.value = query;
            handleUserMessage();
        });
        // Add keyboard support for accessibility
        chip.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const query = this.getAttribute('data-query');
                userInput.value = query;
                handleUserMessage();
            }
        });
    });
    
    // Handle user message submission
    function handleUserMessage() {
        const message = userInput.value.trim();
        
        if (message) {
            // Add user message to chat
            addMessageToChat(message, 'user');
            
            // Clear input
            userInput.value = '';
            
            // Show typing indicator
            showTypingIndicator();
            
            // Get response from Flask backend
            getBackendResponse(message);
        }
    }
    
    // Add message to chat
    function addMessageToChat(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.innerHTML = `<p>${formatMessage(message)}</p>`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Format message with HTML support
    function formatMessage(text) {
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
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Get response from Flask backend
    async function getBackendResponse(message) {
        try {
            // Show typing indicator
            showTypingIndicator();

            // Send request to Flask backend
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove typing indicator
            removeTypingIndicator();

            if (data.success) {
                addMessageToChat(data.response, 'bot');
            } else {
                addMessageToChat(`Error: ${data.error}`, 'bot');
            }
        } catch (error) {
            console.error('Error with chat request:', error);
            removeTypingIndicator();
            addMessageToChat('Sorry, something went wrong. Please try again.', 'bot');
        }
    }
    
    // Add event listener to connect with the main page
    const connectWithMainPage = () => {
        const mainPageAdvisorLink = document.querySelector('.navbar a[href="chatbot.html"]');
        if (mainPageAdvisorLink) {
            mainPageAdvisorLink.classList.add('active');
        }
    };
    
    // Initialize
    connectWithMainPage();
});