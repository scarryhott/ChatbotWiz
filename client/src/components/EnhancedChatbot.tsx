import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, User, Bot, Check, Clock, MapPin, Calendar, HelpCircle, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatbotConfig {
  businessName: string;
  location: string;
  services: string;
  experience: string;
  specialties: string;
  serviceAreas: string;
  industry: string;
  phone: string;
  email: string;
  website: string;
  ui: {
    theme: {
      primaryColor: string;
      secondaryColor: string;
      textColor: string;
      backgroundColor: string;
    };
    position: string;
    animation: string;
    showTabs: boolean;
    autoStart: boolean;
  };
  conversation: {
    topics: Array<{
      id: string;
      title: string;
      question: string;
      info: string;
      icon: string;
    }>;
    flow: string;
    maxFollowUps: number;
  };
  ai: {
    model: string;
    provider: string;
    maxTokens: number;
  };
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  topic: string;
  quickReplies?: string[];
}

interface LeadData {
  name: string;
  email: string;
  phone: string;
  location: string;
  service: string;
  message: string;
  specificRequests: string;
  conversationFlow: ConversationMessage[];
  topicResponses: Record<string, any>;
  timestamp: string;
}

interface EnhancedChatbotProps {
  config: ChatbotConfig;
  onLeadUpdate?: (lead: LeadData) => void;
  onConversationUpdate?: (messages: ConversationMessage[]) => void;
  className?: string;
  style?: React.CSSProperties;
  widgetSize?: 'small' | 'medium' | 'large' | 'fullscreen';
}

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateUserId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function EnhancedChatbot({ 
  config, 
  onLeadUpdate, 
  onConversationUpdate,
  className,
  style,
  widgetSize = 'medium',
  initialConversation = [],
  sessionId: externalSessionId,
  chatbotId
}: EnhancedChatbotProps) {
  // Core state management
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(2); // Start with WHY (index 2 in WHO-WHAT-WHY-WHERE-WHEN order)
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('WHY');
  const [chatAreaMessages, setChatAreaMessages] = useState<Record<string, ConversationMessage[]>>({
    'WHO': [],
    'WHAT': [],
    'WHY': [],
    'WHERE': [],
    'WHEN': []
  });
  
  // Lead data tracking
  const [leadData, setLeadData] = useState<LeadData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    service: '',
    message: '',
    specificRequests: '',
    conversationFlow: [],
    topicResponses: {},
    timestamp: new Date().toISOString()
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const userId = useRef(generateUserId());
  const sessionId = useRef(externalSessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  // Storage key for conversation persistence
  const storageKey = `chatbot-conversation-${chatbotId || config.id || 'default'}`;

  // Business info from config
  const businessInfo = {
    name: config.businessName,
    location: config.location,
    services: config.services,
    experience: config.experience,
    specialties: config.specialties,
    serviceAreas: config.serviceAreas,
    industry: config.industry,
    phone: config.phone,
    email: config.email,
    website: config.website
  };

  // Topics configuration - Enhanced 5W framework with WHO-WHAT-WHY-WHERE-WHEN order, starting with WHY
  const topics = [
    { 
      id: 'WHO', 
      title: 'Contact Info',
      question: config.conversation?.topics?.find(t => t.id === 'WHO')?.question || 'How would you prefer we contact you?', 
      info: `We can reach out via phone, email, or text - whatever works best for you.`,
      icon: Phone,
      done: false,
      responses: []
    },
    { 
      id: 'WHAT', 
      title: 'Service Needed',
      question: config.conversation?.topics?.find(t => t.id === 'WHAT')?.question || `What ${businessInfo.industry} services do you need?`, 
      info: `We offer ${businessInfo.services}.`,
      icon: HelpCircle,
      done: false,
      responses: []
    },
    { 
      id: 'WHY', 
      title: 'Your Needs',
      question: config.conversation?.topics?.find(t => t.id === 'WHY')?.question || `What brings you here today? How can we help you?`, 
      info: `We specialize in ${businessInfo.specialties} and provide exceptional service.`,
      icon: MessageCircle,
      done: false,
      responses: []
    },
    { 
      id: 'WHERE', 
      title: 'Location',
      question: config.conversation?.topics?.find(t => t.id === 'WHERE')?.question || 'What area are you located in?', 
      info: `We serve ${businessInfo.serviceAreas}.`,
      icon: MapPin,
      done: false,
      responses: []
    },
    { 
      id: 'WHEN', 
      title: 'Timing',
      question: config.conversation?.topics?.find(t => t.id === 'WHEN')?.question || 'When would you like to schedule service?', 
      info: 'We offer flexible scheduling including mornings, afternoons, evenings, and emergency service.',
      icon: Calendar,
      done: false,
      responses: []
    }
  ];

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatAreaMessages, activeTab]);

  // Initialize conversation with helpful welcome only
  useEffect(() => {
    if (config.ui.autoStart) {
      setTimeout(() => {
        startConversation();
      }, 1000);
    }
  }, []);

  // Load conversation from localStorage only once on component mount
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  
  useEffect(() => {
    if (hasLoadedFromStorage) return;
    
    try {
      // Clean up old conversation data from previous sessions first
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chatbot-conversation-') && !key.includes(storageKey.split('-').pop() || '')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedConversation = JSON.parse(saved);
        if (parsedConversation && parsedConversation.length > 0) {
          console.log('Loaded conversation from localStorage:', parsedConversation);
          const messagesByTopic: Record<string, ConversationMessage[]> = {
            'WHO': [], 'WHAT': [], 'WHY': [], 'WHERE': [], 'WHEN': []
          };
          
          parsedConversation.forEach((msg: ConversationMessage) => {
            if (msg.topic && messagesByTopic[msg.topic]) {
              messagesByTopic[msg.topic].push(msg);
            }
          });
          
          setChatAreaMessages(messagesByTopic);
          
          // Set active tab to the last message's topic
          const lastMessage = parsedConversation[parsedConversation.length - 1];
          if (lastMessage && lastMessage.topic) {
            setActiveTab(lastMessage.topic);
          }
          
          setHasLoadedFromStorage(true);
          return;
        }
      }
      
      if (initialConversation && initialConversation.length > 0) {
        console.log('Using initial conversation:', initialConversation);
        const messagesByTopic: Record<string, ConversationMessage[]> = {
          'WHO': [], 'WHAT': [], 'WHY': [], 'WHERE': [], 'WHEN': []
        };
        
        initialConversation.forEach((msg: any) => {
          if (msg.topic && messagesByTopic[msg.topic]) {
            messagesByTopic[msg.topic].push(msg);
          }
        });
        
        setChatAreaMessages(messagesByTopic);
      }
      
      setHasLoadedFromStorage(true);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setHasLoadedFromStorage(true);
    }
  }, [storageKey, initialConversation, hasLoadedFromStorage]);

  // Update parent components when conversation changes and save to localStorage
  useEffect(() => {
    // Only save after initial load to prevent flashing
    if (!hasLoadedFromStorage) return;
    
    const allMessages = Object.values(chatAreaMessages).flat();
    console.log('EnhancedChatbot saving messages:', allMessages);
    
    // Only call onConversationUpdate and save if we have messages
    if (onConversationUpdate) {
      onConversationUpdate(allMessages);
    }
    
    // Save to localStorage only if we have actual messages
    try {
      if (allMessages.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(allMessages));
        console.log('Conversation saved to localStorage');
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }, [chatAreaMessages, onConversationUpdate, storageKey, hasLoadedFromStorage]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end',
          inline: 'nearest'
        });
      }
    };
    
    // Small delay to ensure DOM is updated
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [chatAreaMessages, activeTab]);

  const startConversation = useCallback(() => {
    const welcomeMessage: ConversationMessage = {
      id: generateMessageId(),
      type: 'bot',
      content: `Hi! I'm here to help with ${businessInfo.services} in ${businessInfo.serviceAreas}. Whether you're looking for ${businessInfo.specialties} or have questions about our services, I'm here to assist. What can I help you with today?`,
      timestamp: new Date().toISOString(),
      topic: 'WHY',
      quickReplies: [
        'Tell me about your services',
        'I have a specific need',
        'What areas do you serve?',
        'How can you help me?'
      ]
    };

    setChatAreaMessages(prev => ({
      ...prev,
      'WHY': [welcomeMessage]
    }));

    // Don't ask questions immediately - let user lead the conversation
  }, [businessInfo]);

  // Remove rigid topic questioning - let AI handle conversation flow naturally

  const callGeminiAPI = async (userMessage: string, topic: string): Promise<{ response: string; nextTopic?: string; isComplete?: boolean }> => {
    try {
      setIsProcessing(true);
      
      const conversationHistory = chatAreaMessages[topic] || [];
      const chatbotId = config.id || 'demo-chatbot-1';
      console.log('Sending chat request with chatbotId:', chatbotId, 'config.id:', config.id);
      
      const response = await fetch('/api/chat/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          topic: topic,
          businessInfo: businessInfo,
          conversationHistory: conversationHistory,
          chatbotId: chatbotId,
          sessionId: sessionId.current
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        response: data.message || `I'd be happy to help with your ${topic.toLowerCase()} questions!`,
        nextTopic: data.suggestedTab || data.nextTopic,
        isComplete: data.isTopicComplete
      };
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return {
        response: `I'd be happy to help! Our team at ${businessInfo.name} can provide detailed information about your ${businessInfo.industry} needs.`
      };
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isProcessing) return;

    const userMessage: ConversationMessage = {
      id: generateMessageId(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date().toISOString(),
      topic: activeTab
    };

    // Add user message to current tab
    setChatAreaMessages(prev => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), userMessage]
    }));

    setCurrentMessage('');
    setIsTyping(true);

    try {
      // Get AI response
      const aiResponse = await callGeminiAPI(userMessage.content, activeTab);
      
      // Switch topic FIRST if AI suggests it, then create response in new topic
      let responseTab = activeTab;
      if (aiResponse.nextTopic && aiResponse.nextTopic !== activeTab) {
        responseTab = aiResponse.nextTopic;
        setActiveTab(aiResponse.nextTopic);
        console.log(`LLM suggests switching from ${activeTab} to ${aiResponse.nextTopic}`);
      }
      
      // Create bot response in the correct topic tab
      const botMessage: ConversationMessage = {
        id: generateMessageId(),
        type: 'bot',
        content: aiResponse.response,
        timestamp: new Date().toISOString(),
        topic: responseTab
      };

      setChatAreaMessages(prev => ({
        ...prev,
        [responseTab]: [...(prev[responseTab] || []), botMessage]
      }));

      // Update lead data
      const updatedLeadData = {
        ...leadData,
        conversationFlow: [...leadData.conversationFlow, userMessage, botMessage],
        topicResponses: {
          ...leadData.topicResponses,
          [activeTab]: [...(leadData.topicResponses[activeTab] || []), userMessage.content]
        }
      };
      
      setLeadData(updatedLeadData);
      
      if (onLeadUpdate) {
        onLeadUpdate(updatedLeadData);
      }

      // Mark topic complete if AI suggests it
      if (aiResponse.isComplete) {
        setTimeout(() => {
          markTopicComplete(activeTab);
        }, 1500);
      }

    } catch (error) {
      console.error('Error processing message:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const markTopicComplete = (topicId: string) => {
    setCompletedTopics(prev => new Set(Array.from(prev).concat([topicId])));
    
    // Update Firebase topic completion
    updateFirebaseTopic(topicId, userId.current);
    
    // Let AI handle topic progression naturally - no automatic next topic questions
  };

  const updateFirebaseTopic = async (topicId: string, userId: string) => {
    try {
      await fetch('/api/firebase/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          topicId,
          completed: true,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.error('Error updating Firebase topic:', error);
    }
  };

  const handleTabClick = (topicId: string) => {
    setActiveTab(topicId);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickReply = (reply: string) => {
    setCurrentMessage(reply);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const currentMessages = chatAreaMessages[activeTab] || [];
  const lastMessage = currentMessages[currentMessages.length - 1];
  const showQuickReplies = lastMessage?.type === 'bot' && lastMessage.quickReplies;

  // Get size-specific styles for content scaling
  const getSizeStyles = () => {
    switch (widgetSize) {
      case 'small':
        return {
          fontSize: '12px',
          headerPadding: 'p-2',
          messagePadding: 'p-2',
          inputPadding: 'p-2',
          headerHeight: 'h-10',
          messageSize: 'text-xs',
          inputSize: 'text-xs',
          buttonSize: 'text-xs px-2 py-1'
        };
      case 'large':
        return {
          fontSize: '16px',
          headerPadding: 'p-4',
          messagePadding: 'p-4',
          inputPadding: 'p-4',
          headerHeight: 'h-16',
          messageSize: 'text-base',
          inputSize: 'text-base',
          buttonSize: 'text-sm px-4 py-2'
        };
      case 'fullscreen':
        return {
          fontSize: '18px',
          headerPadding: 'p-6',
          messagePadding: 'p-6',
          inputPadding: 'p-6',
          headerHeight: 'h-20',
          messageSize: 'text-lg',
          inputSize: 'text-lg',
          buttonSize: 'text-base px-6 py-3'
        };
      default: // medium
        return {
          fontSize: '14px',
          headerPadding: 'p-3',
          messagePadding: 'p-3',
          inputPadding: 'p-3',
          headerHeight: 'h-12',
          messageSize: 'text-sm',
          inputSize: 'text-sm',
          buttonSize: 'text-sm px-3 py-2'
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <Card 
      className={cn("flex flex-col h-full bg-white overflow-hidden", className)}
      style={{
        ...style,
        borderColor: config.ui.theme.primaryColor,
        fontSize: sizeStyles.fontSize,
        position: 'relative'
      }}
    >


      {/* Topic Tabs - Scalable */}
      {config.ui.showTabs && (
        <div className="flex bg-gray-50 border-b overflow-x-auto">
          {topics.map((topic) => {
            const Icon = topic.icon;
            const isActive = activeTab === topic.id;
            const completedArray = Array.from(completedTopics);
            const isCompleted = completedArray.includes(topic.id);
            
            return (
              <button
                key={topic.id}
                onClick={() => handleTabClick(topic.id)}
                className={cn(
                  `flex flex-col items-center ${sizeStyles.messagePadding} ${widgetSize === 'small' ? 'min-w-[60px]' : widgetSize === 'large' || widgetSize === 'fullscreen' ? 'min-w-[100px]' : 'min-w-[80px]'} transition-all border-b-2`,
                  isActive 
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-transparent hover:bg-gray-100"
                )}
              >
                <div className="relative">
                  {isCompleted ? (
                    <div className={`${widgetSize === 'small' ? 'w-4 h-4' : widgetSize === 'large' || widgetSize === 'fullscreen' ? 'w-8 h-8' : 'w-6 h-6'} bg-green-500 text-white rounded-full flex items-center justify-center`}>
                      <Check size={widgetSize === 'small' ? 10 : widgetSize === 'large' || widgetSize === 'fullscreen' ? 18 : 14} />
                    </div>
                  ) : (
                    <Icon 
                      size={widgetSize === 'small' ? 14 : widgetSize === 'large' || widgetSize === 'fullscreen' ? 22 : 18} 
                      className={cn(
                        "transition-colors",
                        isActive ? "text-blue-600" : "text-gray-600"
                      )}
                    />
                  )}
                </div>
                <span className={`${widgetSize === 'small' ? 'text-xs' : sizeStyles.messageSize} font-medium mt-1`}>{topic.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages Area - Scalable */}
      <div className={`flex-1 overflow-hidden ${sizeStyles.messagePadding}`}>
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className={`${widgetSize === 'small' ? 'space-y-2' : widgetSize === 'large' || widgetSize === 'fullscreen' ? 'space-y-6' : 'space-y-4'} pb-4`}>
          {currentMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.type === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  `max-w-[80%] ${sizeStyles.messagePadding} rounded-lg`,
                  message.type === 'user'
                    ? "text-white"
                    : "bg-gray-100 text-gray-800"
                )}
                style={message.type === 'user' ? { backgroundColor: config.ui.theme.primaryColor } : {}}
              >
                <p className={`${sizeStyles.messageSize} leading-relaxed`}>{message.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className={`bg-gray-100 ${sizeStyles.messagePadding} rounded-lg`}>
                <div className="flex space-x-1">
                  <div className={`${widgetSize === 'small' ? 'w-1.5 h-1.5' : widgetSize === 'large' || widgetSize === 'fullscreen' ? 'w-3 h-3' : 'w-2 h-2'} bg-gray-400 rounded-full animate-bounce`} />
                  <div className={`${widgetSize === 'small' ? 'w-1.5 h-1.5' : widgetSize === 'large' || widgetSize === 'fullscreen' ? 'w-3 h-3' : 'w-2 h-2'} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }} />
                  <div className={`${widgetSize === 'small' ? 'w-1.5 h-1.5' : widgetSize === 'large' || widgetSize === 'fullscreen' ? 'w-3 h-3' : 'w-2 h-2'} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
            {/* Invisible element to scroll to */}
            <div 
              ref={messagesEndRef} 
              className="h-1 w-1" 
              style={{ minHeight: '1px' }}
            />
          </div>
        </ScrollArea>
      </div>

      {/* Quick Replies - Scalable */}
      {showQuickReplies && (
        <div className={`px-4 pb-2`}>
          <div className="flex flex-wrap gap-1">
            {lastMessage.quickReplies?.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply(reply)}
                className={`${sizeStyles.buttonSize}`}
                style={{ borderColor: config.ui.theme.primaryColor, color: config.ui.theme.primaryColor }}
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Scalable */}
      <div className={`${sizeStyles.inputPadding} border-t bg-gray-50 flex-shrink-0`}>
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={isProcessing}
            className={`flex-1 ${sizeStyles.inputSize}`}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isProcessing}
            size="sm"
            className={`${sizeStyles.buttonSize}`}
            style={{ backgroundColor: config.ui.theme.primaryColor }}
          >
            <Send size={widgetSize === 'small' ? 12 : widgetSize === 'large' || widgetSize === 'fullscreen' ? 20 : 16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default EnhancedChatbot;