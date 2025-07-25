/**
 * WWWWW.AI Universal Chatbot Embed Generator
 * Creates embeddable chatbot code for websites
 */

interface EmbedConfig {
  chatbotId: string;
  businessName: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left' | 'center';
  animation: 'slide-up' | 'fade-in' | 'bounce';
  delay: number;
  apiEndpoint?: string;
}

export function generateEmbedCode(config: EmbedConfig): string {
  const embedScript = `
    <!-- WWWWW.AI Universal Chatbot Embed -->
    <script>
      (function() {
        'use strict';
        
        // Chatbot configuration
        var chatbotConfig = {
          id: '${config.chatbotId}',
          name: '${config.businessName} Assistant',
          position: '${config.position}',
          animation: '${config.animation}',
          delay: ${config.delay},
          primaryColor: '${config.primaryColor}',
          apiEndpoint: '${config.apiEndpoint || 'https://api.wwwww.ai'}'
        };
        
        // Create embed container
        var container = document.createElement('div');
        container.id = 'wwwww-chatbot-embed-' + chatbotConfig.id;
        container.style.cssText = \`
          position: fixed;
          z-index: 999999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          \${chatbotConfig.position === 'bottom-right' ? 'bottom: 20px; right: 20px;' : ''}
          \${chatbotConfig.position === 'bottom-left' ? 'bottom: 20px; left: 20px;' : ''}
          \${chatbotConfig.position === 'center' ? 'top: 50%; left: 50%; transform: translate(-50%, -50%);' : ''}
        \`;
        
        // Create trigger button
        var trigger = document.createElement('div');
        trigger.style.cssText = \`
          background: \${chatbotConfig.primaryColor};
          color: white;
          padding: 15px 20px;
          border-radius: 25px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s ease;
          max-width: 200px;
        \`;
        
        trigger.innerHTML = \`
          <span style="font-size: 20px;">💬</span>
          <span style="font-weight: 500; font-size: 14px;">Chat with \${chatbotConfig.name}!</span>
        \`;
        
        trigger.addEventListener('mouseenter', function() {
          this.style.transform = 'translateY(-2px)';
          this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
        });
        
        trigger.addEventListener('mouseleave', function() {
          this.style.transform = 'translateY(0)';
          this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        });
        
        // Create chatbot window
        var chatWindow = document.createElement('div');
        chatWindow.style.cssText = \`
          display: none;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 10px;
          position: relative;
        \`;
        
        chatWindow.innerHTML = \`
          <div style="background: \${chatbotConfig.primaryColor}; color: white; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🤖</span>
              <span style="font-weight: 600; font-size: 16px;">\${chatbotConfig.name}</span>
            </div>
            <button id="close-chat-\${chatbotConfig.id}" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 5px; border-radius: 4px;">×</button>
          </div>
          <div id="chat-messages-\${chatbotConfig.id}" style="flex: 1; padding: 20px; overflow-y: auto; background: #f8f9fa;">
            <div style="background: white; padding: 12px 16px; border-radius: 18px 18px 18px 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); margin-bottom: 15px;">
              Hi! I'm here to help you learn about our services. How can I assist you today?
            </div>
          </div>
          <div style="padding: 15px 20px; background: white; border-top: 1px solid #e9ecef; display: flex; gap: 10px; align-items: center;">
            <input type="text" id="chat-input-\${chatbotConfig.id}" placeholder="Type your message..." style="flex: 1; padding: 10px 15px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 14px;">
            <button id="send-btn-\${chatbotConfig.id}" style="background: \${chatbotConfig.primaryColor}; color: white; border: none; padding: 10px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        \`;
        
        // Event handlers
        trigger.addEventListener('click', function() {
          chatWindow.style.display = 'flex';
          trigger.style.display = 'none';
          
          // Animation
          if (chatbotConfig.animation === 'slide-up') {
            chatWindow.style.animation = 'slideUp 0.3s ease-out';
          } else if (chatbotConfig.animation === 'fade-in') {
            chatWindow.style.animation = 'fadeIn 0.3s ease-out';
          } else if (chatbotConfig.animation === 'bounce') {
            chatWindow.style.animation = 'bounce 0.6s ease-out';
          }
        });
        
        document.getElementById('close-chat-' + chatbotConfig.id).addEventListener('click', function() {
          chatWindow.style.display = 'none';
          trigger.style.display = 'flex';
        });
        
        // Message handling
        function sendMessage(message) {
          var messagesContainer = document.getElementById('chat-messages-' + chatbotConfig.id);
          
          // Add user message
          var userMsg = document.createElement('div');
          userMsg.style.cssText = 'text-align: right; margin-bottom: 15px;';
          userMsg.innerHTML = \`
            <div style="background: \${chatbotConfig.primaryColor}; color: white; padding: 12px 16px; border-radius: 18px 18px 4px 18px; display: inline-block; max-width: 80%;">
              \${message}
            </div>
          \`;
          messagesContainer.appendChild(userMsg);
          
          // Simulate bot response
          setTimeout(function() {
            var botMsg = document.createElement('div');
            botMsg.innerHTML = \`
              <div style="background: white; padding: 12px 16px; border-radius: 18px 18px 18px 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); max-width: 80%; margin-bottom: 15px;">
                Thank you for your message! Our team will be in touch soon to help with your needs.
              </div>
            \`;
            messagesContainer.appendChild(botMsg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }, 1000);
          
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        var chatInput = document.getElementById('chat-input-' + chatbotConfig.id);
        var sendBtn = document.getElementById('send-btn-' + chatbotConfig.id);
        
        sendBtn.addEventListener('click', function() {
          var message = chatInput.value.trim();
          if (message) {
            sendMessage(message);
            chatInput.value = '';
          }
        });
        
        chatInput.addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            var message = this.value.trim();
            if (message) {
              sendMessage(message);
              this.value = '';
            }
          }
        });
        
        // Add CSS animations
        var style = document.createElement('style');
        style.textContent = \`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
          }
        \`;
        document.head.appendChild(style);
        
        // Append to body
        container.appendChild(chatWindow);
        container.appendChild(trigger);
        document.body.appendChild(container);
        
        // Show after delay
        setTimeout(function() {
          container.style.display = 'block';
          if (chatbotConfig.animation === 'bounce') {
            trigger.style.animation = 'bounce 0.6s ease-out';
          }
        }, chatbotConfig.delay * 1000);
        
      })();
    </script>
    <!-- End WWWWW.AI Chatbot Embed -->
  `;
  
  return embedScript.trim();
}

export function generateInstallationInstructions(embedCode: string): string {
  return `
## Installation Instructions

### Step 1: Copy the Embed Code
Copy the following code and paste it into your website's HTML, preferably just before the closing </body> tag:

\`\`\`html
${embedCode}
\`\`\`

### Step 2: Customize (Optional)
You can customize the chatbot by modifying the configuration object in the script:
- **position**: 'bottom-right', 'bottom-left', or 'center'
- **primaryColor**: Any valid CSS color (hex, rgb, etc.)
- **delay**: Number of seconds before the chatbot appears
- **animation**: 'slide-up', 'fade-in', or 'bounce'

### Step 3: Test
Visit your website and the chatbot should appear automatically after the specified delay.

### Advanced Integration
For more advanced customization and API integration, contact our support team.

### Support
If you need help with installation, contact us at support@wwwww.ai
  `.trim();
}

export function validateEmbedCode(code: string): boolean {
  return (
    code.includes('wwwww-chatbot-embed') &&
    code.includes('chatbotConfig') &&
    code.includes('document.createElement')
  );
}