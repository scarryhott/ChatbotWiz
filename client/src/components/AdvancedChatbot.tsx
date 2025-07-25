import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, X, Send, Check, Clock, Circle, MessageSquare, HelpCircle, Target, Package, MapPin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Chatbot } from "@shared/schema";

interface ConversationMessage {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: string;
  topic: string;
}

interface Topic {
  id: string;
  title: string;
  question: string;
  info: string;
  done: boolean;
  responses: any[];
  icon: any;
}

interface ConversationState {
  currentFlow: string;
  purpose: string | null;
  serviceNeeded: string | null;
  timing: string | null;
  location: string | null;
  contactInfo: {
    phone: string | null;
    email: string | null;
    preferred: string | null;
  };
  conversationHistory: Array<{role: string; content: string}>;
  sessionId: string;
  timestamp: string;
}

interface LeadData {
  name: string;
  email: string;
  phone: string;
  location: string;
  service: string;
  message: string;
  purpose: string;
  specificRequests: string;
  contextSummary: string;
  conversationFlow: any[];
  topicResponses: any;
  timestamp: string;
  completedAt?: string;
  conversationHistory?: any[];
}

interface AdvancedChatbotProps {
  chatbot: Chatbot;
  onLeadUpdate?: (leadData: any) => void;
}

export default function AdvancedChatbot({ chatbot, onLeadUpdate }: AdvancedChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  
  // Conversation flow states
  const [waitingForQuestionResponse, setWaitingForQuestionResponse] = useState(false);
  const [waitingForTopicInfo, setWaitingForTopicInfo] = useState(false);
  const [answeringTopicQuestion, setAnsweringTopicQuestion] = useState(false);
  
  // Rate limiting
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  const messageDebounceMs = 1000;
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Business info from chatbot config
  const businessInfo = {
    name: chatbot.config.company?.name || chatbot.name,
    services: chatbot.config.company?.knowledgeBase || 'professional services',
    ethos: chatbot.config.company?.ethos || 'quality service and customer satisfaction',
    location: 'local area',
    experience: 'experienced professionals'
  };

  // 5W Topics - Starting with WHY as requested
  const topics: Topic[] = [
    {
      id: 'WHY',
      title: 'Purpose',
      question: 'What brings you here today?',
      info: `I'm here to help you learn about ${businessInfo.name} and connect you with our team for personalized assistance.`,
      done: false,
      responses: [],
      icon: HelpCircle
    },
    {
      id: 'WHAT',
      title: 'Service',
      question: 'What specific service are you interested in?',
      info: `Our services include ${businessInfo.services} with focus on ${businessInfo.ethos}.`,
      done: false,
      responses: [],
      icon: Package
    },
    {
      id: 'WHEN',
      title: 'Timing',
      question: 'When are you looking to have this service done?',
      info: 'We offer flexible scheduling including same-day service, regular maintenance, and emergency support.',
      done: false,
      responses: [],
      icon: Clock
    },
    {
      id: 'WHERE',
      title: 'Location',
      question: 'What area are you located in?',
      info: `We serve ${businessInfo.location} and surrounding areas with local expertise.`,
      done: false,
      responses: [],
      icon: MapPin
    },
    {
      id: 'WHO',
      title: 'Contact',
      question: 'What\'s the best way to contact you - phone or email?',
      info: 'We provide personalized attention and can reach you via phone or email based on your preference.',
      done: false,
      responses: [],
      icon: Phone
    }
  ];

  // Conversation state
  const [conversationState, setConversationState] = useState<ConversationState>({
    currentFlow: 'initial',
    purpose: null,
    serviceNeeded: null,
    timing: null,
    location: null,
    contactInfo: {
      phone: null,
      email: null,
      preferred: null
    },
    conversationHistory: [],
    sessionId: `wwwwwai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  });

  // Lead data state
  const [leadData, setLeadData] = useState<LeadData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    service: '',
    message: '',
    purpose: '',
    specificRequests: '',
    contextSummary: '',
    conversationFlow: [],
    topicResponses: {},
    timestamp: new Date().toISOString()
  });

  // Auto-trigger popup based on configuration
  useEffect(() => {
    if (chatbot.config.popupTrigger?.enabled) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        startConversation();
      }, (chatbot.config.popupTrigger?.delay || 5) * 1000);

      return () => clearTimeout(timer);
    }
  }, [chatbot]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start conversation with welcome and first topic
  const startConversation = () => {
    if (conversationStarted) return;
    
    const welcomeMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "bot",
      content: `👋 Hi! I'm here to help you learn about ${businessInfo.name} and understand your service needs. I'll ask you a few questions to see how we can help.`,
      timestamp: new Date().toISOString(),
      topic: "initial"
    };
    
    setMessages([welcomeMessage]);
    setConversationStarted(true);
    
    // Start with first topic (WHY) after brief delay
    setTimeout(() => {
      startTopicDiscussion(0);
    }, 2000);
  };

  // Start discussion about a topic
  const startTopicDiscussion = (topicIndex: number) => {
    const topic = topics[topicIndex];
    if (!topic) return;
    
    setIsTyping(false);
    
    // Add topic info message
    const topicInfoMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "bot",
      content: topic.info,
      timestamp: new Date().toISOString(),
      topic: topic.id
    };
    
    setMessages(prev => [...prev, topicInfoMessage]);
    
    // Ask if they have questions about this topic
    setTimeout(() => {
      const questionMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: "bot",
        content: `Any questions about ${topic.title.toLowerCase()}?`,
        timestamp: new Date().toISOString(),
        topic: topic.id
      };
      
      setMessages(prev => [...prev, questionMessage]);
      setQuickReplies(['No questions', 'Yes, I have a question']);
      setWaitingForQuestionResponse(true);
    }, 1500);
  };

  // Chat mutation for API calls
  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; topic: string; history: ConversationMessage[] }) => {
      const response = await apiRequest('POST', '/api/chat', {
        message: data.message,
        chatbotId: chatbot.id,
        currentTopic: data.topic,
        conversationHistory: data.history
      });
      return await response.json();
    },
    onSuccess: (response) => {
      setIsTyping(false);
      
      if (response.message) {
        const botMessage: ConversationMessage = {
          id: Date.now().toString(),
          type: "bot",
          content: response.message,
          timestamp: new Date().toISOString(),
          topic: topics[currentTopicIndex]?.id || 'general'
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    },
    onError: (error) => {
      console.error('Chat API Error:', error);
      setIsTyping(false);
      
      const errorMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: "I'm sorry, I'm having trouble processing your message. Please try again.",
        timestamp: new Date().toISOString(),
        topic: topics[currentTopicIndex]?.id || 'general'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  // Handle sending messages
  const handleSend = () => {
    if (isProcessing || !inputValue.trim()) return;
    
    const now = Date.now();
    if (now - lastMessageTime < messageDebounceMs) return;
    
    handleUserMessage(inputValue.trim());
    setInputValue("");
  };

  // Handle user messages
  const handleUserMessage = async (message: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setLastMessageTime(Date.now());
    
    // Add user message
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date().toISOString(),
      topic: topics[currentTopicIndex]?.id || 'general'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuickReplies([]);
    setIsTyping(true);
    
    // Update conversation history
    setConversationState(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, {role: 'user', content: message}]
    }));
    
    try {
      if (conversationComplete) {
        await handlePostConversationMessage(message);
      } else {
        await handleTopicBasedConversation(message);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      setIsTyping(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle topic-based conversation flow
  const handleTopicBasedConversation = async (message: string) => {
    const currentTopic = topics[currentTopicIndex];
    
    if (!currentTopic) {
      await completeConversationAndSaveLead();
      return;
    }
    
    if (waitingForQuestionResponse) {
      await handleQuestionResponse(message);
    } else if (answeringTopicQuestion) {
      await handleTopicQuestion(message);
    } else if (waitingForTopicInfo) {
      await handleTopicInfoResponse(message, currentTopic);
    } else {
      setIsTyping(false);
      const botMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: "Let me ask you about our services step by step.",
        timestamp: new Date().toISOString(),
        topic: currentTopic.id
      };
      setMessages(prev => [...prev, botMessage]);
    }
  };

  // Handle response to "Any questions about [topic]?"
  const handleQuestionResponse = async (message: string) => {
    setWaitingForQuestionResponse(false);
    const hasQuestions = message.toLowerCase().includes('yes') || 
                       message.toLowerCase().includes('question') ||
                       !message.toLowerCase().includes('no');
    
    setIsTyping(false);
    
    if (hasQuestions) {
      const botMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: "What would you like to know?",
        timestamp: new Date().toISOString(),
        topic: topics[currentTopicIndex].id
      };
      setMessages(prev => [...prev, botMessage]);
      setAnsweringTopicQuestion(true);
    } else {
      await gatherTopicInformation();
    }
  };

  // Handle user's topic question
  const handleTopicQuestion = async (message: string) => {
    setAnsweringTopicQuestion(false);
    
    // Try to get AI response via mutation
    try {
      await chatMutation.mutateAsync({
        message,
        topic: topics[currentTopicIndex].id,
        history: messages
      });
      
      // Ask if they have more questions
      setTimeout(() => {
        const botMessage: ConversationMessage = {
          id: Date.now().toString(),
          type: "bot",
          content: "Any other questions about this topic?",
          timestamp: new Date().toISOString(),
          topic: topics[currentTopicIndex].id
        };
        setMessages(prev => [...prev, botMessage]);
        setQuickReplies(['No more questions', 'Another question']);
        setWaitingForQuestionResponse(true);
      }, 2000);
    } catch (error) {
      setIsTyping(false);
      const botMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: "Great question! Our team can provide detailed information about that.",
        timestamp: new Date().toISOString(),
        topic: topics[currentTopicIndex].id
      };
      setMessages(prev => [...prev, botMessage]);
      await gatherTopicInformation();
    }
  };

  // Gather user's information for current topic
  const gatherTopicInformation = async () => {
    const currentTopic = topics[currentTopicIndex];
    setIsTyping(false);
    
    const questionMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "bot",
      content: currentTopic.question,
      timestamp: new Date().toISOString(),
      topic: currentTopic.id
    };
    
    setMessages(prev => [...prev, questionMessage]);
    setWaitingForTopicInfo(true);
  };

  // Handle user's response to topic information request
  const handleTopicInfoResponse = async (message: string, topic: Topic) => {
    setWaitingForTopicInfo(false);
    
    // Store information based on topic
    const newConversationState = { ...conversationState };
    const newLeadData = { ...leadData };
    
    switch(topic.id) {
      case 'WHY':
        newConversationState.purpose = message;
        newLeadData.purpose = message;
        break;
      case 'WHAT':
        newConversationState.serviceNeeded = message;
        newLeadData.service = message;
        break;
      case 'WHEN':
        newConversationState.timing = message;
        newLeadData.message += `Timing: ${message}. `;
        break;
      case 'WHERE':
        newConversationState.location = message;
        newLeadData.location = message;
        break;
      case 'WHO':
        // Extract contact info
        const emailMatch = message.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
        const phoneMatch = message.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
        
        if (emailMatch) {
          newConversationState.contactInfo.email = emailMatch[0];
          newConversationState.contactInfo.preferred = 'email';
          newLeadData.email = emailMatch[0];
        } else if (phoneMatch) {
          newConversationState.contactInfo.phone = phoneMatch[0];
          newConversationState.contactInfo.preferred = 'phone';
          newLeadData.phone = phoneMatch[0];
        } else {
          newConversationState.contactInfo.preferred = message;
        }
        break;
    }
    
    setConversationState(newConversationState);
    setLeadData(newLeadData);
    
    // Mark topic as complete
    topics[currentTopicIndex].done = true;
    setCurrentTopicIndex(prev => prev + 1);
    
    setIsTyping(false);
    const confirmMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "bot",
      content: "Perfect! Let me ask about the next aspect.",
      timestamp: new Date().toISOString(),
      topic: topic.id
    };
    
    setMessages(prev => [...prev, confirmMessage]);
    
    // Check if more topics or complete conversation
    if (currentTopicIndex + 1 >= topics.length) {
      setTimeout(() => {
        completeConversationAndSaveLead();
      }, 1000);
    } else {
      setTimeout(() => {
        startTopicDiscussion(currentTopicIndex + 1);
      }, 1000);
    }
  };

  // Complete conversation and save lead
  const completeConversationAndSaveLead = async () => {
    if (conversationComplete) return;
    
    setConversationComplete(true);
    setIsTyping(false);
    
    // Add completion data
    const finalLeadData = {
      ...leadData,
      completedAt: new Date().toISOString(),
      conversationHistory: conversationState.conversationHistory,
      sessionId: conversationState.sessionId
    };
    
    // Call onLeadUpdate if provided
    if (onLeadUpdate) {
      onLeadUpdate(finalLeadData);
    }
    
    const completionMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "bot",
      content: `Perfect! I have all the information I need. One of our ${businessInfo.name} experts will be in touch shortly to discuss your needs.`,
      timestamp: new Date().toISOString(),
      topic: "complete"
    };
    
    setMessages(prev => [...prev, completionMessage]);
    setQuickReplies(['Thank you', 'I have another question']);
  };

  // Handle messages after conversation is complete
  const handlePostConversationMessage = async (message: string) => {
    setIsTyping(false);
    
    if (message.toLowerCase().includes('question') || message.toLowerCase().includes('help')) {
      // Try to get AI response for additional questions
      try {
        await chatMutation.mutateAsync({
          message,
          topic: 'general',
          history: messages
        });
      } catch (error) {
        const helpMessage: ConversationMessage = {
          id: Date.now().toString(),
          type: "bot",
          content: "I'd be happy to help! Our team can provide detailed information.",
          timestamp: new Date().toISOString(),
          topic: "general"
        };
        setMessages(prev => [...prev, helpMessage]);
      }
    } else {
      const thankYouMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: `Thank you! We look forward to helping you with your ${businessInfo.services}. Have a great day!`,
        timestamp: new Date().toISOString(),
        topic: "general"
      };
      setMessages(prev => [...prev, thankYouMessage]);
      setQuickReplies(['Contact us again', 'Visit our website']);
    }
  };

  // Handle quick reply clicks
  const handleQuickReply = (reply: string) => {
    handleUserMessage(reply);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => {
          setIsOpen(true);
          if (!conversationStarted) startConversation();
        }}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50"
        style={{ backgroundColor: chatbot.config.ui?.theme?.primaryColor || '#3b82f6' }}
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[500px] shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b rounded-t-lg text-white"
        style={{ backgroundColor: chatbot.config.ui?.theme?.primaryColor || '#3b82f6' }}
      >
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5" />
          <span className="font-medium">{chatbot.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Topic Progress Indicators */}
          <div className="flex space-x-1">
            {topics.map((topic, index) => {
              const Icon = topic.icon;
              const isActive = index === currentTopicIndex;
              const isCompleted = topic.done;
              
              return (
                <div key={topic.id} className="relative">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    isCompleted ? "bg-green-500" : isActive ? "bg-white/20" : "bg-white/10"
                  )}>
                    {isCompleted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Icon className="w-3 h-3" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.type === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg p-3 text-sm",
                message.type === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-800"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {/* Quick Replies */}
        {quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply(reply)}
                className="text-xs"
                disabled={isProcessing}
              >
                {reply}
              </Button>
            ))}
          </div>
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            disabled={isProcessing}
            className="flex-1"
          />
          <Button 
            onClick={handleSend}
            disabled={isProcessing || !inputValue.trim()}
            style={{ backgroundColor: chatbot.config.ui?.theme?.primaryColor || '#3b82f6' }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}