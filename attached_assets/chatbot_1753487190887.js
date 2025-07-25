class WWWWWAIChatbot {
    constructor(config = {}) {
        // Singleton pattern - prevent multiple instances
        if (WWWWWAIChatbot.instance) {
            console.warn('WWWWWAIChatbot instance already exists. Returning existing instance.');
            return WWWWWAIChatbot.instance;
        }
        WWWWWAIChatbot.instance = this;
        
        // Initialize tabbed chat system
        this.currentActiveTab = 'WHY';
        this.currentTopicIndex = 2; // WHY tab is at index 2 in the topics array
        this.chatMessages = {}; // Will hold references to all chat areas
        this.initializeChatAreas();
        
        // Generate unique user ID for this session
        this.userId = this.generateUserId();
        console.log('Generated user ID:', this.userId);
        
        // Track completed tabs and their data
        this.completedTabs = new Set();
        this.tabData = {}; // Store conversation data for each tab
        
        // Track follow-up questions per tab to limit excessive questioning
        this.tabFollowUpCount = {}; // Track follow-up questions per tab
        this.maxFollowUps = 2; // Maximum follow-up questions before suggesting other topics
        
        this.userInput = document.getElementById('messageInput'); // Fixed: HTML has messageInput, not userInput
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
        
        // WWWWW.AI Universal Business Context - Customizable for any service (Define FIRST)
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
        
        // Topic definitions for tabbed conversation flow - Customizable for any service
        this.topics = [
            { 
                id: 'WHO', 
                title: 'Contact Preferences',
                question: config?.whoQuestion || 'How should we contact you?', 
                info: config?.whoInfo || 'We can reach out via phone, email, or text - whatever works best for you.',
                done: false,
                responses: []
            },
            { 
                id: 'WHAT', 
                title: 'Service Needed',
                question: config?.whatQuestion || 'What service do you need?', 
                info: config?.whatInfo || `We offer ${this.businessInfo.services}.`,
                done: false,
                responses: []
            },
            { 
                id: 'WHY', 
                title: 'Why Choose Us',
                question: config?.whyQuestion || 'Why should you choose us for your needs?', 
                info: config?.whyInfo || `We specialize in ${this.businessInfo.specialties} and provide exceptional service.`,
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
                id: 'WHEN', 
                title: 'Timing',
                question: config?.whenQuestion || 'When do you need service?', 
                info: config?.whenInfo || 'We offer flexible scheduling to meet your needs.',
                done: false,
                responses: []
            }
        ];
        // Gemini AI Configuration - Enhanced with flexible follow-up rules
        this.GEMINI_API_KEY = config?.geminiApiKey || 'AIzaSyDB4_JVNACxlh0fu3a3UWm9XO5kIxvwDfg';
        this.GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`;
        
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
            brandAlignment: false,
            conversationHistory: [],
            sessionId: this.generateSessionId(),
        };
        this.conversationComplete = false;
        
        // Topic flow state management
        this.waitingForQuestionResponse = false;
        this.waitingForTopicInfo = false;
        this.answeringTopicQuestion = false;
        this.conversationStarted = false;
        
        // Enhanced rate limiting system
        this.isProcessing = false;
        this.lastMessageTime = 0;
        this.messageDebounceMs = 1000; // 1 second debounce
        this.activeRequests = new Set(); // Track active API requests
        
        // Rate limiting configuration
        this.rateLimiting = {
            maxRequestsPerMinute: 10, // Gemini API limit is typically 60/min, we use 10 for safety
            maxConcurrentRequests: 2, // Maximum simultaneous requests
            requestQueue: [], // Queue for pending requests
            requestTimes: [], // Track request timestamps
            backoffDelay: 1000, // Initial backoff delay in ms
            maxBackoffDelay: 30000, // Maximum backoff delay (30 seconds)
            retryAttempts: 3 // Maximum retry attempts
        };
        
        // Business context for Gemini
        this.businessContext = `
        You are a chatbot for ${this.businessInfo.name}, a ${this.businessInfo.industry} company in ${this.businessInfo.location} with ${this.businessInfo.experience} experience.
        
        WEBSITE DATABASE: ${this.businessInfo.website}
        You can reference information from their website including services, pricing, coverage areas, and company details.
        
        BUSINESS INFO:
        - Services: ${this.businessInfo.services}
        - Values: ${this.businessInfo.specialties}
        - Coverage: ${this.businessInfo.serviceAreas}
        - Certifications: ${this.businessInfo.certifications}
        - Specialties: ${this.businessInfo.specialties}
        - Experience: ${this.businessInfo.experience}
        
        TAB SYSTEM INSTRUCTIONS:
        You are part of a tabbed chat system with these topics: WHERE (location), WHEN (timing), WHAT (services), WHY (reasons to choose), WHO (contact), and GENERAL.
        
        AI-GENERATED TAB SWITCHING:
        - Analyze user messages to determine the most relevant topic
        - When switching tabs, include "SWITCH_TAB: [TOPIC]" at the start of your response
        - Only switch tabs when the conversation naturally flows to a different topic
        - Examples of when to switch:
          - User mentions location/area → SWITCH_TAB: WHERE
          - User asks about services → SWITCH_TAB: WHAT  
          - User asks about timing/scheduling → SWITCH_TAB: WHEN
          - User asks why choose this business → SWITCH_TAB: WHY
          - User asks for contact info → SWITCH_TAB: WHO
          - General questions → SWITCH_TAB: GENERAL
        
        CONVERSATION FLOW:
        - Allow completely natural conversation flow
        - Don't force any topic progression
        - Users can explore any topic in any order
        - Switch tabs based on relevance to current discussion
        - Provide comprehensive answers for the current topic
        
        RESPONSE STYLE:
        - Be natural and conversational (like a helpful human representative)
        - Keep responses informative but concise (2-4 sentences)
        - Show genuine interest in helping the customer
        - Use a warm, professional tone
        - Avoid robotic or scripted language
        
        TAB-SPECIFIC GUIDANCE:
        - WHERE: Focus on service areas, coverage, location-specific information
        - WHEN: Focus on scheduling, availability, timing options
        - WHAT: Focus on services offered, capabilities, specific offerings
        - WHY: Focus on competitive advantages, expertise, reasons to choose
        - WHO: Focus on contact methods, communication preferences
        - GENERAL: Handle any topic that doesn't fit the above
        
        CONVERSATION GUIDELINES:
        - If this is one of the first interactions, briefly explain that you're an interactive way to help them get informed about our services
        - When someone asks about you or the business, provide helpful information about our services and expertise
        - Focus on being helpful rather than following rigid scripts
        - Ask relevant follow-up questions to better assist them
        - Provide specific information about our capabilities when appropriate
        - Be authentic and personable in your responses
        - Keep responses under 100 words for better engagement
        `;
        
        // Website content cache for faster responses - Customizable for any business
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
    // Generate unique user ID for session tracking
    generateUserId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `user_${timestamp}_${random}`;
    }
    
    // Mark tab as completed and save data to Firebase
    async markTabCompleted(tabId) {
        if (this.completedTabs.has(tabId)) {
            return; // Already completed
        }
        
        console.log(`📋 Marking tab ${tabId} as completed`);
        this.completedTabs.add(tabId);
        
        // Update visual indicator to green checkmark
        const tabStatus = document.querySelector(`[data-topic="${tabId}"] .tab-status`);
        if (tabStatus) {
            tabStatus.classList.remove('active');
            tabStatus.classList.add('completed');
            console.log(`✅ Updated ${tabId} tab to completed status`);
        }
        
        // Save tab data to Firebase
        await this.saveTabDataToFirebase(tabId);
    }
    
    // Save individual tab data to Firebase
    async saveTabDataToFirebase(tabId) {
        if (!this.firebaseDB) {
            console.log('Firebase not available, storing tab data locally');
            return;
        }
        
        try {
            // Get conversation history for this tab
            const tabMessages = this.getTabConversationHistory(tabId);
            const topic = this.topics.find(t => t.id === tabId);
            
            const tabData = {
                userId: this.userId,
                tabId: tabId,
                topicTitle: topic?.title || tabId,
                messages: tabMessages,
                completedAt: new Date().toISOString(),
                businessName: this.businessInfo.name
            };
            
            // Save to Firebase under 'topicData' collection
            if (this.firebaseDB && this.firebaseDB.addDocument) {
                const docRef = await this.firebaseDB.addDocument('topicData', tabData);
                console.log(`💾 Saved ${tabId} tab data to Firebase with ID:`, docRef);
            } else {
                console.log('Firebase not available for tab data saving');
            }
            
        } catch (error) {
            console.error(`Error saving ${tabId} tab data to Firebase:`, error);
        }
    }
    
    // Get conversation history for a specific tab
    getTabConversationHistory(tabId) {
        const chatArea = this.chatMessages[tabId];
        if (!chatArea) return [];
        
        const messages = [];
        const messageElements = chatArea.querySelectorAll('.message');
        
        messageElements.forEach(msgEl => {
            const isUser = msgEl.classList.contains('user-message');
            const content = msgEl.querySelector('.message-content')?.textContent || '';
            const timestamp = msgEl.dataset.timestamp || new Date().toISOString();
            
            messages.push({
                role: isUser ? 'user' : 'assistant',
                content: content,
                timestamp: timestamp
            });
        });
        
        return messages;
    }
    
    // Save comprehensive conversation summary with all tab data
    async saveConversationSummary() {
        if (!this.firebaseDB) {
            console.log('Firebase not available, skipping conversation summary save');
            return;
        }
        
        try {
            const conversationSummary = {
                userId: this.userId,
                sessionId: `session_${this.userId}`,
                businessName: this.businessInfo.name,
                completedTabs: Array.from(this.completedTabs),
                totalTabs: this.topics.length,
                completionRate: (this.completedTabs.size / this.topics.length) * 100,
                conversationStarted: this.conversationStarted,
                conversationCompleted: this.conversationComplete,
                completedAt: new Date().toISOString(),
                tabData: {}
            };
            
            // Collect data from all tabs
            for (const topic of this.topics) {
                const tabMessages = this.getTabConversationHistory(topic.id);
                conversationSummary.tabData[topic.id] = {
                    topicTitle: topic.title,
                    completed: this.completedTabs.has(topic.id),
                    messageCount: tabMessages.length,
                    messages: tabMessages
                };
            }
            
            // Save to Firebase under 'conversationSummaries' collection
            const docRef = await this.firebaseDB.collection('conversationSummaries').add(conversationSummary);
            console.log(`📊 Saved conversation summary to Firebase with ID:`, docRef.id);
            console.log(`📊 Summary: ${this.completedTabs.size}/${this.topics.length} tabs completed (${conversationSummary.completionRate.toFixed(1)}%)`);
            
        } catch (error) {
            console.error('Error saving conversation summary to Firebase:', error);
        }
    }

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

    // Test Firebase connection and data saving
    async testFirebaseConnection() {
        try {
            const testLead = {
                name: 'Test User',
                email: 'test@example.com',
                phone: '1234567890',
                message: 'Testing Firebase connection',
                service: 'Pool Maintenance',
                location: 'Southampton',
                timestamp: new Date().toISOString(),
                test: true  // Mark as test data
            };
            
            console.log('Attempting to save test lead to Firebase...');
            const firebaseDB = new FirebaseDB();
            const docId = await firebaseDB.addLead(testLead);
            
            console.log('✅ Test lead saved successfully with ID:', docId);
            alert('✅ Firebase connection successful! Check console for details.');
            return true;
        } catch (error) {
            console.error('❌ Firebase test failed:', error);
            alert('❌ Firebase connection failed. Check console for details.');
            return false;
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
            contactInfo: this.conversationState.contactInfo,
            brandAlignment: this.conversationState.brandAlignment,
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
            const existingLeads = JSON.parse(localStorage.getItem('hamptonBluePoolsLeads') || '[]');
            
            // Update existing lead or add new one
            const existingIndex = existingLeads.findIndex(lead => lead.sessionId === leadData.sessionId);
            if (existingIndex >= 0) {
                existingLeads[existingIndex] = leadData;
            } else {
                existingLeads.push(leadData);
            }
            
            localStorage.setItem('hamptonBluePoolsLeads', JSON.stringify(existingLeads));
            console.log('Lead saved to localStorage');
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    // Load existing session data
    async loadFromDatabase() {
        if (this.firebaseDB) {
            try {
                const leads = await this.firebaseDB.getLeads();
                const existingLead = leads.find(lead => lead.sessionId === this.conversationState.sessionId);
                if (existingLead) {
                    this.conversationState = { ...this.conversationState, ...existingLead };
                    return existingLead;
                }
            } catch (error) {
                console.error('Error loading from Firebase:', error);
            }
        }
        
        // Fallback to localStorage
        return this.loadFromLocalStorage();
    }

    // Load from localStorage fallback
    loadFromLocalStorage() {
        try {
            const allLeads = JSON.parse(localStorage.getItem('hamptonBluePoolsLeads') || '[]');
            return allLeads.find(lead => lead.sessionId === this.conversationState.sessionId);
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    // Save conversation data to database
    saveConversationData() {
        const leadData = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            location: this.conversationState.location,
            timing: this.conversationState.timing,
            contactInfo: this.conversationState.contactInfo,
            serviceNeeded: this.conversationState.serviceNeeded,
            specificQuery: this.conversationState.specificQuery,
            brandAlignment: this.conversationState.brandAlignment,
            conversationHistory: this.conversationState.conversationHistory,
            currentFlow: this.conversationState.currentFlow,
            status: this.hasEnoughInfo() ? 'complete' : 'in_progress'
        };
        
        // Get existing data
        const existingData = JSON.parse(localStorage.getItem(this.database) || '[]');
        
        // Update or add new record
        const existingIndex = existingData.findIndex(item => item.sessionId === this.sessionId);
        if (existingIndex >= 0) {
            existingData[existingIndex] = leadData;
        } else {
            existingData.push(leadData);
        }
        
        // Save back to localStorage
        localStorage.setItem(this.database, JSON.stringify(existingData));
        
        // Log to console for debugging
        console.log('💾 Saved to database:', leadData);
    }
    
    // Get all leads from database
    getAllLeads() {
        return JSON.parse(localStorage.getItem(this.database) || '[]');
    }
    
    // Get current session data
    getCurrentSession() {
        const allLeads = this.getAllLeads();
        return allLeads.find(lead => lead.sessionId === this.sessionId);
    }
    
    // Website search simulation with more detailed responses
    searchWebsiteContent(query) {
        const lowerQuery = query.toLowerCase();
        let results = [];
        
        if (lowerQuery.includes('service') || lowerQuery.includes('maintenance')) {
            results = [
                'Weekly Pool Maintenance: Regular cleaning, chemical balancing, equipment checks',
                'General Maintenance: As-needed service calls with same-day attention',
                'Seasonal Services: Professional openings and closings'
            ];
        } else if (lowerQuery.includes('seasonal') || lowerQuery.includes('opening') || lowerQuery.includes('closing')) {
            results = [
                'Spring Openings: Complete startup, equipment check, water balancing',
                'Fall Closings: Proper winterization, equipment protection',
                'Winter Services: Pump downs and maintenance as needed'
            ];
        } else if (lowerQuery.includes('eco') || lowerQuery.includes('green') || lowerQuery.includes('salt') || lowerQuery.includes('copper')) {
            results = [
                'Salt Water Systems: Gentler on skin, less chemical maintenance',
                'Copper Ion Systems: Natural sanitization through ionization',
                'EcoSmarte Partnership: Go-green approach with non-chlorine solutions'
            ];
        } else if (lowerQuery.includes('equipment') || lowerQuery.includes('installation') || lowerQuery.includes('heater') || lowerQuery.includes('pump')) {
            results = [
                'ENERGY STAR Certified Installers: Pool pumps and electric heaters',
                'Filter Systems: Professional installation and maintenance',
                'Pool Covers: Equipment installation and service'
            ];
        } else if (lowerQuery.includes('area') || lowerQuery.includes('location') || lowerQuery.includes('serve')) {
            results = [
                `Primary Coverage: ${this.businessInfo.location} and surrounding areas`,
                `Extended Service: ${this.businessInfo.serviceAreas}`,
                `Local Expertise: ${this.businessInfo.experience} with area knowledge`
            ];
        } else if (lowerQuery.includes('price') || lowerQuery.includes('cost') || lowerQuery.includes('estimate')) {
            results = [
                'Competitive Pricing: Personal service at competitive rates',
                'Personalized Estimates: Every pool situation is unique',
                'Value Focus: 25+ years experience with quality service'
            ];
        } else if (lowerQuery.includes('experience') || lowerQuery.includes('years') || lowerQuery.includes('family')) {
            results = [
                `Family-Owned Business: ${this.businessInfo.experience}`,
                '25+ Years Combined Experience: Deep pool and spa industry knowledge',
                'Same-Day Attention: Pride in responsive customer service'
            ];
        } else if (lowerQuery.includes('repair') || lowerQuery.includes('restoration') || lowerQuery.includes('fix')) {
            results = [
                'Pool & Spa Repairs: Comprehensive restoration services',
                'Tile Work: Professional repairs and restorations',
                'Leak Detection: Pressure testing and diving services'
            ];
        } else {
            // Default to key specialties
            results = [
                'Same-Day Service: Quick response to customer calls',
                'Eco-Friendly Focus: Salt water and copper ion systems',
                `Local Expertise: ${this.businessInfo.experience} serving ${this.businessInfo.location}`
            ];
        }
        
        return results.slice(0, 2); // Return top 2 most relevant detailed results
    }
    
    // Initialize chat areas for tabbed system
    initializeChatAreas() {
        const topics = ['WHO', 'WHAT', 'WHY', 'WHERE', 'WHEN'];
        
        topics.forEach(topicId => {
            const chatArea = document.getElementById(`chatMessages-${topicId}`);
            if (chatArea) {
                this.chatMessages[topicId] = chatArea;
            } else {
                console.warn(`Chat area for topic ${topicId} not found`);
            }
        });
        
        // Set default active chat area
        this.activeChatArea = this.chatMessages['WHERE'];
    }
    
    // Switch to a specific chat tab
    switchToTab(topicId) {
        console.log(`=== switchToTab called with: ${topicId} ===`);
        console.trace('Tab switch trace:'); // This will show the call stack
        
        // Mark previous tab as completed if switching away from it
        if (this.currentActiveTab && this.currentActiveTab !== topicId) {
            // Only mark as completed if there are messages in the tab
            const previousTabMessages = this.getTabConversationHistory(this.currentActiveTab);
            if (previousTabMessages.length > 1) { // More than just welcome message
                this.markTabCompleted(this.currentActiveTab);
            }
        }
        
        // Hide all chat areas
        Object.values(this.chatMessages).forEach(chatArea => {
            if (chatArea) {
                chatArea.classList.remove('active');
                chatArea.style.display = 'none';
            }
        });
        
        // Show selected chat area
        if (this.chatMessages[topicId]) {
            this.chatMessages[topicId].classList.add('active');
            this.chatMessages[topicId].style.display = 'flex';
            this.activeChatArea = this.chatMessages[topicId];
            this.currentActiveTab = topicId;
            
            // Reset follow-up counter for new tab
            this.tabFollowUpCount[topicId] = 0;
        }
        
        // Update tab visual states with debugging
        console.log(`Updating tab visuals for: ${topicId}`);
        
        // First, remove active class from all tabs
        const allTabs = document.querySelectorAll('.tab');
        console.log(`Found ${allTabs.length} tabs`);
        
        allTabs.forEach((tab, index) => {
            console.log(`Tab ${index}: data-topic=${tab.dataset.topic}, classes=${tab.className}`);
            tab.classList.remove('active');
        });
        
        // Then add active class to the target tab
        const targetTab = document.querySelector(`[data-topic="${topicId}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
            console.log(`Successfully highlighted tab ${topicId}:`, targetTab.className);
            
            // Force a reflow to ensure the style is applied
            targetTab.offsetHeight;
            
            // Double-check the class was applied
            setTimeout(() => {
                console.log(`Tab ${topicId} classes after timeout:`, targetTab.className);
            }, 100);
        } else {
            console.error(`Could not find tab with data-topic="${topicId}"`);
        }
        
        // Update tab status indicators
        this.updateTabStatusIndicators(topicId);
        
        // Force visual update by triggering reflow
        const activeTab = document.querySelector(`[data-topic="${topicId}"]`);
        if (activeTab) {
            activeTab.offsetHeight; // Force reflow
        }
        
        // Scroll to bottom of newly active chat
        this.scrollToBottom();
    }
    
    // Update tab status indicators (orange dot for active, green check for completed)
    updateTabStatusIndicators(currentTabId) {
        console.log(`=== updateTabStatusIndicators called for tab: ${currentTabId} ===`);
        
        // Remove only active status, preserve completed status
        const allStatuses = document.querySelectorAll('.tab-status');
        console.log(`Found ${allStatuses.length} tab status elements`);
        
        allStatuses.forEach(status => {
            const tabId = status.parentElement?.dataset.topic;
            // Only remove active class, preserve completed status for completed tabs
            if (!this.completedTabs.has(tabId)) {
                status.classList.remove('active', 'completed');
            } else {
                status.classList.remove('active'); // Remove active but keep completed
            }
            console.log(`Updated status for ${tabId}: completed=${this.completedTabs.has(tabId)}`);
        });
        
        // Add active status to current tab
        const currentTabStatus = document.querySelector(`[data-topic="${currentTabId}"] .tab-status`);
        if (currentTabStatus) {
            currentTabStatus.classList.add('active');
            console.log(`✅ Added ACTIVE (orange dot) status to ${currentTabId} tab`);
            
            // Force reflow to ensure CSS animation triggers
            currentTabStatus.offsetHeight;
            
            // Verify the class was applied
            setTimeout(() => {
                console.log(`Verification: ${currentTabId} tab status classes:`, currentTabStatus.className);
            }, 100);
        } else {
            console.error(`❌ Could not find .tab-status for tab: ${currentTabId}`);
            console.log(`Available tabs:`, Array.from(document.querySelectorAll('.tab')).map(t => t.dataset.topic));
        }
        
        // Mark completed tabs with green checkmarks using our completion tracking
        let completedCount = 0;
        this.topics.forEach(topic => {
            if (topic.id !== currentTabId && this.completedTabs.has(topic.id)) {
                const tabStatus = document.querySelector(`[data-topic="${topic.id}"] .tab-status`);
                if (tabStatus && !tabStatus.classList.contains('completed')) {
                    tabStatus.classList.add('completed');
                    completedCount++;
                    console.log(`✅ Marked ${topic.id} tab as COMPLETED (green check)`);
                }
            }
        });
        
        console.log(`📊 Tab status summary: ${currentTabId} active, ${this.completedTabs.size} completed tabs`);
        console.log(`🔄 Completed tabs:`, Array.from(this.completedTabs));
    }
    
    // Check if a tab has enough information to be considered completed
    isTabCompleted(tabId) {
        const topic = this.topics.find(t => t.id === tabId);
        if (!topic || !topic.responses) return false;
        
        // Consider a tab completed if it has at least 2 meaningful exchanges
        const meaningfulResponses = topic.responses.filter(response => 
            response.user && response.user.length > 3 && 
            response.bot && response.bot.length > 10
        );
        
        return meaningfulResponses.length >= 1; // At least 1 meaningful exchange
    }
    
    // Force tab highlighting - ensures the active tab is visually highlighted
    forceTabHighlight(tabId) {
        console.log(`Force highlighting tab: ${tabId}`);
        
        // Remove active class from all tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to target tab
        const targetTab = document.querySelector(`[data-topic="${tabId}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
            console.log(`Force-highlighted tab ${tabId} - classes:`, targetTab.className);
            
            // Trigger reflow
            targetTab.offsetHeight;
            
            // Also update the current active tab tracking
            this.currentActiveTab = tabId;
        } else {
            console.error(`Could not find tab element for ${tabId}`);
        }
    }
    
    // Add message to specific topic chat
    addMessageToTopic(message, sender, topicId = null) {
        const targetTopicId = topicId || this.currentActiveTab;
        const chatArea = this.chatMessages[targetTopicId];
        
        if (!chatArea) {
            console.warn(`Chat area for topic ${targetTopicId} not found`);
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.dataset.timestamp = new Date().toISOString();
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.innerHTML = message;
        
        messageDiv.appendChild(messageContent);
        chatArea.appendChild(messageDiv);
        
        // Add to topic responses for data tracking
        this.addTopicResponse(targetTopicId, message, sender);
        
        // Update tab status indicators after adding message
        this.updateTabStatusIndicators(this.currentActiveTab);
        
        // Scroll to bottom if this is the active tab
        if (targetTopicId === this.currentActiveTab) {
            this.scrollToBottom();
        }
    }
    
    // Scroll to bottom of active chat area
    scrollToBottom() {
        if (this.activeChatArea) {
            setTimeout(() => {
                this.activeChatArea.scrollTop = this.activeChatArea.scrollHeight;
            }, 100);
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
        
        // Validate that we have chat areas initialized
        if (!this.chatMessages || Object.keys(this.chatMessages).length === 0) {
            console.error('Chat areas not initialized! Check if chat message containers exist.');
            return;
        }

        this.sendButton.addEventListener('click', () => this.handleSend());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSend();
        });
        
        // Handle quick reply buttons with topic switching detection
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-reply')) {
                e.preventDefault();
                e.stopPropagation();
                
                const response = e.target.dataset.response;
                console.log('Quick reply clicked:', response);
                console.log('Current active tab before handling:', this.currentActiveTab);
                
                // Check if this is a topic suggestion quick reply
                const targetTab = this.detectTopicFromQuickReply(response);
                if (targetTab && targetTab !== this.currentActiveTab) {
                    console.log(`🔄 Quick reply suggests switching to ${targetTab} tab`);
                    
                    // Mark current tab as completed before switching
                    const currentTabMessages = this.getTabConversationHistory(this.currentActiveTab);
                    if (currentTabMessages.length > 1) {
                        this.markTabCompleted(this.currentActiveTab);
                    }
                    
                    // Switch to the suggested tab
                    this.switchToTab(targetTab);
                    this.updateTabStatusIndicators(targetTab);
                    
                    // Add user message to new tab and start conversation
                    this.addMessage(response, 'user', targetTab);
                    this.startTopicConversation(targetTab);
                } else {
                    // Regular quick reply handling
                    this.handleUserMessage(response);
                }
                
                // Don't call updateTabStatusIndicators here - let handleUserMessage handle it
                // This prevents overriding the correct tab after AI processing
            }
        });
        
        // Initialize tab functionality
        this.initializeTabs();
        
        // Ensure tab status indicators are properly initialized for WHY tab
        setTimeout(() => {
            console.log('🔧 Initializing tab status indicators for WHY tab on startup');
            this.updateTabStatusIndicators('WHY');
        }, 100);
        
        // Start the conversation automatically
        setTimeout(() => {
            this.startConversation();
        }, 1000);
    }

// Update tab status indicators (orange dot for active, green check for completed)
updateTabStatusIndicators(currentTabId) {
    console.log(`=== updateTabStatusIndicators called for tab: ${currentTabId} ===`);

    // Remove all status classes first
    const allStatuses = document.querySelectorAll('.tab-status');
    console.log(`Found ${allStatuses.length} tab status elements`);

    allStatuses.forEach(status => {
        status.classList.remove('active', 'completed');
        console.log(`Cleared status classes for tab status element:`, status.parentElement?.dataset.topic);
    });

    // Add active status to current tab
    const currentTabStatus = document.querySelector(`[data-topic="${currentTabId}"] .tab-status`);
    if (currentTabStatus) {
        currentTabStatus.classList.add('active');
        console.log(`✅ Added ACTIVE (orange dot) status to ${currentTabId} tab`);

        // Force reflow to ensure CSS animation triggers
        currentTabStatus.offsetHeight;

        // Verify the class was applied
        setTimeout(() => {
            console.log(`Verification: ${currentTabId} tab status classes:`, currentTabStatus.className);
        }, 100);
    } else {
        console.error(`❌ Could not find .tab-status for tab: ${currentTabId}`);
        console.log(`Available tabs:`, Array.from(document.querySelectorAll('.tab')).map(t => t.dataset.topic));
    }

    // Mark completed tabs with green checkmarks
    let completedCount = 0;
    this.topics.forEach(topic => {
        if (topic.id !== currentTabId && this.isTabCompleted(topic.id)) {
            const tabStatus = document.querySelector(`[data-topic="${topic.id}"] .tab-status`);
            if (tabStatus) {
                tabStatus.classList.add('completed');
                completedCount++;
                console.log(`✅ Marked ${topic.id} tab as COMPLETED (green check)`);
            }
        }
    });

    console.log(`📊 Tab status summary: ${currentTabId} active, ${completedCount} completed tabs`);

    // Force reflow to ensure all visual updates apply
    const container = document.querySelector('.tabs-container');
    if (container) {
        container.offsetHeight;
    }
}
    // Start the conversation with welcome message in WHY tab
    async startConversation() {
        // Set the correct topic index for WHY tab (index 2 in the topics array)
        this.currentTopicIndex = this.topics.findIndex(t => t.id === 'WHY');
        console.log(`🔧 Setting currentTopicIndex to ${this.currentTopicIndex} for WHY tab`);
        
        // Ensure we're on the WHY tab and update status
        this.switchToTab('WHY');
        
        // Immediately update tab status indicators for WHY tab
        console.log('🔧 Initializing WHY tab status indicators in startConversation');
        this.updateTabStatusIndicators('WHY');
        
        // Add welcome message to WHY tab explaining why the bot is there
        this.addBotMessage(
            `👋 Hi! I'm here to help you discover why ${this.businessInfo.name} is the right choice for your needs. ` +
            `As your interactive assistant, I'm here to showcase our expertise, explain our unique approach, and demonstrate ` +
            `why we stand out from the competition. Let me share what makes us special and how we can help you!`,
            ['Tell me more', 'What makes you different?', 'Why should I choose you?'],
            'WHY'
        );
        
        // Final verification of tab status
        setTimeout(() => {
            this.updateTabStatusIndicators('WHY');
        }, 200);
        
        this.conversationStarted = true;
    }
    
    handleSend() {
        // Check if already processing
        if (this.isProcessing) {
            this.showNotification('Please wait for the current response to complete.', 'warning');
            return;
        }
        
        // Check rate limiting with user feedback
        const now = Date.now();
        if (now - this.lastMessageTime < this.messageDebounceMs) {
            const remainingTime = Math.ceil((this.messageDebounceMs - (now - this.lastMessageTime)) / 1000);
            this.showNotification(`Please wait ${remainingTime} second(s) before sending another message.`, 'info');
            return;
        }
        
        // Check if we can make API requests
        if (!this.canMakeRequest()) {
            const delay = this.calculateDelay();
            if (delay > 0) {
                const delaySeconds = Math.ceil(delay / 1000);
                this.showNotification(`Rate limit reached. Your message will be processed in ${delaySeconds} seconds.`, 'warning');
            } else {
                this.showNotification('Too many requests. Please wait a moment before sending another message.', 'warning');
            }
        }
        
        const message = this.userInput.value.trim();
        if (message) {
            this.lastMessageTime = now;
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
        
        // Fallback tab detection - catch trigger phrases before AI processing
        const lowerMessage = message.toLowerCase();
        let targetTab = null;
        
        if (lowerMessage.includes('tell me where') || lowerMessage.includes('where do you') || 
            lowerMessage.includes('service area') || lowerMessage.includes('location') || 
            lowerMessage.includes('coverage')) {
            targetTab = 'WHERE';
        } else if (lowerMessage.includes('tell me when') || lowerMessage.includes('schedule') || 
                   lowerMessage.includes('timing') || lowerMessage.includes('availability')) {
            targetTab = 'WHEN';
        } else if (lowerMessage.includes('tell me what') || lowerMessage.includes('services') || 
                   lowerMessage.includes('what do you do') || lowerMessage.includes('repairs')) {
            targetTab = 'WHAT';
        } else if (lowerMessage.includes('tell me why') || lowerMessage.includes('why choose') || 
                   lowerMessage.includes('benefits') || lowerMessage.includes('different')) {
            targetTab = 'WHY';
        } else if (lowerMessage.includes('tell me who') || lowerMessage.includes('contact') || 
                   lowerMessage.includes('phone') || lowerMessage.includes('reach you')) {
            targetTab = 'WHO';
        }
        
        // If we detected a tab switch, do it immediately
        if (targetTab && targetTab !== this.currentActiveTab) {
            console.log(`🔄 Fallback detection: switching from ${this.currentActiveTab} to ${targetTab}`);
            
            // Mark current tab as completed before switching
            const currentTabMessages = this.getTabConversationHistory(this.currentActiveTab);
            if (currentTabMessages.length > 1) {
                this.markTabCompleted(this.currentActiveTab);
            }
            
            this.switchToTab(targetTab);
            this.updateTabStatusIndicators(targetTab);
        }
        
        // Add message to current active tab (after potential tab switch)
        this.addMessage(message, 'user', this.currentActiveTab);
        this.conversationState.conversationHistory.push({role: 'user', content: message});
        this.showTypingIndicator(this.currentActiveTab);
        
        try {
            // Check if conversation is complete
            if (this.conversationComplete) {
                await this.handlePostConversationMessage(message);
                return;
            }
            
            // Handle topic-based conversation flow
            await this.handleTopicBasedConversation(message);
            
        } catch (error) {
            console.error('Gemini API Error:', error);
            this.hideTypingIndicator(this.currentActiveTab);
            this.addMessage(
                "I'm sorry, I'm having trouble processing your message right now. " +
                "Please try again in a moment, or feel free to call us directly at (555) 123-4567.",
                'bot',
                this.currentActiveTab
            );
        } finally {
            // Re-enable send button
            this.isProcessing = false;
            this.sendButton.disabled = false;
            this.sendButton.textContent = 'Send';
            
            // Tab status indicators are already updated by processGeminiResponse
            // Don't call updateTabStatusIndicators here to avoid overriding correct tab
        }
    }

    // Handle AI-powered conversation flow with intelligent tab switching
    async handleTopicBasedConversation(message) {
        // Check for user disengagement before getting AI response
        const disengagementCheck = this.detectDisengagementAndSuggestTopics(message, this.currentActiveTab);
        
        if (disengagementCheck.shouldSuggestTopics) {
            // User is disengaged, suggest other topics instead of continuing current topic
            this.hideTypingIndicator(this.currentActiveTab);
            this.addBotMessage(
                disengagementCheck.suggestion,
                disengagementCheck.quickReplies,
                this.currentActiveTab
            );
            return;
        }
        
        // Get AI-powered response with intelligent tab switching
        const aiResponse = await this.getGeminiResponseForTab(message, this.currentActiveTab);
        this.hideTypingIndicator(this.currentActiveTab);
        
        // The response is already processed and added to the appropriate tab by getGeminiResponseForTab
        // Update the current active tab if it was switched
        if (aiResponse.tabSwitched) {
            this.currentActiveTab = aiResponse.targetTab;
        }
        
        // Mark the topic as having activity and save conversation data
        const targetTopic = this.topics.find(t => t.id === aiResponse.targetTab);
        if (targetTopic) {
            if (!targetTopic.responses) targetTopic.responses = [];
            
            // Add user message to the target topic
            targetTopic.responses.push({
                message: message,
                sender: 'user',
                timestamp: new Date()
            });
            
            // Add bot response to the target topic
            if (aiResponse.response) {
                targetTopic.responses.push({
                    message: aiResponse.response,
                    sender: 'bot',
                    timestamp: new Date()
                });
            }
        }
        
        // Update tab states and save lead data
        this.updateTabStates();
        this.updateTopicDataToFirebase();
    }

    // Start discussion about a topic
    async startTopicDiscussion(topic) {
        this.hideTypingIndicator();
        
        // Provide information about the topic first
        let topicInfo = '';
        switch(topic.id) {
            case 'WHERE':
                topicInfo = `We serve all areas of ${this.businessInfo.location} and surrounding areas with same-day service.`;
                break;
            case 'WHEN':
                topicInfo = "We offer flexible scheduling including same-day service, weekly maintenance, seasonal openings/closings, and emergency repairs.";
                break;
            case 'WHAT':
                topicInfo = "Our services include pool/spa maintenance, equipment installation, repairs, eco-friendly systems, and seasonal services.";
                break;
            case 'WHY':
                topicInfo = "We specialize in eco-friendly solutions, ENERGY STAR certified equipment, and competitive pricing with 25+ years of local expertise.";
                break;
            case 'WHO':
                topicInfo = "We provide same-day attention to all customer calls and can reach you via phone or email based on your preference.";
                break;
        }
        
        this.addBotMessage(topicInfo);
        
        // Ask if they have questions about this topic
        setTimeout(() => {
            this.addBotMessage(
                `Any questions about ${topic.id.toLowerCase()}?`,
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
            // No questions - end conversation and save lead immediately
            this.hideTypingIndicator();
            this.addBotMessage("Perfect! I have enough information to help you.");
            
            // End conversation and save lead
            setTimeout(() => {
                this.completeConversationAndSaveLead();
            }, 1000);
        }
    }

    // Gather user's information for the current topic
    async gatherTopicInformation() {
        const currentTopic = this.topics[this.currentTopicIndex];
        this.hideTypingIndicator();
        
        let question = '';
        switch(currentTopic.id) {
            case 'WHERE':
                question = `Which area of ${this.businessInfo.location} are you in?`;
                break;
            case 'WHEN':
                question = "When are you looking to have this service done?";
                break;
            case 'WHAT':
                question = "What service are you interested in?";
                break;
            case 'WHY':
                question = "Could you tell me more about what you need help with?";
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
            case 'WHERE':
                this.leadData.location = message;
                this.conversationState.location = message;
                break;
            case 'WHEN':
                this.leadData.timing = message;
                this.conversationState.timing = message;
                break;
            case 'WHAT':
                this.leadData.service = message;
                this.conversationState.serviceNeeded = message;
                break;
            case 'WHY':
                this.leadData.message = message;
                this.conversationState.specificQuery = message;
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
        this.addBotMessage("Great! Let's move on.");
        
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
        
        // Mark current tab as completed before ending conversation
        if (this.currentActiveTab) {
            const currentTabMessages = this.getTabConversationHistory(this.currentActiveTab);
            if (currentTabMessages.length > 1) {
                await this.markTabCompleted(this.currentActiveTab);
            }
        }
        
        // Add completion timestamp
        this.leadData.completedAt = new Date().toISOString();
        this.leadData.conversationHistory = this.conversationState.conversationHistory;
        
        try {
            // Save comprehensive conversation summary to Firebase
            await this.saveConversationSummary();
            
            // Save the lead
            const leadId = await this.saveLead();
            console.log('✅ Lead saved with ID:', leadId);
            
            // Thank you message
            this.addBotMessage(
                `Perfect! I have all the information I need. One of our ${this.businessInfo.name} experts will be in touch shortly to discuss your needs.`,
                ['Thank you', 'I have another question']
            );
            
        } catch (error) {
            console.error('❌ Error saving lead:', error);
            this.addBotMessage(
                "Thank you for the information! I'm having a small technical issue saving your details, " +
                "but please call us directly at (555) 123-4567 and we'll take care of everything."
            );
        }
    }

    // Handle messages after conversation is complete
    async handlePostConversationMessage(message) {
        this.hideTypingIndicator();
        
        if (message.toLowerCase().includes('question') || message.toLowerCase().includes('help')) {
            // They have another question - get AI response
            const response = await this.getGeminiResponse(message);
            this.processGeminiResponse(response, message);
        } else {
            // Generic thank you response
            this.addBotMessage(
                "Thank you! We look forward to helping you with your pool and spa needs. " +
                "Have a great day!",
                ['Contact us again', 'Visit our website']
            );
        }
    }
    
    async getGeminiResponse(userMessage) {
        const requestId = `general-${userMessage.substring(0, 50)}-${Date.now()}`;
        
        // Check if we can make the request immediately
        if (!this.canMakeRequest()) {
            console.log('Rate limit reached, queueing general request:', requestId);
            
            // Queue the request for later execution
            const requestFunction = () => this.executeGeneralGeminiRequest(userMessage, requestId);
            return await this.queueRequest(requestFunction, requestId);
        }
        
        // Execute request immediately with retry logic
        const requestFunction = () => this.executeGeneralGeminiRequest(userMessage, requestId);
        return await this.makeApiRequestWithRetry(requestFunction, requestId);
    }
    
    // Execute the general Gemini API request
    async executeGeneralGeminiRequest(userMessage, requestId) {
        this.activeRequests.add(requestId);
        
        try {
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
                if (response.status === 429) {
                    throw new Error(`429 Too Many Requests`);
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.activeRequests.delete(requestId);
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            this.activeRequests.delete(requestId);
            
            // For rate limit errors, throw to trigger retry logic
            if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                throw error;
            }
            
            // For other errors, return a generic fallback
            throw error;
        }
    }
    
    // Process Gemini response to handle AI-driven tab switching
    // OLD METHOD REMOVED: processGeminiResponse
    // This method has been replaced with AI-powered response processing
    // New approach uses:
    // 1. analyzeTabSwitchingNeed() - AI analyzes if tab switching is needed
    // 2. processAIResponse() - Processes responses naturally without hard-coded rules
    // 3. buildAIConversationContext() - Creates intelligent context for conversations

    // Enforce single question rule to prevent LLM drift
    enforceSingleQuestion(response) {
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const questions = sentences.filter(s => s.trim().endsWith('?'));
        
        if (questions.length > 1) {
            // Keep only the first question
            const firstQuestion = questions[0];
            const questionIndex = response.indexOf(firstQuestion);
            return response.substring(0, questionIndex + firstQuestion.length + 1).trim();
        }
        
        return response;
    }

    // Generate contextual questions when AI response is minimal
    generateContextualQuestion(fromTab, toTab, userMessage) {
        const transitions = {
            'WHERE': {
                'WHAT': 'Now that we know your location, what specific service do you need?',
                'WHEN': 'Great! Now when would you like to schedule service?',
                'WHY': 'Perfect! Let me explain why we\'re the best choice for your area.',
                'WHO': 'Excellent! Now let\'s get your contact information so we can reach out.'
            },
            'WHAT': {
                'WHERE': 'That sounds like a great service! What area are you located in?',
                'WHEN': 'Perfect choice! When would you like to schedule this service?',
                'WHY': 'Great service selection! Let me share why we\'re the best for this.',
                'WHO': 'Excellent! Now let\'s get your contact details to discuss this further.'
            },
            'WHEN': {
                'WHERE': 'That timing works! What area are you located in?',
                'WHAT': 'Perfect timing! What specific service do you need?',
                'WHY': 'Great timing choice! Let me explain why we\'re your best option.',
                'WHO': 'Perfect timing! Now let\'s get your contact information.'
            },
            'WHY': {
                'WHERE': 'I\'m excited to share our advantages! What area are you in?',
                'WHAT': 'Let me tell you why we\'re the best! What service interests you?',
                'WHEN': 'Here\'s why we\'re the top choice! When would you like service?',
                'WHO': 'Let me share why we\'re special! How should we contact you?'
            },
            'WHO': {
                'WHERE': 'Perfect! Now what area are you located in?',
                'WHAT': 'Great! What specific service do you need?',
                'WHEN': 'Excellent! When would you like to schedule service?',
                'WHY': 'Perfect! Let me explain why we\'re the right choice for you.'
            }
        };

        const defaultQuestions = {
            'WHERE': 'What area are you located in?',
            'WHEN': 'When would you like to schedule service?',
            'WHAT': 'What specific service are you looking for?',
            'WHY': 'What would you like to know about why you should choose us?',
            'WHO': 'How would you prefer we contact you?'
        };

        if (transitions[fromTab] && transitions[fromTab][toTab]) {
            return transitions[fromTab][toTab];
        }
        
        return defaultQuestions[toTab] || 'How can I help you with this topic?';
    }

    // Get AI response tailored for specific topic tab with comprehensive rate limiting
    // AI-powered tab switching analysis using Gemini
    async analyzeTabSwitchingNeed(userMessage, currentTab) {
        try {
            const analysisPrompt = `
You are an intelligent conversation router for ${this.businessInfo.name}.

CURRENT TAB: ${currentTab}
USER MESSAGE: "${userMessage}"

AVAILABLE TABS:
- WHERE: Location, service areas, coverage questions
- WHEN: Scheduling, timing, availability questions  
- WHAT: Services offered, repairs, equipment, capabilities
- WHY: Why choose us, benefits, specialties, competitive advantages
- WHO: Contact information, phone numbers, communication preferences

ANALYZE the user's message and determine:
1. Does this message fit the current tab topic?
2. Would a different tab be more appropriate?
3. What is the user's primary intent?

RESPOND with ONLY a JSON object in this exact format:
{
  "shouldSwitch": true/false,
  "recommendedTab": "WHERE/WHEN/WHAT/WHY/WHO",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this tab is best"
}

EXAMPLES:
- "What services do you offer?" → {"shouldSwitch": true, "recommendedTab": "WHAT", "confidence": 0.9, "reasoning": "User asking about services"}
- "When can you come out?" → {"shouldSwitch": true, "recommendedTab": "WHEN", "confidence": 0.95, "reasoning": "User asking about scheduling"}
- "Do you serve my area?" → {"shouldSwitch": true, "recommendedTab": "WHERE", "confidence": 0.9, "reasoning": "User asking about location coverage"}
- "Why should I choose you?" → {"shouldSwitch": true, "recommendedTab": "WHY", "confidence": 0.9, "reasoning": "User asking about competitive advantages"}
- "How can I contact you?" → {"shouldSwitch": true, "recommendedTab": "WHO", "confidence": 0.9, "reasoning": "User asking for contact information"}

Respond with ONLY the JSON object, no other text.`;

            const requestBody = {
                contents: [{
                    parts: [{
                        text: analysisPrompt
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
            const analysisText = data.candidates[0].content.parts[0].text.trim();
            
            // Parse the JSON response
            try {
                // Clean the response text by removing markdown code blocks
                let cleanAnalysisText = analysisText.trim();
                if (cleanAnalysisText.startsWith('```json')) {
                    cleanAnalysisText = cleanAnalysisText.replace(/```json\s*/, '').replace(/\s*```$/, '');
                }
                if (cleanAnalysisText.startsWith('```')) {
                    cleanAnalysisText = cleanAnalysisText.replace(/```\s*/, '').replace(/\s*```$/, '');
                }
                
                const analysis = JSON.parse(cleanAnalysisText);
                console.log('Tab switching analysis:', analysis);
                return {
                    shouldSwitch: analysis.shouldSwitch && analysis.recommendedTab !== currentTab,
                    recommendedTab: analysis.recommendedTab || currentTab,
                    confidence: analysis.confidence || 0.5,
                    reasoning: analysis.reasoning || 'AI analysis'
                };
            } catch (parseError) {
                console.error('Failed to parse tab analysis JSON:', analysisText);
                return {
                    shouldSwitch: false,
                    recommendedTab: currentTab,
                    confidence: 0.0,
                    reasoning: 'Parse error'
                };
            }

        } catch (error) {
            console.error('Tab switching analysis error:', error);
            return {
                shouldSwitch: false,
                recommendedTab: currentTab,
                confidence: 0.0,
                reasoning: 'Analysis failed'
            };
        }
    }

    async getGeminiResponseForTab(userMessage, topicId) {
        try {
            // Check if we can make a request
            if (!this.canMakeRequest()) {
                const delay = this.calculateDelay();
                this.showNotification(`Please wait ${Math.ceil(delay/1000)} seconds before sending another message.`, 'info');
                return {
                    response: this.getFallbackResponse(userMessage, topicId),
                    tabSwitched: false,
                    targetTab: topicId
                };
            }

            // Track this request
            this.trackRequest();
            
            // First, analyze if we need to switch tabs using AI
            console.log(`Analyzing tab switching need for message: "${userMessage}" in tab: ${topicId}`);
            const tabAnalysis = await this.analyzeTabSwitchingNeed(userMessage, topicId);
            
            // Determine the best tab for this conversation
            const targetTab = tabAnalysis.shouldSwitch ? tabAnalysis.recommendedTab : topicId;
            
            if (tabAnalysis.shouldSwitch) {
                console.log(`AI recommends switching from ${topicId} to ${targetTab} (confidence: ${tabAnalysis.confidence}): ${tabAnalysis.reasoning}`);
                // Switch the UI tab
                this.switchToTab(targetTab);
            }
            
            // Build conversation context for the target tab
            const context = this.buildAIConversationContext(userMessage, targetTab);
            
            // Make API request with retry logic
            const response = await this.executeAIRequest(context, userMessage, targetTab);
            
            if (response) {
                // Process the response naturally without hard-coded switching
                return this.processAIResponse(response, userMessage, topicId, targetTab, tabAnalysis);
            } else {
                return { 
                    response: this.getFallbackResponse(userMessage, targetTab), 
                    tabSwitched: tabAnalysis.shouldSwitch, 
                    targetTab: targetTab 
                };
            }
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            return { 
                response: this.getFallbackResponse(userMessage, topicId), 
                tabSwitched: false, 
                targetTab: topicId 
            };
        }
    }
    
    // Build AI-powered conversation context without hard-coded rules
    buildAIConversationContext(userMessage, topicId) {
        const recentMessages = this.getRecentConversationHistory(topicId, 8);
        const otherTabsContext = this.getOtherTabsContext();
        
        return `You are an intelligent assistant for ${this.businessInfo.name}, ${this.businessInfo.experience} serving ${this.businessInfo.location}.

BUSINESS INFORMATION:
- Services: ${this.businessInfo.services}
- Specialties: ${this.businessInfo.specialties}
- Service Areas: ${this.businessInfo.serviceAreas}
- Industry: ${this.businessInfo.industry}
${this.businessInfo.phone ? `- Phone: ${this.businessInfo.phone}` : ''}
${this.businessInfo.email ? `- Email: ${this.businessInfo.email}` : ''}

CURRENT CONVERSATION TOPIC: ${topicId}
- WHERE: Location, service areas, coverage questions
- WHEN: Scheduling, timing, availability questions  
- WHAT: Services offered, repairs, equipment, capabilities
- WHY: Why choose us, benefits, specialties, competitive advantages
- WHO: Contact information, phone numbers, communication preferences

CONVERSATION HISTORY FOR ${topicId}:
${recentMessages}

OTHER TOPICS DISCUSSED:
${otherTabsContext}

USER'S CURRENT MESSAGE: "${userMessage}"

INSTRUCTIONS:
1. Provide a natural, helpful response focused on the ${topicId} topic
2. Use the business information to give specific, relevant answers
3. Be conversational and engaging, not robotic
4. Ask follow-up questions to better understand their needs
5. Reference previous conversation context when relevant
6. Keep responses concise but informative (2-3 sentences max)
7. Include quick reply options when appropriate using format: QUICK_REPLIES: Option1|Option2|Option3
8. Stay focused on ${topicId} topic but be natural and helpful

Respond as a knowledgeable, friendly representative of ${this.businessInfo.name}.`;
    }
    
    // Execute AI request with proper error handling
    async executeAIRequest(context, userMessage, topicId) {
        const requestId = `${topicId}-${userMessage.substring(0, 30)}-${Date.now()}`;
        
        try {
            console.log(`Making AI request for topic: ${topicId}`);
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: context
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
                const errorText = await response.text();
                console.error('AI API Error Response:', errorText);
                
                if (response.status === 429) {
                    throw new Error(`429 Too Many Requests: ${errorText}`);
                }
                
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('AI Response received successfully');
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('Invalid AI response structure:', data);
                throw new Error('Invalid response structure from AI API');
            }
            
            return data.candidates[0].content.parts[0].text;
            
        } catch (error) {
            console.error('AI Request Error:', error);
            
            // For rate limit errors, throw to trigger retry logic
            if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                throw error;
            }
            
            return null;
        }
    }
    
    // Process AI response naturally without hard-coded switching
    processAIResponse(response, userMessage, originalTab, targetTab, tabAnalysis) {
        let cleanResponse = response.trim();
        
        // Extract quick replies if present
        let quickReplies = [];
        if (cleanResponse.includes('QUICK_REPLIES:')) {
            const parts = cleanResponse.split('QUICK_REPLIES:');
            cleanResponse = parts[0].trim();
            if (parts[1]) {
                quickReplies = parts[1].trim().split('|').map(reply => reply.trim()).filter(reply => reply.length > 0);
            }
        }
        
        // Clean up the response
        cleanResponse = this.cleanAIResponse(cleanResponse);
        
        // If response is empty, provide contextual fallback
        if (!cleanResponse || cleanResponse.length < 10) {
            cleanResponse = this.getFallbackResponse(userMessage, targetTab);
        }
        
        // Add the response to the appropriate tab
        if (cleanResponse && cleanResponse.length > 0) {
            this.addMessageToTopic(cleanResponse, 'bot', targetTab);
            
            // Add quick replies if present
            if (quickReplies.length > 0) {
                this.showQuickReplies(quickReplies, targetTab);
            }
        }
        
        return { 
            response: cleanResponse, 
            tabSwitched: tabAnalysis.shouldSwitch, 
            targetTab: targetTab,
            quickReplies: quickReplies
        };
    }
    
    // Clean AI response from artifacts
    cleanAIResponse(response) {
        return response
            .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
            .replace(/^[\s\n]+|[\s\n]+$/g, '') // Trim whitespace
            .replace(/\*\*/g, '') // Remove markdown bold
            .replace(/\*/g, '') // Remove markdown emphasis
            .trim();
    }
    
    // Get recent conversation history for context
    getRecentConversationHistory(topicId, maxMessages = 6) {
        const topic = this.topics.find(t => t.id === topicId);
        if (!topic || !topic.responses || topic.responses.length === 0) {
            return 'No previous conversation in this topic.';
        }
        
        const recentResponses = topic.responses.slice(-maxMessages);
        return recentResponses.map(r => `${r.sender === 'user' ? 'User' : 'Assistant'}: ${r.message}`).join('\n');
    }
    
    // Get context from other tabs for cross-topic awareness
    getOtherTabsContext() {
        const contextSummary = [];
        
        this.topics.forEach(topic => {
            if (topic.responses && topic.responses.length > 0) {
                const lastResponse = topic.responses[topic.responses.length - 1];
                const message = lastResponse.message || lastResponse.content || '';
                if (message && typeof message === 'string') {
                    contextSummary.push(`${topic.id}: ${message.substring(0, 100)}...`);
                }
            }
        });
        
        return contextSummary.length > 0 ? contextSummary.join('\n') : 'No previous conversations in other topics.';
    }
    
    // Execute the actual Gemini API request
    async executeGeminiRequest(userMessage, topicId, requestId) {
        this.activeRequests.add(requestId);
        
        try {
            console.log(`Getting AI response for topic: ${topicId}, message: ${userMessage.substring(0, 50)}...`);
            const conversationContext = this.buildAIConversationContext(userMessage, topicId);
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: conversationContext
                    }]
                }]
            };
            
            console.log('Making rate-limited API request to:', this.GEMINI_API_URL);
            const response = await fetch(this.GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                
                // Specific handling for rate limit errors
                if (response.status === 429) {
                    throw new Error(`429 Too Many Requests: ${errorText}`);
                }
                
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            
            const data = await response.json();
            console.log('API Response received successfully');
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                console.error('Invalid API response structure:', data);
                throw new Error('Invalid response structure from Gemini API');
            }
            
            const result = data.candidates[0].content.parts[0].text;
            this.activeRequests.delete(requestId);
            return result;
        } catch (error) {
            console.error('Gemini API Error:', error);
            this.activeRequests.delete(requestId);
            
            // For rate limit errors, throw to trigger retry logic
            if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                throw error;
            }
            
            // For other errors, return fallback response
            return this.getFallbackResponse(userMessage, topicId);
        }
    }
    
    // Provide fallback responses when Gemini API fails
    getFallbackResponse(userMessage, topicId) {
        const fallbackResponses = {
            'GENERAL': {
                greeting: `Hi there! I'm here to help you learn about ${this.businessInfo.name} and our services. We're ${this.businessInfo.experience} serving ${this.businessInfo.location}. What can I help you with today?`,
                services: `We provide ${this.businessInfo.services} with a focus on ${this.businessInfo.specialties}. I'd be happy to tell you more about any of our services. What interests you most?`,
                about: `I'm an interactive way to get informed about ${this.businessInfo.name} and let us know about your queries. We're ${this.businessInfo.experience} specializing in ${this.businessInfo.services}. I'm here to help you understand our services and answer any questions you might have. What would you like to know?`,
                default: `I'm here to help you with information about ${this.businessInfo.name} and our services. Feel free to ask me anything about what we do, our service areas, or how we can help you. What questions do you have?`
            },
            'WHERE': {
                location: `We proudly serve ${this.businessInfo.serviceAreas}. Our family has been providing pool services in the Hamptons area for over 25 years.`,
                coverage: `Our service area includes The Hamptons, Southampton, Westhampton, and all of Suffolk County. We know the local area well!`,
                default: `We serve the entire Hamptons region. What area are you located in? We'd be happy to confirm we service your location.`
            },
            'WHEN': {
                scheduling: `We offer flexible scheduling to meet your needs, including same-day service for urgent issues. When would work best for you?`,
                availability: `We're available year-round for maintenance and seasonal services. Spring openings typically start in April, and fall closings run through November.`,
                default: `We provide flexible scheduling options. When do you need service? We can often accommodate same-day requests for urgent needs.`
            },
            'WHAT': {
                services: `Our services include: Pool & Spa Maintenance, Seasonal Openings/Closings, Equipment Installation, Eco-Friendly Systems, Repairs, and Water Testing.`,
                maintenance: `We provide weekly maintenance, chemical balancing, equipment servicing, and everything needed to keep your pool crystal clear.`,
                default: `We offer comprehensive pool and spa services. What specific service do you need help with?`
            },
            'WHY': {
                benefits: `We're family-owned with 25+ years of experience, offer same-day service, specialize in eco-friendly systems, and provide competitive pricing with local expertise.`,
                eco: `We specialize in eco-friendly pool systems including salt water and copper ion systems that are gentler on skin and the environment.`,
                default: `We combine decades of experience with eco-friendly approaches and same-day service. What pool challenges can we help you solve?`
            },
            'WHO': {
                contact: `You can reach us at ${this.businessInfo.phone} or ${this.businessInfo.email}. We respond quickly to all inquiries!`,
                communication: `We can communicate via phone, email, or text - whatever works best for you. How would you prefer we stay in touch?`,
                default: `We're here to help! You can reach us at ${this.businessInfo.phone}. How would you prefer we contact you?`
            }
        };
        
        const topicResponses = fallbackResponses[topicId] || fallbackResponses['GENERAL'];
        const message = userMessage.toLowerCase();
        
        // Enhanced keyword matching for better responses
        if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
            return topicResponses.greeting || topicResponses.default;
        } else if (message.includes('about you') || message.includes('tell me about') || message.includes('who are you') || message.includes('what are you')) {
            return topicResponses.about || topicResponses.default;
        } else if (message.includes('service') || message.includes('what do you do') || message.includes('what can you help')) {
            return topicResponses.services || topicResponses.default;
        } else if (message.includes('where') || message.includes('location') || message.includes('area')) {
            return topicResponses.location || topicResponses.coverage || topicResponses.default;
        } else if (message.includes('when') || message.includes('schedule') || message.includes('time')) {
            return topicResponses.scheduling || topicResponses.availability || topicResponses.default;
        } else if (message.includes('why') || message.includes('benefit') || message.includes('choose')) {
            return topicResponses.benefits || topicResponses.eco || topicResponses.default;
        } else if (message.includes('contact') || message.includes('phone') || message.includes('reach')) {
            return topicResponses.contact || topicResponses.communication || topicResponses.default;
        }
        
        return topicResponses.default;
    }
    
    buildConversationContext(userMessage) {
        const stateInfo = `
        CURRENT CONVERSATION STATE:
        - Location: ${this.conversationState.location || 'Not provided'}
        - Timing: ${this.conversationState.timing || 'Not provided'}
        - Contact Info: ${this.conversationState.contactInfo.preferred || 'Not provided'}
        - Phone: ${this.conversationState.contactInfo.phone || 'Not provided'}
        - Email: ${this.conversationState.contactInfo.email || 'Not provided'}
        - Service Needed: ${this.conversationState.serviceNeeded || 'Not provided'}
        - Current Flow: ${this.conversationState.currentFlow}
        - Brand Alignment: ${this.conversationState.brandAlignment}
        `;
        
        // Limit conversation history to last 10 messages to prevent context overflow
        const maxHistoryLength = 10;
        const recentHistory = this.conversationState.conversationHistory
            .slice(-maxHistoryLength)
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n');
        
        // Search website content based on user message
        const searchResults = this.searchWebsiteContent(userMessage);
        const websiteSearchInfo = searchResults.length > 0 ? 
            `RELEVANT WEBSITE INFO: ${searchResults.join(', ')}` : '';
        
        // Analyze what has already been discussed to avoid repetition
        const discussedTopics = this.getDiscussedTopics();
        
        // Condensed website info to reduce payload size
        const websiteInfo = `
        WEBSITE DATABASE (hamptonbluepools.com):
        Services: ${this.websiteContent.services.slice(0, 3).join(', ')}
        Areas: ${this.websiteContent.areas.slice(0, 4).join(', ')}
        Specialties: ${this.websiteContent.specialties.slice(0, 3).join(', ')}
        ${websiteSearchInfo}
        `;
        
        return `${this.businessContext}
        
        ${websiteInfo}
        
        ${stateInfo}
        
        RECENT CONVERSATION HISTORY (last ${maxHistoryLength} messages):
        ${recentHistory}
        
        TOPICS DISCUSSED: ${discussedTopics.slice(0, 5).join(', ')}
        
        CURRENT USER MESSAGE: ${userMessage}
        
        INSTRUCTIONS:
        Respond as a helpful and knowledgeable representative for ${this.businessInfo.name}. Provide a natural response that:
        1. Directly addresses their question or comment
        2. Provides relevant, helpful information about our services
        3. Shows genuine interest in assisting them
        4. Asks thoughtful follow-up questions when appropriate
        5. Uses a warm, conversational tone
        6. Include 2-3 quick reply options if helpful (format: QUICK_REPLIES: option1|option2|option3)
        
        Keep responses under 80 words and be authentic and personable.
        
        RESPONSE:`;
    }
    
    // Analyze what topics have been discussed to avoid repetition
    getDiscussedTopics() {
        const topics = [];
        const history = this.conversationState.conversationHistory;
        
        history.forEach(msg => {
            const content = msg.content.toLowerCase();
            if (content.includes('maintenance') && !topics.includes('maintenance')) topics.push('maintenance');
            if (content.includes('seasonal') && !topics.includes('seasonal')) topics.push('seasonal');
            if (content.includes('eco') && !topics.includes('eco-friendly')) topics.push('eco-friendly');
            if (content.includes('equipment') && !topics.includes('equipment')) topics.push('equipment');
            if (content.includes('price') && !topics.includes('pricing')) topics.push('pricing');
            if (content.includes('experience') && !topics.includes('experience')) topics.push('experience');
            if (content.includes('area') && !topics.includes('coverage')) topics.push('coverage');
            if (content.includes('same-day') && !topics.includes('same-day service')) topics.push('same-day service');
        });
        
        return topics;
    }
    
    // Detect user disengagement and suggest other topics
    detectDisengagementAndSuggestTopics(userMessage, topicId) {
        const lowerMessage = userMessage.toLowerCase().trim();
        const currentTabMessages = this.getTabConversationHistory(topicId);
        
        // Initialize follow-up counter for this tab if not exists
        if (!this.tabFollowUpCount[topicId]) {
            this.tabFollowUpCount[topicId] = 0;
        }
        
        // Count recent "no" responses in current tab
        const recentMessages = currentTabMessages.slice(-6); // Last 6 messages
        const userNoResponses = recentMessages.filter(msg => 
            msg.role === 'user' && 
            (msg.content.toLowerCase().trim() === 'no' || 
             msg.content.toLowerCase().trim() === 'nope' ||
             msg.content.toLowerCase().trim() === 'not really')
        ).length;
        
        // Count bot follow-up questions in current tab
        const botMessages = currentTabMessages.filter(msg => msg.role === 'assistant');
        const followUpQuestions = botMessages.length - 1; // Subtract initial welcome message
        
        // Trigger topic suggestions if:
        // 1. User said "no" 2+ times recently, OR
        // 2. Bot has asked more than maxFollowUps questions
        const shouldSuggestForNos = userNoResponses >= 2 && (lowerMessage === 'no' || lowerMessage === 'nope' || lowerMessage === 'not really');
        const shouldSuggestForFollowUps = followUpQuestions >= this.maxFollowUps;
        
        if (shouldSuggestForNos || shouldSuggestForFollowUps) {
            console.log(`🚫 Disengagement detected in ${topicId}: nos=${userNoResponses}, followUps=${followUpQuestions}`);
            const availableTopics = this.getAvailableTopicsForSuggestion(topicId);
            
            if (availableTopics.length > 0) {
                const topicSuggestions = availableTopics.map(topic => {
                    switch(topic.id) {
                        case 'WHERE': return 'our service areas';
                        case 'WHEN': return 'scheduling and timing';
                        case 'WHAT': return 'our other services';
                        case 'WHY': return 'why choose us';
                        case 'WHO': return 'contact information';
                        default: return topic.title.toLowerCase();
                    }
                }).slice(0, 2);
                
                return {
                    shouldSuggestTopics: true,
                    suggestion: `No problem! Would you like to learn about ${topicSuggestions.join(' or ')} instead?`,
                    quickReplies: availableTopics.slice(0, 3).map(topic => {
                        switch(topic.id) {
                            case 'WHERE': return 'Service areas';
                            case 'WHEN': return 'Scheduling';
                            case 'WHAT': return 'Other services';
                            case 'WHY': return 'Why choose us';
                            case 'WHO': return 'Contact info';
                            default: return topic.title;
                        }
                    })
                };
            }
        }
        
        return { shouldSuggestTopics: false };
    }
    
    // Get available topics for suggestion (excluding current and completed)
    getAvailableTopicsForSuggestion(currentTopicId) {
        return this.topics.filter(topic => 
            topic.id !== currentTopicId && 
            !this.completedTabs.has(topic.id)
        );
    }
    
    // Detect which topic a quick reply is suggesting
    detectTopicFromQuickReply(response) {
        const lowerResponse = response.toLowerCase();
        
        if (lowerResponse.includes('service area') || lowerResponse.includes('where')) {
            return 'WHERE';
        } else if (lowerResponse.includes('schedul') || lowerResponse.includes('when') || lowerResponse.includes('timing')) {
            return 'WHEN';
        } else if (lowerResponse.includes('other service') || lowerResponse.includes('what') || lowerResponse.includes('services')) {
            return 'WHAT';
        } else if (lowerResponse.includes('why choose') || lowerResponse.includes('why') || lowerResponse.includes('different')) {
            return 'WHY';
        } else if (lowerResponse.includes('contact') || lowerResponse.includes('who') || lowerResponse.includes('phone')) {
            return 'WHO';
        }
        
        return null; // Not a topic suggestion
    }
    
    // Start conversation for a specific topic
    async startTopicConversation(topicId) {
        const topic = this.topics.find(t => t.id === topicId);
        if (!topic) return;
        
        // Add a welcome message for the new topic
        let welcomeMessage = '';
        let quickReplies = [];
        
        switch(topicId) {
            case 'WHERE':
                welcomeMessage = `Great! Let me tell you about our service areas. We serve ${this.businessInfo.location} and surrounding areas. What area are you located in?`;
                quickReplies = ['Tell me your coverage', 'Do you serve my area?', 'Service locations'];
                break;
            case 'WHEN':
                welcomeMessage = `Perfect! Let's talk about scheduling. We offer flexible scheduling and same-day service when possible. When are you looking to have work done?`;
                quickReplies = ['Same-day service?', 'Schedule appointment', 'Availability'];
                break;
            case 'WHAT':
                welcomeMessage = `Excellent! We offer comprehensive pool and spa services including maintenance, repairs, and eco-friendly systems. What type of service interests you?`;
                quickReplies = ['Pool maintenance', 'Equipment repair', 'Eco-friendly options'];
                break;
            case 'WHY':
                welcomeMessage = `Great choice! We're different because of our 25+ years of family-owned experience, eco-friendly approach, and commitment to same-day service. What matters most to you?`;
                quickReplies = ['Your experience', 'Eco-friendly approach', 'Same-day service'];
                break;
            case 'WHO':
                welcomeMessage = `Perfect! I'd be happy to help you get in touch. What's the best way to contact you - phone, email, or text?`;
                quickReplies = ['Phone call', 'Email', 'Text message'];
                break;
        }
        
        // Add the welcome message with quick replies
        setTimeout(() => {
            this.addBotMessage(welcomeMessage, quickReplies, topicId);
        }, 500);
    }

    // OLD METHOD REMOVED: buildTabConversationContext
    // This hard-coded method has been replaced with AI-powered buildAIConversationContext
    // The new approach uses intelligent context building without rigid rules
    
    // Enforce single-question rule by removing extra questions
    enforceSingleQuestion(response) {
        // Split by question marks and keep only the first question
        const sentences = response.split(/[.!?]+/).filter(s => s.trim());
        let result = '';
        let questionCount = 0;
        
        for (let sentence of sentences) {
            sentence = sentence.trim();
            if (!sentence) continue;
            
            if (sentence.includes('?') || sentence.endsWith('?')) {
                questionCount++;
                if (questionCount === 1) {
                    result += sentence + (sentence.endsWith('?') ? '' : '?') + ' ';
                }
                // Stop after first question
                break;
            } else {
                result += sentence + '. ';
            }
        }
        
        return result.trim();
    }
    
    // Generate context-aware questions when switching tabs
    generateContextualQuestion(fromTab, toTab, userMessage) {
        const contextualQuestions = {
            // From WHERE tab
            'WHERE_TO_WHAT': `Great! Since you're in ${this.businessInfo.serviceAreas}, what specific service do you need help with? QUICK_REPLIES: Pool maintenance|Equipment repair|Seasonal service`,
            'WHERE_TO_WHEN': `Perfect! We serve your area. When would you like to schedule this service? QUICK_REPLIES: Today|This week|Next week`,
            'WHERE_TO_WHY': `Excellent! We cover your location. What makes you consider choosing our services? QUICK_REPLIES: Experience|Local company|Competitive pricing`,
            'WHERE_TO_WHO': `Great! We definitely serve your area. What's the best way for us to contact you? QUICK_REPLIES: Phone call|Text message|Email`,
            
            // From WHAT tab
            'WHAT_TO_WHERE': `Got it! For that service, what area are you located in so we can confirm coverage? QUICK_REPLIES: Hamptons|Southampton|Westhampton`,
            'WHAT_TO_WHEN': `Perfect! For that service, when would you prefer to have it done? QUICK_REPLIES: ASAP|This week|Flexible timing`,
            'WHAT_TO_WHY': `Understood! What's making you consider our services for this work? QUICK_REPLIES: Quality work|Local expertise|Fair pricing`,
            'WHAT_TO_WHO': `Great! For that service, how would you prefer we contact you to coordinate? QUICK_REPLIES: Call me|Text me|Email me`,
            
            // From WHEN tab
            'WHEN_TO_WHERE': `Sounds good for timing! What area are you located in? QUICK_REPLIES: Hamptons area|Southampton|Other location`,
            'WHEN_TO_WHAT': `Perfect timing! What specific service do you need during that timeframe? QUICK_REPLIES: Pool repair|Maintenance|Equipment install`,
            'WHEN_TO_WHY': `Great timing preference! What's important to you when choosing a service provider? QUICK_REPLIES: Reliability|Experience|Value`,
            'WHEN_TO_WHO': `Excellent! For that schedule, what's the best way to reach you? QUICK_REPLIES: Phone|Text|Email`,
            
            // From WHY tab
            'WHY_TO_WHERE': `Thank you! What area are you located in so we can serve you? QUICK_REPLIES: The Hamptons|Southampton|Suffolk County`,
            'WHY_TO_WHAT': `Appreciate that! What specific service can we help you with? QUICK_REPLIES: Pool service|Spa service|Equipment work`,
            'WHY_TO_WHEN': `Great to hear! When would you like to get started? QUICK_REPLIES: Right away|This week|Plan ahead`,
            'WHY_TO_WHO': `Wonderful! How should we contact you to move forward? QUICK_REPLIES: Call me now|Text is fine|Send email`,
            
            // From WHO tab
            'WHO_TO_WHERE': `Perfect! What area are you located in for our service? QUICK_REPLIES: Hamptons|Southampton|Nearby area`,
            'WHO_TO_WHAT': `Great contact info! What service do you need help with? QUICK_REPLIES: Pool maintenance|Repair work|New installation`,
            'WHO_TO_WHEN': `Excellent! When would work best for you? QUICK_REPLIES: Today|Tomorrow|This week`,
            'WHO_TO_WHY': `Thanks for that info! What drew you to consider our services? QUICK_REPLIES: Reputation|Local business|Recommendations`
        };
        
        const questionKey = `${fromTab}_TO_${toTab}`;
        return contextualQuestions[questionKey] || `Let's discuss this topic. How can I help you? QUICK_REPLIES: Tell me more|I have questions|Let's continue`;
    }
    
    updateConversationState(message) {
        const lowerMessage = message.toLowerCase();
        
        // Phone number detection (various formats) - exclude prompts
        const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/;
        const phoneMatch = message.match(phoneRegex);
        if (phoneMatch && !this.conversationState.contactInfo.phone && 
            !lowerMessage.includes('phone number is') && 
            !lowerMessage.includes('my phone') &&
            !lowerMessage.includes('call me') &&
            !lowerMessage.includes('number is') &&
            this.isValidPhoneNumber(message)) {
            this.conversationState.contactInfo.phone = phoneMatch[0];
            this.conversationState.contactInfo.preferred = 'phone';
        }
        
        // Email detection - exclude prompts
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const emailMatch = message.match(emailRegex);
        if (emailMatch && !this.conversationState.contactInfo.email &&
            !lowerMessage.includes('email is') &&
            !lowerMessage.includes('my email') &&
            this.isValidEmail(message)) {
            this.conversationState.contactInfo.email = emailMatch[0];
            this.conversationState.contactInfo.preferred = 'email';
        }
        
        // Location detection
        if (!this.conversationState.location && this.isLocationMessage(lowerMessage)) {
            this.conversationState.location = message;
        }
        
        // Timing detection
        if (!this.conversationState.timing && this.isTimingMessage(lowerMessage)) {
            this.conversationState.timing = message;
        }
        
        // Contact preference detection
        if (!this.conversationState.contactInfo.preferred && this.isContactMessage(lowerMessage)) {
            this.conversationState.contactInfo.preferred = lowerMessage.includes('phone') ? 'phone' : 'email';
        }
        
        // Service detection
        if (!this.conversationState.serviceNeeded) {
            if (lowerMessage.includes('maintenance')) this.conversationState.serviceNeeded = 'maintenance';
            else if (lowerMessage.includes('seasonal')) this.conversationState.serviceNeeded = 'seasonal';
            else if (lowerMessage.includes('equipment')) this.conversationState.serviceNeeded = 'equipment';
            else if (lowerMessage.includes('eco') || lowerMessage.includes('green')) {
                this.conversationState.serviceNeeded = 'eco-systems';
                this.conversationState.brandAlignment = true;
            }
        }
        
        // Brand alignment detection
        if (lowerMessage.includes('eco') || lowerMessage.includes('green') || lowerMessage.includes('environment')) {
            this.conversationState.brandAlignment = true;
        }
    }
    
    handleFallbackResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Fallback to rule-based responses if Gemini fails
        if (this.conversationState.currentFlow === 'initial') {
            this.addBotMessage(
                `Hi! I help with ${this.businessInfo.name} info. How can I assist?`,
                [
                    { text: "Pool services", response: "Tell me about services" },
                    { text: "Get help", response: "I need pool help" },
                    { text: "Ask question", response: "I have a question" }
                ]
            );
        } else {
            this.addBotMessage(
                "What can I help you with?",
                [
                    { text: "Pool maintenance", response: "I need maintenance" },
                    { text: "Pricing info", response: "I'd like pricing" },
                    { text: "Schedule service", response: "Schedule service" }
                ]
            );
        }
    }
    
    
    provideSummaryAndNextSteps() {
        const summary = this.generateConversationSummary();
        this.addBotMessage(
            `Perfect! Let me summarize what we've discussed:\n\n${summary}\n\n**Next Steps:**\nOur team will reach out to you via ${this.conversationState.contactInfo.preferred || 'your preferred method'} to discuss your specific needs and provide a personalized estimate.\n\n**Why choose ${this.businessInfo.name}?**\n✅ ${this.businessInfo.experience}\n✅ ${this.businessInfo.specialties}\n✅ Quality service and competitive pricing\n✅ Licensed and insured professionals\n\nIs there anything else you'd like to know before we connect you with our team?`,
            [
                { text: "That covers everything", response: "That covers everything, thanks!" },
                { text: "I have another question", response: "I have one more question" },
                { text: "When will you contact me?", response: "When will someone contact me?" }
            ]
        );
    }
    
    generateConversationSummary() {
        let summary = "📍 **Where:** " + (this.conversationState.location || this.businessInfo.location) + "\n";
        summary += "⏰ **When:** " + (this.conversationState.timing || "To be determined") + "\n";
        summary += "🔧 **What:** " + (this.conversationState.serviceNeeded || "Pool/spa services") + "\n";
        
        // Show actual contact information if captured
        if (this.conversationState.contactInfo.phone) {
            summary += "📞 **Phone:** " + this.conversationState.contactInfo.phone + "\n";
        } else if (this.conversationState.contactInfo.email) {
            summary += "📧 **Email:** " + this.conversationState.contactInfo.email + "\n";
        } else {
            summary += "📞 **Contact:** " + (this.conversationState.contactInfo.preferred || "To be determined") + "\n";
        }
        
        if (this.conversationState.specificQuery) {
            summary += "❓ **Why:** " + this.conversationState.specificQuery + "\n";
        }
        if (this.conversationState.brandAlignment) {
            summary += "🌿 **Brand Alignment:** Interested in eco-friendly solutions\n";
        }
        return summary;
    }
    
    // Helper functions for conversation state detection
    isLocationMessage(message) {
        const locations = ['hamptons', 'southampton', 'east hampton', 'westhampton', 'suffolk', 'ny', 'new york'];
        return locations.some(loc => message.includes(loc));
    }
    
    isTimingMessage(message) {
        const timingWords = ['soon', 'asap', 'today', 'tomorrow', 'week', 'month', 'urgent', 'emergency'];
        return timingWords.some(word => message.includes(word));
    }
    
    isContactMessage(message) {
        return message.includes('phone') || message.includes('email') || message.includes('call') || message.includes('text');
    }
    
    // Validate if a string contains a real phone number
    isValidPhoneNumber(text) {
        const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{10})/;
        const match = text.match(phoneRegex);
        return match && match[0].replace(/\D/g, '').length >= 10;
    }
    
    // Validate if a string contains a real email
    isValidEmail(text) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        return emailRegex.test(text);
    }
    
    hasEnoughInfo() {
        return this.conversationState.location && 
               this.conversationState.timing && 
               this.conversationState.contactInfo.preferred &&
               this.conversationState.serviceNeeded;
    }

    // Save lead data with proper error handling and user feedback
    async saveLead() {
        const leadData = {
            name: this.leadData.name || 'Not provided',
            email: this.leadData.email || this.conversationState.contactInfo.email || '',
            phone: this.leadData.phone || this.conversationState.contactInfo.phone || '',
            location: this.leadData.location || this.conversationState.location || '',
            service: this.leadData.service || this.conversationState.serviceNeeded || '',
            message: this.leadData.message || this.conversationState.specificQuery || '',
            timing: this.conversationState.timing || '',
            contactPreference: this.conversationState.contactInfo.preferred || '',
            conversationHistory: this.conversationState.conversationHistory,
            sessionId: this.conversationState.sessionId,
            timestamp: new Date().toISOString(),
            source: 'chatbot'
        };

        let saveSuccessful = false;
        let errorMessages = [];

        // Try Firebase first
        if (this.firebaseDB) {
            try {
                const leadId = await this.firebaseDB.addLead(leadData);
                console.log('✅ Lead saved to Firebase with ID:', leadId);
                saveSuccessful = true;
            } catch (error) {
                console.error('❌ Firebase save failed:', error);
                errorMessages.push('Firebase');
                
                // Show user notification for Firebase failure
                this.showNotification('Having trouble saving to our main database. Trying backup...', 'warning');
            }
        }

        // Try Google Sheets as backup
        if (window.SheetsIntegration) {
            try {
                await window.SheetsIntegration.addLead(leadData);
                console.log('✅ Lead saved to Google Sheets');
                saveSuccessful = true;
            } catch (error) {
                console.error('❌ Google Sheets save failed:', error);
                errorMessages.push('Google Sheets');
            }
        }

        // Fallback to localStorage
        if (!saveSuccessful) {
            try {
                const existingLeads = JSON.parse(localStorage.getItem(this.database) || '[]');
                leadData.id = 'local_' + Date.now();
                existingLeads.push(leadData);
                localStorage.setItem(this.database, JSON.stringify(existingLeads));
                console.log('✅ Lead saved to localStorage as fallback');
                saveSuccessful = true;
                
                this.showNotification('Information saved locally. We\'ll sync it when connection improves.', 'info');
            } catch (error) {
                console.error('❌ localStorage save failed:', error);
                errorMessages.push('Local Storage');
            }
        }

        if (!saveSuccessful) {
            // All save methods failed - notify user
            this.showNotification(
                'We\'re having trouble saving your information right now. ' +
                'Please call us directly at (555) 123-4567 or try again later.',
                'error'
            );
            throw new Error(`All save methods failed: ${errorMessages.join(', ')}`);
        }

        // Success notification
        if (saveSuccessful && errorMessages.length === 0) {
            this.showNotification('Your information has been saved successfully!', 'success');
        }

        return leadData.id || 'saved';
    }

    // Real-time Firebase update for topic interactions
    async updateTopicDataToFirebase(topicId, responses) {
        if (!this.firebaseDB) {
            console.log('Firebase not initialized, skipping topic update');
            return;
        }

        try {
            // Create or update lead data with current topic information
            // Simplify data structure to prevent Firebase 400 errors
            const leadUpdateData = {
                userId: this.userId,
                sessionId: this.conversationState?.sessionId || this.generateSessionId(),
                topicId: topicId,
                topicResponses: {
                    [topicId]: (responses && Array.isArray(responses)) ? responses.map(response => ({
                        content: String(response.content || response.message || '').substring(0, 1000), // Limit content length
                        type: String(response.type || response.sender || 'user'),
                        timestamp: response.timestamp || new Date().toISOString()
                    })) : []
                },
                lastActivity: new Date().toISOString(),
                // Simplify business info to essential fields only
                businessName: this.businessInfo?.name || '',
                businessLocation: this.businessInfo?.location || '',
                // Include any existing lead data
                name: String(this.leadData.name || '').substring(0, 100),
                email: String(this.leadData.email || '').substring(0, 100),
                phone: String(this.leadData.phone || '').substring(0, 20),
                location: String(this.leadData.location || '').substring(0, 200),
                service: String(this.leadData.service || '').substring(0, 100),
                message: String(this.leadData.message || '').substring(0, 1000),
                // Topic completion tracking
                completedTabs: Array.from(this.completedTabs),
                currentTab: String(this.currentActiveTab || ''),
                // Conversation metrics
                messageCount: Math.min(responses.length, 100), // Cap at reasonable number
                engagementLevel: this.calculateEngagementLevel(responses),
                // Real-time status
                status: 'active',
                source: 'chatbot-realtime',
                // Add timestamp for debugging
                lastUpdate: new Date().toISOString()
            };

            // Update or create lead document in Firebase
            const leadId = `${this.userId}_${leadUpdateData.sessionId}`;
            await this.firebaseDB.updateLead(leadId, leadUpdateData);
            
            console.log(`✅ Topic ${topicId} data updated to Firebase in real-time`);
            
            // Trigger dashboard refresh if admin is open
            this.notifyDashboardUpdate(leadId, leadUpdateData);
            
        } catch (error) {
            console.error(`❌ Failed to update topic ${topicId} to Firebase:`, error);
            // Don't show user notification for background updates to avoid spam
        }
    }

    // Calculate engagement level based on responses
    calculateEngagementLevel(responses) {
        if (!responses || responses.length === 0) return 'low';
        
        const userResponses = responses.filter(r => r.type === 'user');
        const avgLength = userResponses.reduce((sum, r) => sum + (r.content?.length || 0), 0) / userResponses.length;
        
        if (userResponses.length >= 3 && avgLength > 20) return 'high';
        if (userResponses.length >= 2 && avgLength > 10) return 'medium';
        return 'low';
    }

    // Notify dashboard of real-time updates
    notifyDashboardUpdate(leadId, leadData) {
        // Use localStorage to communicate with admin dashboard if it's open
        const dashboardUpdate = {
            type: 'lead_update',
            leadId: leadId,
            data: leadData,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('dashboard_update', JSON.stringify(dashboardUpdate));
        
        // Dispatch custom event for real-time updates
        window.dispatchEvent(new CustomEvent('leadUpdate', {
            detail: dashboardUpdate
        }));
    }

    // Show user notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
            </div>
        `;
        
        // Add to chat or create notification area
        const notificationArea = document.getElementById('notifications') || this.chatMessages;
        notificationArea.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        this.scrollToBottom();
    }

    // Get notification icon based on type
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'info': 
            default: return 'ℹ️';
        }
    }
    
    addMessage(message, sender, topicId = null) {
        // Use the new tabbed system
        this.addMessageToTopic(message, sender, topicId);
    }
    
    addBotMessage(message, quickReplies = [], topicId = null) {
        // Handle undefined or null messages
        if (!message || message === 'undefined') {
            console.error('Attempted to add undefined message');
            return;
        }
        
        console.log('Adding bot message:', message);
        console.log('Quick replies:', quickReplies);
        
        const targetTopicId = topicId || this.currentActiveTab;
        const chatArea = this.chatMessages[targetTopicId];
        
        if (!chatArea) {
            console.warn(`Chat area for topic ${targetTopicId} not found`);
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.dataset.timestamp = new Date().toISOString();
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = message.replace(/\n/g, '<br>');
        
        messageDiv.appendChild(contentDiv);
        
        if (quickReplies.length > 0) {
            const repliesDiv = document.createElement('div');
            repliesDiv.className = 'quick-replies';
            
            quickReplies.forEach((reply, index) => {
                console.log(`Quick reply ${index}:`, reply, typeof reply);
                const button = document.createElement('button');
                button.className = 'quick-reply';
                
                // Handle both string and object formats
                if (typeof reply === 'string') {
                    button.textContent = reply;
                    button.dataset.response = reply;
                } else if (reply && typeof reply === 'object') {
                    button.textContent = reply.text || reply;
                    button.dataset.response = reply.response || reply.text || reply;
                } else {
                    console.error('Invalid quick reply format:', reply);
                    button.textContent = 'Invalid Reply';
                    button.dataset.response = 'Invalid Reply';
                }
                
                repliesDiv.appendChild(button);
            });
            
            messageDiv.appendChild(repliesDiv);
        }
        
        chatArea.appendChild(messageDiv);
        
        // Add to topic responses for data tracking
        this.addTopicResponse(targetTopicId, message, 'bot');
        
        // Update tab status indicators after adding message
        this.updateTabStatusIndicators(this.currentActiveTab);
        
        // Scroll to bottom if this is the active tab
        if (targetTopicId === this.currentActiveTab) {
            this.scrollToBottom();
        }
    }
    
    showTypingIndicator(topicId = null) {
        const targetTopicId = topicId || this.currentActiveTab;
        const chatArea = this.chatMessages[targetTopicId];
        
        if (!chatArea) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <span>${this.businessInfo.name} is typing</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatArea.appendChild(typingDiv);
        
        if (targetTopicId === this.currentActiveTab) {
            this.scrollToBottom();
        }
    }
    
    hideTypingIndicator(topicId = null) {
        const targetTopicId = topicId || this.currentActiveTab;
        const chatArea = this.chatMessages[targetTopicId];
        
        if (!chatArea) return;
        
        const typingIndicator = chatArea.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Initialize tab functionality
    initializeTabs() {
        const topicTabs = document.getElementById('topicTabs');
        const topicInfoPanel = document.getElementById('topicInfoPanel');
        const closeTopicBtn = document.getElementById('closeTopicBtn');
        
        if (!topicTabs || !topicInfoPanel || !closeTopicBtn) {
            console.warn('Tab elements not found, skipping tab initialization');
            return;
        }
        
        // Show tabs after conversation starts
        setTimeout(() => {
            topicTabs.style.display = 'block';
            this.updateTabStates();
        }, 3000);
        
        // Add click handlers for tabs - Switch to tab chat area
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const topicId = tab.dataset.topic;
                this.switchToTab(topicId);
                
                // If this is a topic tab and it's empty, start the topic conversation
                if (topicId !== 'GENERAL' && this.chatMessages[topicId] && this.chatMessages[topicId].children.length === 0) {
                    this.startTopicConversation(topicId);
                }
            });
        });
        
        // Close topic panel handler
        closeTopicBtn.addEventListener('click', () => {
            topicInfoPanel.classList.remove('show');
        });
    }
    
    // Update tab visual states
    updateTabStates() {
        document.querySelectorAll('.tab').forEach((tab, index) => {
            const topicId = tab.dataset.topic;
            const topic = this.topics.find(t => t.id === topicId);
            const tabStatus = tab.querySelector('.tab-status');
            
            // Remove existing classes
            tab.classList.remove('active', 'completed');
            tabStatus.classList.remove('active', 'completed');
            
            if (topic) {
                if (topic.done) {
                    tab.classList.add('completed');
                    tabStatus.classList.add('completed');
                } else if (topicId === this.currentActiveTab) {
                    tab.classList.add('active');
                    tabStatus.classList.add('active');
                }
            }
        });
    }
    
    // Show topic information panel
    showTopicInfo(topicId) {
        const topic = this.topics.find(t => t.id === topicId);
        if (!topic) return;
        
        const topicInfoPanel = document.getElementById('topicInfoPanel');
        const topicTitle = document.getElementById('topicTitle');
        const topicInfo = document.getElementById('topicInfo');
        const topicResponses = document.getElementById('topicResponses');
        
        // Update panel content
        topicTitle.textContent = topic.title;
        topicInfo.textContent = topic.info;
        
        // Show responses for this topic
        topicResponses.innerHTML = '';
        if (topic.responses && topic.responses.length > 0) {
            const responsesTitle = document.createElement('h4');
            responsesTitle.textContent = 'Conversation History';
            topicResponses.appendChild(responsesTitle);
            
            topic.responses.forEach(response => {
                const responseDiv = document.createElement('div');
                responseDiv.className = `response-item ${response.type}`;
                responseDiv.textContent = response.content;
                topicResponses.appendChild(responseDiv);
            });
        }
        
        // Show panel
        topicInfoPanel.classList.add('show');
    }
    
    // Add response to topic history
    addTopicResponse(topicId, content, type = 'user') {
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
            if (!topic.responses) topic.responses = [];
            topic.responses.push({ content, type, timestamp: new Date() });
            
            // Update lead data
            this.leadData.topicResponses[topicId] = topic.responses;
            
            // Real-time Firebase update for topic interaction
            this.updateTopicDataToFirebase(topicId, topic.responses);
        }
    }
    
    // Navigate to topic (show info panel)
    navigateToTopic(topicId) {
        this.showTopicInfo(topicId);
        
        // Update current topic if not completed
        const topicIndex = this.topics.findIndex(t => t.id === topicId);
        if (topicIndex !== -1 && !this.topics[topicIndex].done) {
            this.currentTopicIndex = topicIndex;
            this.updateTabStates();
        }
    }
    
    // Start conversation for specific topic
    startTopicConversation(topicId) {
        const topic = this.topics.find(t => t.id === topicId);
        if (!topic) return;
        
        // Set current topic
        this.currentTopicIndex = this.topics.findIndex(t => t.id === topicId);
        
        // Switch to the topic's chat tab
        this.switchToTab(topicId);
        
        // Generate topic-specific conversation starter
        const topicStarters = {
            'GENERAL': `Hi! I'm here to help with any questions about ${this.businessInfo.name}. What can I help you with today?`,
            'WHERE': `Let's talk about our service areas in ${this.businessInfo.location}. What would you like to know about where we work?`,
            'WHEN': "I'd love to discuss timing for your service. What questions do you have about scheduling?",
            'WHAT': `Let's explore our ${this.businessInfo.services}. What specific services interest you most?`,
            'WHY': `I can explain our approach and specialties. What challenges are you facing that we might help with?`,
            'WHO': "Let's discuss how we can connect and work together. What's your preferred way to communicate?"
        };
        
        const message = topicStarters[topicId] || `Let's discuss ${topic.title}. What would you like to know?`;
        
        // Add bot message to the specific topic chat
        this.addBotMessage(message, [], topicId);
        
        // Update topic state
        this.updateTabStates();
        
        // Close topic panel if open
        const topicInfoPanel = document.getElementById('topicInfoPanel');
        if (topicInfoPanel) {
            topicInfoPanel.classList.remove('show');
        }
    }
    
    // Enhanced lead saving with context summary
    async saveLeadEnhanced() {
        try {
            // Generate enhanced context summary
            const contextData = this.generateContextSummary();
            this.leadData.contextSummary = contextData.shortSummary;
            this.leadData.contextDetails = contextData.detailedSummary;
            this.leadData.conversationMetrics = contextData.metrics;
            
            // Extract enhanced specific requests
            const requestsData = this.extractSpecificRequests();
            this.leadData.specificRequests = requestsData.summary;
            this.leadData.requestDetails = requestsData.details;
            this.leadData.hasUrgentRequests = requestsData.hasSpecificRequests;
            
            // Add topic-specific data
            this.leadData.topicResponses = {};
            this.topics.forEach(topic => {
                if (topic.responses && topic.responses.length > 0) {
                    this.leadData.topicResponses[topic.id] = {
                        name: topic.name,
                        responses: topic.responses,
                        completed: topic.done,
                        responseCount: topic.responses.length
                    };
                }
            });
            
            // Add conversation flow (last 10 messages with metadata)
            this.leadData.conversationFlow = this.conversation.slice(-10).map(msg => ({
                sender: msg.sender,
                message: msg.message,
                timestamp: msg.timestamp,
                length: msg.message.length
            }));
            
            // Add lead quality scoring
            this.leadData.leadScore = this.calculateLeadScore(contextData.metrics, requestsData);
            
            // Save to Firebase with enhanced data structure
            if (this.firebaseDB) {
                const enhancedLeadData = {
                    ...this.leadData,
                    enhanced: true,
                    version: '2.5',
                    savedAt: new Date().toISOString(),
                    platform: 'WWWWW.AI',
                    chatbotId: 'hampton-blue-pools'
                };
                
                const docRef = await this.firebaseDB.collection('leads').add(enhancedLeadData);
                console.log('Enhanced lead saved with ID:', docRef.id);
                console.log('Lead data:', enhancedLeadData);
                this.showNotification('Lead saved with enhanced context!', 'success');
            }
        } catch (error) {
            console.error('Error saving enhanced lead:', error);
            this.showNotification('Error saving lead', 'error');
        }
    }
    
    // Calculate lead quality score based on engagement and requests
    calculateLeadScore(metrics, requestsData) {
        let score = 0;
        
        // Base score from completion rate
        score += metrics.completionRate * 0.4; // 40% weight
        
        // Engagement score
        const engagementScore = {
            'High': 30,
            'Medium': 20,
            'Low': 10
        }[metrics.engagement] || 10;
        score += engagementScore;
        
        // Message count bonus (more engagement)
        if (metrics.messageCount > 10) score += 15;
        else if (metrics.messageCount > 5) score += 10;
        else score += 5;
        
        // Specific requests bonus
        if (requestsData.hasSpecificRequests) score += 20;
        if (requestsData.details.urgency) score += 15;
        if (requestsData.details.business) score += 10;
        
        // Duration bonus (engaged conversation)
        if (metrics.duration > 5) score += 10;
        else if (metrics.duration > 2) score += 5;
        
        return Math.min(Math.round(score), 100); // Cap at 100
    }
    
    // Generate context summary from conversation - Enhanced
    generateContextSummary() {
        const completedTopics = this.topics.filter(t => t.done);
        const activeTopics = this.topics.filter(t => !t.done);
        const totalMessages = this.conversation.length;
        const userMessages = this.conversation.filter(msg => msg.sender === 'user').length;
        const botMessages = this.conversation.filter(msg => msg.sender === 'bot').length;
        
        // Calculate conversation duration
        const duration = Date.now() - new Date(this.leadData.timestamp).getTime();
        const durationMinutes = Math.round(duration / 60000);
        
        // Analyze conversation engagement
        const avgMessageLength = this.conversation
            .filter(msg => msg.sender === 'user')
            .reduce((sum, msg) => sum + msg.message.length, 0) / userMessages || 0;
        
        const engagementLevel = avgMessageLength > 50 ? 'High' : avgMessageLength > 20 ? 'Medium' : 'Low';
        
        // Topic progress analysis
        const topicProgress = {
            completed: completedTopics.map(t => t.id),
            active: activeTopics.map(t => t.id),
            completionRate: Math.round((completedTopics.length / this.topics.length) * 100)
        };
        
        // Build comprehensive summary
        const summary = {
            overview: `${completedTopics.length}/${this.topics.length} topics completed (${topicProgress.completionRate}%)`,
            engagement: `${totalMessages} total messages (${userMessages} user, ${botMessages} bot) - ${engagementLevel} engagement`,
            duration: `${durationMinutes} minutes conversation time`,
            topicDetails: {
                completed: completedTopics.map(t => ({ id: t.id, name: t.name, responses: t.responses?.length || 0 })),
                remaining: activeTopics.map(t => ({ id: t.id, name: t.name }))
            },
            conversationFlow: this.conversation.slice(-5).map(msg => ({ 
                sender: msg.sender, 
                preview: msg.message.substring(0, 50) + (msg.message.length > 50 ? '...' : ''),
                timestamp: msg.timestamp 
            }))
        };
        
        return {
            shortSummary: `${topicProgress.completionRate}% complete | ${totalMessages} messages | ${durationMinutes}min | ${engagementLevel} engagement`,
            detailedSummary: summary,
            metrics: {
                completionRate: topicProgress.completionRate,
                messageCount: totalMessages,
                duration: durationMinutes,
                engagement: engagementLevel,
                avgMessageLength: Math.round(avgMessageLength)
            }
        };
    }
    
    // Extract specific requests from conversation - Enhanced
    extractSpecificRequests() {
        const userMessages = this.conversation
            .filter(msg => msg.sender === 'user')
            .map(msg => msg.message);
        
        const allUserText = userMessages.join(' ').toLowerCase();
        
        // Enhanced keyword categories
        const urgencyKeywords = ['urgent', 'asap', 'emergency', 'immediately', 'today', 'now'];
        const serviceKeywords = ['repair', 'fix', 'broken', 'leak', 'install', 'replace', 'maintenance', 'cleaning'];
        const businessKeywords = ['quote', 'estimate', 'price', 'cost', 'budget', 'consultation', 'appointment'];
        const problemKeywords = ['green', 'cloudy', 'algae', 'chemical', 'ph', 'chlorine', 'filter', 'pump', 'heater'];
        
        const foundUrgency = urgencyKeywords.filter(keyword => allUserText.includes(keyword));
        const foundServices = serviceKeywords.filter(keyword => allUserText.includes(keyword));
        const foundBusiness = businessKeywords.filter(keyword => allUserText.includes(keyword));
        const foundProblems = problemKeywords.filter(keyword => allUserText.includes(keyword));
        
        // Build detailed request summary
        const requests = {
            urgency: foundUrgency.length > 0 ? foundUrgency : null,
            services: foundServices.length > 0 ? foundServices : null,
            business: foundBusiness.length > 0 ? foundBusiness : null,
            problems: foundProblems.length > 0 ? foundProblems : null,
            rawMessages: userMessages.slice(-3), // Last 3 user messages for context
            totalMessages: userMessages.length
        };
        
        // Generate summary string
        let summary = [];
        if (requests.urgency) summary.push(`Urgency: ${requests.urgency.join(', ')}`);
        if (requests.services) summary.push(`Services: ${requests.services.join(', ')}`);
        if (requests.business) summary.push(`Business: ${requests.business.join(', ')}`);
        if (requests.problems) summary.push(`Problems: ${requests.problems.join(', ')}`);
        
        return {
            summary: summary.length > 0 ? summary.join(' | ') : 'General inquiry',
            details: requests,
            hasSpecificRequests: summary.length > 0
        };
    }
    
    // ========== RATE LIMITING METHODS ==========
    
    // Check if we can make a request based on rate limits
    canMakeRequest() {
        const now = Date.now();
        
        // Clean old request times (older than 1 minute)
        this.rateLimiting.requestTimes = this.rateLimiting.requestTimes.filter(
            time => now - time < 60000
        );
        
        // Check requests per minute limit
        if (this.rateLimiting.requestTimes.length >= this.rateLimiting.maxRequestsPerMinute) {
            console.warn('Rate limit exceeded: too many requests per minute');
            return false;
        }
        
        // Check concurrent requests limit
        if (this.activeRequests.size >= this.rateLimiting.maxConcurrentRequests) {
            console.warn('Rate limit exceeded: too many concurrent requests');
            return false;
        }
        
        return true;
    }
    
    // Add request to tracking
    trackRequest() {
        const now = Date.now();
        this.rateLimiting.requestTimes.push(now);
    }
    
    // Calculate delay before next request
    calculateDelay() {
        const now = Date.now();
        const recentRequests = this.rateLimiting.requestTimes.filter(
            time => now - time < 60000
        );
        
        if (recentRequests.length === 0) return 0;
        
        // If we're at the limit, calculate time until oldest request expires
        if (recentRequests.length >= this.rateLimiting.maxRequestsPerMinute) {
            const oldestRequest = Math.min(...recentRequests);
            return Math.max(0, 60000 - (now - oldestRequest) + 1000); // Add 1 second buffer
        }
        
        // Progressive delay based on recent request frequency
        const avgInterval = recentRequests.length > 1 ? 
            (now - recentRequests[0]) / (recentRequests.length - 1) : 0;
        
        if (avgInterval < 2000) { // If requests are too frequent
            return Math.min(3000 - avgInterval, 5000); // Delay up to 5 seconds
        }
        
        return 0;
    }
    
    // Queue a request for later execution
    queueRequest(requestFunction, requestId) {
        return new Promise((resolve, reject) => {
            this.rateLimiting.requestQueue.push({
                id: requestId,
                execute: requestFunction,
                resolve,
                reject,
                timestamp: Date.now()
            });
            
            this.processRequestQueue();
        });
    }
    
    // Process queued requests with rate limiting
    async processRequestQueue() {
        if (this.rateLimiting.requestQueue.length === 0) return;
        
        const delay = this.calculateDelay();
        if (delay > 0) {
            console.log(`Rate limiting: waiting ${delay}ms before next request`);
            setTimeout(() => this.processRequestQueue(), delay);
            return;
        }
        
        if (!this.canMakeRequest()) {
            setTimeout(() => this.processRequestQueue(), 1000);
            return;
        }
        
        const request = this.rateLimiting.requestQueue.shift();
        if (!request) return;
        
        try {
            this.trackRequest();
            const result = await request.execute();
            request.resolve(result);
        } catch (error) {
            request.reject(error);
        }
        
        // Process next request after a small delay
        setTimeout(() => this.processRequestQueue(), 500);
    }
    
    // Make API request with exponential backoff retry
    async makeApiRequestWithRetry(requestFunction, requestId, attempt = 1) {
        try {
            const result = await requestFunction();
            // Reset backoff delay on success
            this.rateLimiting.backoffDelay = 1000;
            return result;
        } catch (error) {
            console.error(`API request attempt ${attempt} failed:`, error);
            
            // Check if it's a rate limit error (429)
            if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
                if (attempt < this.rateLimiting.retryAttempts) {
                    const delay = Math.min(
                        this.rateLimiting.backoffDelay * Math.pow(2, attempt - 1),
                        this.rateLimiting.maxBackoffDelay
                    );
                    
                    console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${this.rateLimiting.retryAttempts})`);
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                    return this.makeApiRequestWithRetry(requestFunction, requestId, attempt + 1);
                } else {
                    console.error('Max retry attempts reached for rate limited request');
                    throw new Error('Rate limit exceeded. Please try again later.');
                }
            }
            
            // For other errors, throw immediately
            throw error;
        }
    }
}

// Static method to clear singleton instance if needed
WWWWWAIChatbot.clearInstance = function() {
    WWWWWAIChatbot.instance = null;
};

// Chatbot initialization is handled by the HTML page with configuration
// No automatic initialization to prevent duplicates
