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
}

const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateUserId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function EnhancedChatbot({ 
  config, 
  onLeadUpdate, 
  onConversationUpdate,
  className,
  style 
}: EnhancedChatbotProps) {
  // Core state management
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(2); // Start with WHY (index 2)
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
  const userId = useRef(generateUserId());

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

  // Topics configuration - Enhanced 5W framework
  const topics = [
    { 
      id: 'WHO', 
      title: 'Contact Info',
      question: 'How would you prefer we contact you?', 
      info: `We can reach out via phone, email, or text - whatever works best for you.`,
      icon: Phone,
      done: false,
      responses: []
    },
    { 
      id: 'WHAT', 
      title: 'Service Needed',
      question: `What ${businessInfo.industry} services do you need?`, 
      info: `We offer ${businessInfo.services}.`,
      icon: HelpCircle,
      done: false,
      responses: []
    },
    { 
      id: 'WHY', 
      title: 'Your Needs',
      question: `What specific ${businessInfo.industry} challenges are you facing?`, 
      info: `We specialize in ${businessInfo.specialties} and provide exceptional service.`,
      icon: MessageCircle,
      done: false,
      responses: []
    },
    { 
      id: 'WHERE', 
      title: 'Location',
      question: 'What area are you located in?', 
      info: `We serve ${businessInfo.serviceAreas}.`,
      icon: MapPin,
      done: false,
      responses: []
    },
    { 
      id: 'WHEN', 
      title: 'Timing',
      question: 'When do you need service?', 
      info: 'We offer flexible scheduling to meet your needs.',
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

  // Update parent components when conversation changes
  useEffect(() => {
    const allMessages = Object.values(chatAreaMessages).flat();
    if (onConversationUpdate) {
      onConversationUpdate(allMessages);
    }
  }, [chatAreaMessages, onConversationUpdate]);

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
      
      const response = await fetch('/api/chat/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          topic: topic,
          businessInfo: businessInfo,
          conversationHistory: conversationHistory
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        response: data.message || `I'd be happy to help with your ${topic.toLowerCase()} questions!`,
        nextTopic: data.nextTopic,
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
    
    // Move to next topic in sequence
    const currentIndex = topics.findIndex(t => t.id === topicId);
    const nextIndex = (currentIndex + 1) % topics.length;
    const nextTopic = topics[nextIndex];
    
    const completedArray = Array.from(completedTopics);
    if (!completedArray.includes(nextTopic.id)) {
      setTimeout(() => {
        askTopicQuestion(nextTopic.id);
      }, 1500);
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

  return (
    <Card 
      className={cn("flex flex-col h-full bg-white overflow-hidden", className)}
      style={{
        ...style,
        borderColor: config.ui.theme.primaryColor
      }}
    >
      {/* Header */}
      <div 
        className="p-4 text-white text-center"
        style={{ 
          background: `linear-gradient(135deg, ${config.ui.theme.primaryColor}, ${config.ui.theme.secondaryColor})`
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
          >
            🤖
          </div>
          <h1 className="text-lg font-semibold">{businessInfo.name}</h1>
        </div>
        <p className="text-sm opacity-90">{businessInfo.services} - {businessInfo.location}</p>
      </div>

      {/* Topic Tabs */}
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
                  "flex flex-col items-center p-3 min-w-[80px] transition-all border-b-2",
                  isActive 
                    ? "border-blue-500 bg-blue-50 text-blue-600"
                    : "border-transparent hover:bg-gray-100"
                )}
              >
                <div className="relative">
                  <Icon size={18} />
                  {isCompleted && (
                    <Check 
                      size={12} 
                      className="absolute -top-1 -right-1 text-green-500 bg-white rounded-full"
                    />
                  )}
                </div>
                <span className="text-xs font-medium mt-1">{topic.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
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
                  "max-w-[80%] p-3 rounded-lg",
                  message.type === 'user'
                    ? "text-white"
                    : "bg-gray-100 text-gray-800"
                )}
                style={message.type === 'user' ? { backgroundColor: config.ui.theme.primaryColor } : {}}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Replies */}
      {showQuickReplies && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {lastMessage.quickReplies?.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply(reply)}
                className="text-xs"
                style={{ borderColor: config.ui.theme.primaryColor, color: config.ui.theme.primaryColor }}
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <Input
            ref={inputRef}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!currentMessage.trim() || isProcessing}
            size="sm"
            style={{ backgroundColor: config.ui.theme.primaryColor }}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default EnhancedChatbot;