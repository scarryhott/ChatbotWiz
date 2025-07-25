/**
 * WWWWW.AI Custom UI Chatbot
 * Flexible chatbot implementation for custom UI contexts like live preview mode
 */

class CustomUIChatbot {
    constructor(config = {}) {
        if (CustomUIChatbot.instance && !config.allowMultiple) {
            return CustomUIChatbot.instance;
        }
        
        if (!config.allowMultiple) {
            CustomUIChatbot.instance = this;
        }

        // Core configuration
        this.config = {
            containerId: config.containerId || 'custom-chatbot-container',
            containerElement: config.containerElement || null,
            mode: config.mode || 'embedded', // 'embedded', 'modal', 'fullscreen', 'preview'
            theme: config.theme || 'default',
            businessName: config.businessName || 'WWWWW.AI',
            businessIcon: config.businessIcon || '🤖',
            businessTagline: config.businessTagline || 'AI-Powered Service Assistant',
            geminiApiKey: config.geminiApiKey || 'AIzaSyDB4_JVNACxlh0fu3a3UWm9XO5kIxvwDfg',
            autoStart: config.autoStart !== false,
            showTabs: config.showTabs !== false,
            width: config.width || '400px',
            height: config.height || '600px',
            borderRadius: config.borderRadius || '12px',
            primaryColor: config.primaryColor || '#2196F3',
            secondaryColor: config.secondaryColor || '#f8f9fa',
            textColor: config.textColor || '#333333',
            customCSS: config.customCSS || '',
            onMessage: config.onMessage || null,
            onTopicChange: config.onTopicChange || null,
            onLeadCapture: config.onLeadCapture || null,
            onError: config.onError || null,
            ...config
        };

        // Initialize state
        this.currentActiveTab = 'WHY';
        this.chatMessages = {};
        this.conversation = [];
        this.isProcessing = false;
        this.userId = this.generateUserId();
        
        this.topics = [
            { id: 'WHO', title: 'Contact Preferences', icon: '👤' },
            { id: 'WHAT', title: 'Service Needed', icon: '🔧' },
            { id: 'WHY', title: 'Why Choose Us', icon: '💡' },
            { id: 'WHERE', title: 'Location', icon: '📍' },
            { id: 'WHEN', title: 'Timing', icon: '⏰' }
        ];

        this.init();
    }

    async init() {
        try {
            await this.createUI();
            this.setupEventListeners();
            this.initializeChatAreas();
            
            if (this.config.autoStart) {
                setTimeout(() => this.startConversation(), 1000);
            }
            
            console.log('CustomUIChatbot initialized successfully');
        } catch (error) {
            console.error('Error initializing CustomUIChatbot:', error);
            if (this.config.onError) {
                this.config.onError(error);
            }
        }
    }

    async createUI() {
        const container = this.getContainer();
        if (!container) {
            throw new Error('Container not found for CustomUIChatbot');
        }

        this.applyContainerStyles(container);
        container.innerHTML = this.generateHTML();
        
        if (this.config.customCSS) {
            this.injectCustomCSS();
        }

        this.storeElementReferences();
    }

    getContainer() {
        if (this.config.containerElement) {
            return this.config.containerElement;
        }
        
        let container = document.getElementById(this.config.containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = this.config.containerId;
            document.body.appendChild(container);
        }
        
        return container;
    }

    applyContainerStyles(container) {
        const baseStyles = {
            width: this.config.width,
            height: this.config.height,
            borderRadius: this.config.borderRadius,
            overflow: 'hidden',
            position: 'relative',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: this.config.textColor
        };

        const modeStyles = {
            embedded: { border: '1px solid #e9ecef', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' },
            modal: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: '10000', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
            fullscreen: { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', zIndex: '10000' },
            preview: { border: '2px solid #2196F3', boxShadow: '0 4px 20px rgba(33, 150, 243, 0.2)' }
        };

        Object.assign(container.style, baseStyles, modeStyles[this.config.mode] || {});
    }

    generateHTML() {
        const showTabs = this.config.showTabs;
        
        return `
            <div class="custom-chat-container">
                <div class="custom-chat-header">
                    <div class="custom-header-content">
                        <div class="custom-logo">
                            <div class="custom-logo-icon">${this.config.businessIcon}</div>
                            <h1 class="custom-business-name">${this.config.businessName}</h1>
                        </div>
                        <p class="custom-tagline">${this.config.businessTagline}</p>
                    </div>
                </div>
                
                ${showTabs ? this.generateTabsHTML() : ''}
                
                <div class="custom-chatbot-body">
                    <div class="custom-chat-messages-container">
                        ${this.topics.map(topic => `
                            <div class="custom-chat-messages ${topic.id === this.currentActiveTab ? 'active' : ''}" 
                                 id="chatMessages-${topic.id}">
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="custom-quick-replies" id="quickReplies" style="display: none;"></div>
                    
                    <div class="custom-input-container">
                        <div class="custom-chat-input">
                            <input type="text" 
                                   id="customMessageInput" 
                                   class="custom-message-input"
                                   placeholder="Type your message here..." 
                                   autocomplete="off">
                            <button id="customSendButton" class="custom-send-button">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                ${showTabs ? `<div class="custom-topic-info" id="topicInfo" style="display: none;"></div>` : ''}
            </div>
            
            <style>${this.generateCSS()}</style>
        `;
    }

    generateTabsHTML() {
        return `
            <div class="custom-topic-tabs" id="topicTabs">
                <div class="custom-tab-container">
                    ${this.topics.map(topic => `
                        <div class="custom-tab ${topic.id === this.currentActiveTab ? 'active' : ''}" 
                             data-topic="${topic.id}">
                            <span class="custom-tab-icon">${topic.icon}</span>
                            <span class="custom-tab-title">${topic.title}</span>
                            <span class="custom-tab-status"></span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    generateCSS() {
        return `
            .custom-chat-container { display: flex; flex-direction: column; height: 100%; background: white; position: relative; }
            .custom-chat-header { background: linear-gradient(135deg, ${this.config.primaryColor}, ${this.adjustColor(this.config.primaryColor, -20)}); color: white; padding: 16px 20px; text-align: center; }
            .custom-header-content { display: flex; flex-direction: column; align-items: center; gap: 8px; }
            .custom-logo { display: flex; align-items: center; gap: 12px; }
            .custom-logo-icon { font-size: 24px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.2); border-radius: 50%; }
            .custom-business-name { margin: 0; font-size: 18px; font-weight: 600; }
            .custom-tagline { margin: 0; font-size: 13px; opacity: 0.9; }
            .custom-topic-tabs { background: ${this.config.secondaryColor}; border-bottom: 1px solid #e9ecef; overflow-x: auto; }
            .custom-tab-container { display: flex; min-width: max-content; }
            .custom-tab { flex: 1; min-width: 80px; padding: 12px 8px; text-align: center; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s ease; position: relative; }
            .custom-tab:hover { background: rgba(33, 150, 243, 0.1); }
            .custom-tab.active { border-bottom-color: ${this.config.primaryColor}; background: rgba(33, 150, 243, 0.1); }
            .custom-tab-icon { display: block; font-size: 18px; margin-bottom: 4px; }
            .custom-tab-title { display: block; font-size: 11px; font-weight: 500; color: #666; }
            .custom-chatbot-body { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }
            .custom-chat-messages-container { position: absolute; top: 0; left: 0; right: 0; bottom: 80px; overflow: hidden; }
            .custom-chat-messages { position: absolute; top: 0; left: 0; right: 0; bottom: 0; padding: 20px; overflow-y: auto; overflow-x: hidden; display: none; scroll-behavior: smooth; }
            .custom-chat-messages.active { display: flex; flex-direction: column; gap: 12px; }
            .custom-message { max-width: 85%; padding: 12px 16px; border-radius: 18px; font-size: 14px; line-height: 1.4; word-wrap: break-word; }
            .custom-message.bot { background: ${this.config.secondaryColor}; color: ${this.config.textColor}; align-self: flex-start; border-bottom-left-radius: 6px; }
            .custom-message.user { background: ${this.config.primaryColor}; color: white; align-self: flex-end; border-bottom-right-radius: 6px; }
            .custom-quick-replies { position: absolute; bottom: 80px; left: 0; right: 0; padding: 0 20px 10px; display: flex; flex-wrap: wrap; gap: 8px; background: white; z-index: 5; }
            .custom-quick-reply { background: white; border: 2px solid ${this.config.primaryColor}; color: ${this.config.primaryColor}; padding: 8px 16px; border-radius: 20px; font-size: 13px; cursor: pointer; transition: all 0.2s ease; }
            .custom-quick-reply:hover { background: ${this.config.primaryColor}; color: white; }
            .custom-input-container { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px; border-top: 1px solid #e9ecef; background: white; z-index: 10; }
            .custom-chat-input { display: flex; gap: 12px; align-items: center; }
            .custom-message-input { flex: 1; padding: 12px 16px; border: 2px solid #e9ecef; border-radius: 25px; font-size: 14px; outline: none; transition: border-color 0.2s; }
            .custom-message-input:focus { border-color: ${this.config.primaryColor}; }
            .custom-send-button { background: ${this.config.primaryColor}; border: none; border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; transition: background-color 0.2s; }
            .custom-send-button:hover { background: ${this.adjustColor(this.config.primaryColor, -20)}; }
            .custom-send-button:disabled { background: #ccc; cursor: not-allowed; }
            @media (max-width: 480px) {
                .custom-chat-header { padding: 12px 16px; }
                .custom-business-name { font-size: 16px; }
                .custom-tab { padding: 10px 6px; }
                .custom-chat-messages { padding: 16px; }
                .custom-input-container { padding: 16px; }
                .custom-chat-messages-container { bottom: 70px; }
                .custom-quick-replies { bottom: 70px; padding: 0 16px 8px; }
            }
        `;
    }

    storeElementReferences() {
        this.messageInput = document.getElementById('customMessageInput');
        this.sendButton = document.getElementById('customSendButton');
        this.quickRepliesContainer = document.getElementById('quickReplies');
        this.topicTabs = document.getElementById('topicTabs');
    }

    setupEventListeners() {
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.handleSend());
        }

        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.handleSend();
                }
            });
        }

        if (this.topicTabs) {
            this.topicTabs.addEventListener('click', (e) => {
                const tab = e.target.closest('.custom-tab');
                if (tab) {
                    const topicId = tab.dataset.topic;
                    this.switchToTab(topicId);
                }
            });
        }
    }

    initializeChatAreas() {
        this.chatMessages = {};
        this.topics.forEach(topic => {
            const element = document.getElementById(`chatMessages-${topic.id}`);
            if (element) {
                this.chatMessages[topic.id] = element;
            }
        });
    }

    startConversation() {
        const welcomeMessage = `👋 Hi! I'm here to help you discover why ${this.config.businessName} is the right choice for your needs. As your interactive assistant, I'm here to showcase our expertise and demonstrate why we stand out. Let me share what makes us special!`;
        
        this.addMessageToTopic(this.currentActiveTab, welcomeMessage, 'bot');
        
        if (this.config.showTabs && this.topicTabs) {
            setTimeout(() => {
                this.topicTabs.style.display = 'block';
            }, 2000);
        }
        
        setTimeout(() => {
            this.showQuickReplies([
                "Tell me more",
                "What makes you different?",
                "Why should I choose you?"
            ]);
        }, 3000);
    }

    async handleSend() {
        if (this.isProcessing || !this.messageInput) return;
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        this.isProcessing = true;
        this.messageInput.value = '';
        this.sendButton.disabled = true;
        this.hideQuickReplies();
        
        this.addMessageToTopic(this.currentActiveTab, message, 'user');
        
        if (this.config.onMessage) {
            this.config.onMessage(message, 'user', this.currentActiveTab);
        }
        
        try {
            const response = await this.getGeminiResponseForTab(this.currentActiveTab, message);
            this.addMessageToTopic(this.currentActiveTab, response, 'bot');
            
            if (this.config.onMessage) {
                this.config.onMessage(response, 'bot', this.currentActiveTab);
            }
            
        } catch (error) {
            console.error('Error getting AI response:', error);
            const fallbackResponse = "I apologize, but I'm having trouble connecting right now. Please try again in a moment.";
            this.addMessageToTopic(this.currentActiveTab, fallbackResponse, 'bot');
            
            if (this.config.onError) {
                this.config.onError(error);
            }
        } finally {
            this.isProcessing = false;
            this.sendButton.disabled = false;
        }
    }

    addMessageToTopic(topicId, message, sender) {
        const chatArea = this.chatMessages[topicId];
        if (!chatArea) return;
        
        const messageElement = document.createElement('div');
        messageElement.className = `custom-message ${sender}`;
        messageElement.textContent = message;
        
        chatArea.appendChild(messageElement);
        this.scrollToBottom(chatArea);
        
        this.conversation.push({
            topicId,
            message,
            sender,
            timestamp: new Date().toISOString()
        });
    }

    switchToTab(topicId) {
        if (!this.topics.find(t => t.id === topicId)) return;
        
        this.currentActiveTab = topicId;
        
        document.querySelectorAll('.custom-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.topic === topicId);
        });
        
        document.querySelectorAll('.custom-chat-messages').forEach(area => {
            area.classList.toggle('active', area.id === `chatMessages-${topicId}`);
        });
        
        if (this.config.onTopicChange) {
            this.config.onTopicChange(topicId, this.topics.find(t => t.id === topicId));
        }
    }

    showQuickReplies(replies) {
        if (!this.quickRepliesContainer) return;
        
        this.quickRepliesContainer.innerHTML = '';
        this.quickRepliesContainer.style.display = 'flex';
        
        replies.forEach(reply => {
            const button = document.createElement('button');
            button.className = 'custom-quick-reply';
            button.textContent = reply;
            button.addEventListener('click', () => {
                this.messageInput.value = reply;
                this.handleSend();
            });
            this.quickRepliesContainer.appendChild(button);
        });
    }

    hideQuickReplies() {
        if (this.quickRepliesContainer) {
            this.quickRepliesContainer.style.display = 'none';
        }
    }

    scrollToBottom(chatArea) {
        if (!chatArea) return;
        setTimeout(() => {
            chatArea.scrollTop = chatArea.scrollHeight;
        }, 50);
    }

    async getGeminiResponseForTab(topicId, userMessage) {
        const context = this.buildConversationContext(topicId);
        const prompt = `${context}\n\nUser: ${userMessage}\n\nAssistant:`;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.config.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    buildConversationContext(topicId) {
        const topic = this.topics.find(t => t.id === topicId);
        const recentMessages = this.conversation
            .filter(msg => msg.topicId === topicId)
            .slice(-10)
            .map(msg => `${msg.sender}: ${msg.message}`)
            .join('\n');
        
        return `You are an AI assistant for ${this.config.businessName}. 
Current topic: ${topic?.title || topicId}
Recent conversation:
${recentMessages}

Provide helpful, natural responses about this topic. Keep responses concise and engaging.`;
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    adjustColor(color, amount) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * amount);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    injectCustomCSS() {
        if (!this.config.customCSS) return;
        const style = document.createElement('style');
        style.textContent = this.config.customCSS;
        document.head.appendChild(style);
    }

    // Public API methods
    sendMessage(message, topicId = null) {
        if (topicId && topicId !== this.currentActiveTab) {
            this.switchToTab(topicId);
        }
        if (this.messageInput) {
            this.messageInput.value = message;
            this.handleSend();
        }
    }

    getConversation() {
        return this.conversation;
    }

    clearConversation() {
        this.conversation = [];
        Object.values(this.chatMessages).forEach(area => {
            if (area) area.innerHTML = '';
        });
    }

    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.applyContainerStyles(this.getContainer());
    }

    destroy() {
        const container = this.getContainer();
        if (container) {
            container.innerHTML = '';
        }
        if (CustomUIChatbot.instance === this) {
            CustomUIChatbot.instance = null;
        }
    }

    static clearInstance() {
        CustomUIChatbot.instance = null;
    }
}
