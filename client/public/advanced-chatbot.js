class WWWWWAIChatbot {
    constructor(config = {}) {
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.quickReplies = [];
        
        // Firebase Configuration - Customizable for any business
        this.firebaseConfig = config?.firebaseConfig || {
            apiKey: "AIzaSyBqXXwSIuWvEbZpiKQNi7oZPuMXCXJ7vvo",
            authDomain: "chatbot-d3c00.firebaseapp.com",
            projectId: "chatbot-d3c00",
            storageBucket: "chatbot-d3c00.firebasestorage.app",
            messagingSenderId: "249683980392",
            appId: "1:249683980392:web:b4ff8908c64e59f65d4bdd"
        };
        
        this.conversation = [];
        this.leadData = {
            name: '',
            email: '',
            phone: '',
            location: '',
            service: '',
            message: '',
            specificRequests: '',
            contextSummary: '',
            conversationFlow: [],
            topicResponses: {},
            timestamp: new Date().toISOString()
        };
        this.currentTopicIndex = 0;
        this.conversationComplete = false;
        
        // WWWWW.AI Universal Business Context - Customizable for any service
        this.businessInfo = {
            name: config?.businessName || 'Your Business',
            location: config?.location || 'Your Location',
            services: config?.services || 'Professional Services',
            experience: config?.experience || 'Experienced professionals',
            specialties: config?.specialties || 'Quality service, competitive pricing',
            serviceAreas: config?.serviceAreas || 'Local area',
            industry: config?.industry || 'service',
            phone: config?.phone || '',
            email: config?.email || '',
            website: config?.website || ''
        };
        
        // Topic definitions for 5 W's conversation flow
        this.topics = [
            { 
                id: 'WHY', 
                title: 'Purpose',
                question: config?.whyQuestion || 'What brings you here today?', 
                info: config?.whyInfo || `We're here to help you with ${this.businessInfo.services}.`,
                done: false,
                responses: []
            },
            { 
                id: 'WHAT', 
                title: 'Service Needed',
                question: config?.whatQuestion || 'What specific service are you looking for?', 
                info: config?.whatInfo || `We offer ${this.businessInfo.services}.`,
                done: false,
                responses: []
            },
            { 
                id: 'WHEN', 
                title: 'Timing',
                question: config?.whenQuestion || 'When do you need this service?', 
                info: config?.whenInfo || 'We offer flexible scheduling to meet your needs.',
                done: false,
                responses: []
            },
            { 
                id: 'WHERE', 
                title: 'Location',
                question: config?.whereQuestion || 'What area are you located in?', 
                info: config?.whereInfo || `We serve ${this.businessInfo.serviceAreas}.`,
                done: false,
                responses: []
            },
            { 
                id: 'WHO', 
                title: 'Contact',
                question: config?.whoQuestion || 'How should we contact you?', 
                info: config?.whoInfo || 'We can reach out via phone, email, or text.',
                done: false,
                responses: []
            }
        ];
        
        // Gemini AI Configuration
        this.GEMINI_API_KEY = config?.geminiApiKey || '';
        this.GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.GEMINI_API_KEY}`;
        
        // Enhanced conversation settings
        this.conversationSettings = {
            allowMultipleFollowUps: true,
            flexibleTopicTransition: true,
            contextualResponses: true,
            naturalConversationFlow: true
        };
        
        // Initialize Firebase
        this.firebaseDB = window.firebaseDB || null;
        this.initializeFirebase();
        this.initializeIntegrations();
        
        // Conversation state tracking
        this.conversationState = {
            currentFlow: 'initial',
            location: null,
            timing: null,
            contactInfo: {
                phone: null,
                email: null,
                preferred: null
            },
            serviceNeeded: null,
            purpose: null,
            conversationHistory: [],
            sessionId: this.generateSessionId(),
            timestamp: new Date().toISOString()
        };
        
        // Topic flow state management
        this.waitingForQuestionResponse = false;
        this.waitingForTopicInfo = false;
        this.answeringTopicQuestion = false;
        this.conversationStarted = false;
        
        // Add input rate limiting
        this.isProcessing = false;
        this.lastMessageTime = 0;
        this.messageDebounceMs = 1000;
        
        // Business context for Gemini
        this.businessContext = `
        You are a chatbot for ${this.businessInfo.name}, a ${this.businessInfo.industry} company in ${this.businessInfo.location} with ${this.businessInfo.experience} experience.
        
        WEBSITE DATABASE: ${this.businessInfo.website}
        You can reference information from their website including services, pricing, coverage areas, and company details.
        
        BUSINESS INFO:
        - Services: ${this.businessInfo.services}
        - Values: ${this.businessInfo.specialties}
        - Coverage: ${this.businessInfo.serviceAreas}
        - Experience: ${this.businessInfo.experience}
        
        CONVERSATION STRUCTURE - Follow this structured approach for the 5 W's (starting with WHY):
        1. WHY - Purpose/reason for inquiry
        2. WHAT - Service needed
        3. WHEN - Timing (service timeline)  
        4. WHERE - Location (which area)
        5. WHO - Contact preferences
        
        RESPONSE STYLE:
        - Keep responses SHORT and CONCISE (2-3 sentences max)
        - Be direct and helpful
        - Don't over-explain
        - Focus on key information only
        
        RULES:
        - Always explain why you're here initially: "I'm an interactive way to get informed about our website and let us know about your queries"
        - GIVE BEFORE TAKING: Always provide helpful information BEFORE asking for user details
        - Ask "Do you have any questions about [topic]?" before requesting their specific info
        - Only ask for information related to the current topic being discussed
        - Complete one topic fully before moving to the next
        - Don't ask multiple questions in one response
        - Only ask for ONE piece of information at a time
        - Guide toward the 5 pillars naturally through conversation
        - Be friendly, helpful, and professional
        - Keep responses under 50 words maximum
        `;
        
        // Website content cache for faster responses
        this.websiteContent = {
            services: config?.servicesList || [
                'Professional Service 1',
                'Professional Service 2', 
                'Consultation Services',
                'Maintenance Services',
                'Installation Services',
                'Repair Services',
                'Custom Solutions'
            ],
            areas: config?.serviceAreas?.split(', ') || [this.businessInfo.serviceAreas],
            specialties: config?.specialtiesList || [this.businessInfo.specialties],
            pricing: config?.pricing || 'Competitive prices with personalized estimates',
            experience: this.businessInfo.experience,
            certifications: config?.certifications || 'Licensed and insured professionals',
            values: config?.values || 'Quality service, competitive pricing, customer satisfaction'
        };
        
        // Database configuration
        this.database = this.initializeDatabase();
        
        this.init();
    }
    
    // Generate unique session ID
    generateSessionId() {
        return 'wwwwwai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Initialize local database (localStorage for demo, can be replaced with real DB)
    initializeDatabase() {
        const dbName = 'wwwwwaiLeads';
        if (!localStorage.getItem(dbName)) {
            localStorage.setItem(dbName, JSON.stringify([]));
        }
        return dbName;
    }
    
    // Initialize Firebase connection
    initializeFirebase() {
        try {
            if (window.FirebaseDB) {
                this.firebaseDB = window.FirebaseDB;
                console.log('Firebase connection established');
            } else {
                console.log('Firebase not available, will use fallback storage');
            }
        } catch (error) {
            console.error('Firebase initialization error:', error);
            this.firebaseDB = null;
        }
    }
    
    // Initialize Firebase and Sheets integrations
    initializeIntegrations() {
        try {
            // Initialize Firebase if available
            if (typeof FirebaseDB !== 'undefined') {
                this.firebaseDB = new FirebaseDB();
                console.log('Firebase integration initialized');
            } else {
                console.log('Firebase not available, using localStorage fallback');
            }
            
            // Initialize Sheets integration if available
            if (typeof SheetsIntegration !== 'undefined') {
                this.sheetsIntegration = new SheetsIntegration();
                console.log('Google Sheets integration initialized');
            } else {
                console.log('Google Sheets integration not available');
            }
        } catch (error) {
            console.error('Error initializing integrations:', error);
        }
    }

    // Enhanced database save with Firebase and Sheets sync
    async saveToDatabase() {
        const leadData = {
            sessionId: this.conversationState.sessionId,
            timestamp: this.conversationState.timestamp,
            status: this.hasEnoughInfo() ? 'complete' : 'in_progress',
            location: this.conversationState.location,
            timing: this.conversationState.timing,
            serviceNeeded: this.conversationState.serviceNeeded,
            purpose: this.conversationState.purpose,
            contactInfo: this.conversationState.contactInfo,
            conversationHistory: this.conversationState.conversationHistory
        };

        // Try Firebase first
        if (this.firebaseDB) {
            try {
                await this.firebaseDB.addLead(leadData);
                console.log('Lead saved to Firebase');
                
                // Also sync to Google Sheets if available
                if (this.sheetsIntegration) {
                    await this.sheetsIntegration.sendToSheets(leadData);
                }
            } catch (error) {
                console.error('Firebase save failed, falling back to localStorage:', error);
                this.saveToLocalStorageFallback(leadData);
            }
        } else {
            // Fallback to localStorage
            this.saveToLocalStorageFallback(leadData);
        }
    }

    // Fallback localStorage save method
    saveToLocalStorageFallback(leadData) {
        try {
            const existingLeads = JSON.parse(localStorage.getItem('wwwwwaiLeads') || '[]');
            
            // Update existing lead or add new one
            const existingIndex = existingLeads.findIndex(lead => lead.sessionId === leadData.sessionId);
            if (existingIndex >= 0) {
                existingLeads[existingIndex] = leadData;
            } else {
                existingLeads.push(leadData);
            }
            
            localStorage.setItem('wwwwwaiLeads', JSON.stringify(existingLeads));
            console.log('Lead saved to localStorage');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
    
    init() {
        // Validate DOM elements exist
        if (!this.sendButton) {
            console.error('Send button not found! Check if element with id="sendButton" exists.');
            return;
        }
        if (!this.userInput) {
            console.error('User input not found! Check if element with id="messageInput" exists.');
            return;
        }
        if (!this.chatMessages) {
            console.error('Chat messages container not found! Check if element with id="chatMessages" exists.');
            return;
        }

        this.sendButton.addEventListener('click', () => this.handleSend());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
        
        // Handle quick reply buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-reply')) {
                this.handleUserMessage(e.target.dataset.response);
            }
        });
        
        // Start the conversation automatically
        setTimeout(() => {
            this.startConversation();
        }, 1000);
    }
    
    // Start the conversation with welcome message and first topic
    async startConversation() {
        // Add welcome message
        this.addBotMessage(
            `👋 Hi! I'm here to help you learn about ${this.businessInfo.name} and understand your service needs. ` +
            "I'll ask you a few questions to see how we can help."
        );
        
        this.conversationStarted = true;
        
        // Start with the first topic (WHY) after a brief delay
        setTimeout(() => {
            this.startTopicDiscussion(this.topics[0]);
        }, 2000);
    }
    
    handleSend() {
        // Check if already processing or rate limited
        if (this.isProcessing) {
            return;
        }
        
        const now = Date.now();
        if (now - this.lastMessageTime < this.messageDebounceMs) {
            return;
        }
        
        const message = this.userInput.value.trim();
        if (message) {
            this.handleUserMessage(message);
            this.userInput.value = '';
        }
    }
    
    async handleUserMessage(message) {
        // Prevent multiple simultaneous requests
        if (this.isProcessing) {
            return;
        }
        
        this.isProcessing = true;
        this.lastMessageTime = Date.now();
        
        // Disable send button to prevent spam
        this.sendButton.disabled = true;
        this.sendButton.textContent = 'Sending...';
        
        this.addMessage(message, 'user');
        this.conversationState.conversationHistory.push({role: 'user', content: message});
        this.showTypingIndicator();
        
        try {
            // Check if conversation is complete
            if (this.conversationComplete) {
                await this.handlePostConversationMessage(message);
                return;
            }
            
            // Handle topic-based conversation flow
            await this.handleTopicBasedConversation(message);
            
        } catch (error) {
            console.error('API Error:', error);
            this.hideTypingIndicator();
            this.addMessage(
                "I'm sorry, I'm having trouble processing your message right now. " +
                "Please try again in a moment.",
                'bot'
            );
        } finally {
            // Re-enable send button
            this.isProcessing = false;
            this.sendButton.disabled = false;
            this.sendButton.textContent = 'Send';
        }
    }

    // Handle topic-based conversation flow
    async handleTopicBasedConversation(message) {
        const currentTopic = this.topics[this.currentTopicIndex];
        
        // If no current topic, we've completed all topics
        if (!currentTopic) {
            await this.completeConversationAndSaveLead();
            return;
        }
        
        // Handle different conversation states
        if (this.waitingForQuestionResponse) {
            await this.handleQuestionResponse(message);
        } else if (this.answeringTopicQuestion) {
            await this.handleTopicQuestion(message);
        } else if (this.waitingForTopicInfo) {
            await this.handleTopicInfoResponse(message, currentTopic);
        } else {
            // If we're here and conversation is started but no specific state, 
            // it means the user sent a message while waiting for topic flow
            this.hideTypingIndicator();
            this.addBotMessage("Let me ask you about our services step by step.");
        }
    }

    // Start discussion about a topic
    async startTopicDiscussion(topic) {
        this.hideTypingIndicator();
        
        // Provide information about the topic first
        let topicInfo = '';
        switch(topic.id) {
            case 'WHY':
                topicInfo = `I'm here to help you learn about ${this.businessInfo.name} and connect you with our team for personalized assistance.`;
                break;
            case 'WHAT':
                topicInfo = `Our services include ${this.businessInfo.services} with ${this.businessInfo.specialties}.`;
                break;
            case 'WHEN':
                topicInfo = "We offer flexible scheduling including same-day service, regular maintenance, and emergency support.";
                break;
            case 'WHERE':
                topicInfo = `We serve ${this.businessInfo.location} and surrounding areas with local expertise.`;
                break;
            case 'WHO':
                topicInfo = "We provide personalized attention and can reach you via phone or email based on your preference.";
                break;
        }
        
        this.addBotMessage(topicInfo);
        
        // Ask if they have questions about this topic
        setTimeout(() => {
            this.addBotMessage(
                `Any questions about ${topic.title.toLowerCase()}?`,
                ['No questions', 'Yes, I have a question']
            );
            this.waitingForQuestionResponse = true;
        }, 1500);
    }

    // Handle response to "Any questions about [topic]?"
    async handleQuestionResponse(message) {
        this.waitingForQuestionResponse = false;
        const hasQuestions = message.toLowerCase().includes('yes') || 
                           message.toLowerCase().includes('question') ||
                           !message.toLowerCase().includes('no');
        
        if (hasQuestions) {
            // Let them ask their question
            this.hideTypingIndicator();
            this.addBotMessage("What would you like to know?");
            // Set flag to handle their next message as a question
            this.answeringTopicQuestion = true;
        } else {
            // No questions - move to gathering information
            await this.gatherTopicInformation();
        }
    }

    // Handle user's topic question
    async handleTopicQuestion(message) {
        this.answeringTopicQuestion = false;
        
        // Use Gemini AI to answer the question if available
        if (this.GEMINI_API_KEY) {
            try {
                const response = await this.getGeminiResponse(message);
                this.hideTypingIndicator();
                this.addBotMessage(response);
                
                // Ask if they have more questions
                setTimeout(() => {
                    this.addBotMessage(
                        "Any other questions about this topic?",
                        ['No more questions', 'Another question']
                    );
                    this.waitingForQuestionResponse = true;
                }, 2000);
            } catch (error) {
                console.error('Gemini API error:', error);
                this.hideTypingIndicator();
                this.addBotMessage("I'd be happy to help! Let me connect you with our team for detailed information.");
                await this.gatherTopicInformation();
            }
        } else {
            // Fallback response
            this.hideTypingIndicator();
            this.addBotMessage("Great question! Our team can provide detailed information about that.");
            await this.gatherTopicInformation();
        }
    }

    // Gather user's information for the current topic
    async gatherTopicInformation() {
        const currentTopic = this.topics[this.currentTopicIndex];
        this.hideTypingIndicator();
        
        let question = '';
        switch(currentTopic.id) {
            case 'WHY':
                question = "What brings you here today? What can we help you with?";
                break;
            case 'WHAT':
                question = "What specific service are you interested in?";
                break;
            case 'WHEN':
                question = "When are you looking to have this service done?";
                break;
            case 'WHERE':
                question = `Which area of ${this.businessInfo.location} are you in?`;
                break;
            case 'WHO':
                question = "What's the best way to contact you - phone or email?";
                break;
        }
        
        this.addBotMessage(question);
        this.waitingForTopicInfo = true;
    }

    // Handle user's response to topic information request
    async handleTopicInfoResponse(message, topic) {
        this.waitingForTopicInfo = false;
        
        // Store the information based on topic
        switch(topic.id) {
            case 'WHY':
                this.leadData.purpose = message;
                this.conversationState.purpose = message;
                break;
            case 'WHAT':
                this.leadData.service = message;
                this.conversationState.serviceNeeded = message;
                break;
            case 'WHEN':
                this.leadData.timing = message;
                this.conversationState.timing = message;
                break;
            case 'WHERE':
                this.leadData.location = message;
                this.conversationState.location = message;
                break;
            case 'WHO':
                // Extract contact info
                const emailMatch = message.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
                const phoneMatch = message.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
                
                if (emailMatch) {
                    this.leadData.email = emailMatch[0];
                    this.conversationState.contactInfo.email = emailMatch[0];
                    this.conversationState.contactInfo.preferred = 'email';
                } else if (phoneMatch) {
                    this.leadData.phone = phoneMatch[0];
                    this.conversationState.contactInfo.phone = phoneMatch[0];
                    this.conversationState.contactInfo.preferred = 'phone';
                } else {
                    this.conversationState.contactInfo.preferred = message;
                }
                break;
        }
        
        // Mark topic as complete and move to next
        this.topics[this.currentTopicIndex].done = true;
        this.currentTopicIndex++;
        
        this.hideTypingIndicator();
        this.addBotMessage("Perfect! Let me ask about the next aspect.");
        
        // Check if we have more topics or should complete conversation
        if (this.currentTopicIndex >= this.topics.length) {
            // All topics completed
            setTimeout(() => {
                this.completeConversationAndSaveLead();
            }, 1000);
        } else {
            // Move to next topic
            setTimeout(() => {
                this.startTopicDiscussion(this.topics[this.currentTopicIndex]);
            }, 1000);
        }
    }

    // Complete conversation and save lead
    async completeConversationAndSaveLead() {
        if (this.conversationComplete) return;
        
        this.conversationComplete = true;
        this.hideTypingIndicator();
        
        // Add completion timestamp
        this.leadData.completedAt = new Date().toISOString();
        this.leadData.conversationHistory = this.conversationState.conversationHistory;
        
        try {
            // Save the lead
            await this.saveToDatabase();
            console.log('✅ Lead saved successfully');
            
            // Thank you message
            this.addBotMessage(
                `Perfect! I have all the information I need. One of our ${this.businessInfo.name} experts will be in touch shortly to discuss your needs.`,
                ['Thank you', 'I have another question']
            );
            
        } catch (error) {
            console.error('❌ Error saving lead:', error);
            this.addBotMessage(
                "Thank you for the information! I'm having a small technical issue saving your details, " +
                "but our team will still be able to help you."
            );
        }
    }

    // Handle messages after conversation is complete
    async handlePostConversationMessage(message) {
        this.hideTypingIndicator();
        
        if (message.toLowerCase().includes('question') || message.toLowerCase().includes('help')) {
            // They have another question - get AI response if available
            if (this.GEMINI_API_KEY) {
                try {
                    const response = await this.getGeminiResponse(message);
                    this.addBotMessage(response);
                } catch (error) {
                    this.addBotMessage("I'd be happy to help! Our team can provide detailed information.");
                }
            } else {
                this.addBotMessage("I'd be happy to help! Our team can provide detailed information.");
            }
        } else {
            // Generic thank you response
            this.addBotMessage(
                `Thank you! We look forward to helping you with your ${this.businessInfo.industry} needs. ` +
                "Have a great day!",
                ['Contact us again', 'Visit our website']
            );
        }
    }
    
    async getGeminiResponse(userMessage) {
        const conversationContext = this.buildConversationContext(userMessage);
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: conversationContext
                }]
            }]
        };
        
        const response = await fetch(this.GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
    
    buildConversationContext(userMessage) {
        const stateInfo = `
        CURRENT CONVERSATION STATE:
        - Purpose: ${this.conversationState.purpose || 'Not provided'}
        - Service Needed: ${this.conversationState.serviceNeeded || 'Not provided'}
        - Timing: ${this.conversationState.timing || 'Not provided'}
        - Location: ${this.conversationState.location || 'Not provided'}
        - Contact Info: ${this.conversationState.contactInfo.preferred || 'Not provided'}
        `;
        
        // Limit conversation history to last 10 messages to prevent context overflow
        const maxHistoryLength = 10;
        const recentHistory = this.conversationState.conversationHistory
            .slice(-maxHistoryLength)
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');
        
        return `${this.businessContext}
        
        ${stateInfo}
        
        RECENT CONVERSATION HISTORY (last ${maxHistoryLength} messages):
        ${recentHistory}
        
        CURRENT USER MESSAGE: ${userMessage}
        
        INSTRUCTIONS:
        Provide a SHORT response (under 50 words) that:
        1. Answers the user's question helpfully
        2. Relates to our business services and capabilities
        3. Is friendly and professional
        4. Doesn't ask multiple questions
        
        RESPONSE:`;
    }
    
    // Check if we have enough information
    hasEnoughInfo() {
        return this.conversationState.purpose && 
               this.conversationState.serviceNeeded && 
               (this.conversationState.contactInfo.email || this.conversationState.contactInfo.phone);
    }
    
    // Add message to conversation
    addMessage(text, sender) {
        const message = {
            text,
            sender,
            timestamp: new Date().toISOString()
        };
        
        this.conversation.push(message);
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = text;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(timestamp);
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    // Add bot message with optional quick replies
    addBotMessage(text, quickReplies = []) {
        this.addMessage(text, 'bot');
        
        if (quickReplies.length > 0) {
            const quickReplyContainer = document.createElement('div');
            quickReplyContainer.className = 'quick-replies';
            
            quickReplies.forEach(reply => {
                const button = document.createElement('button');
                button.className = 'quick-reply';
                button.textContent = reply;
                button.dataset.response = reply;
                quickReplyContainer.appendChild(button);
            });
            
            this.chatMessages.appendChild(quickReplyContainer);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }
    
    // Show typing indicator
    showTypingIndicator() {
        const existingIndicator = document.querySelector('.typing-indicator');
        if (existingIndicator) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'message bot-message typing-indicator';
        indicator.innerHTML = '<div class="message-content">Typing...</div>';
        
        this.chatMessages.appendChild(indicator);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
    
    // Hide typing indicator
    hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Auto-initialize if elements exist
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chatMessages') && 
        document.getElementById('messageInput') && 
        document.getElementById('sendButton')) {
        // Get configuration from window object if available
        const config = window.chatbotConfig || {};
        new WWWWWAIChatbot(config);
    }
});