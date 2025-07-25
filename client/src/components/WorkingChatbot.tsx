import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, X, Send, Check, Clock, Circle, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Chatbot, ConversationMessage, FiveWProgress } from "@shared/schema";

interface WorkingChatbotProps {
  chatbot: Chatbot;
  onLeadUpdate?: (leadData: any) => void;
}

const TOPICS = [
  { key: "why", label: "WHY", description: "Purpose & Goals", color: "bg-red-500" },
  { key: "what", label: "WHAT", description: "Products & Services", color: "bg-orange-500" }, 
  { key: "when", label: "WHEN", description: "Timeline & Urgency", color: "bg-yellow-500" },
  { key: "where", label: "WHERE", description: "Location & Scope", color: "bg-green-500" },
  { key: "who", label: "WHO", description: "Decision Makers", color: "bg-blue-500" }
] as const;

export default function WorkingChatbot({ chatbot, onLeadUpdate }: WorkingChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<"why" | "what" | "when" | "where" | "who">("why");
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [progress, setProgress] = useState<FiveWProgress>({
    why: { completed: false },
    what: { completed: false },
    when: { completed: false },
    where: { completed: false },
    who: { completed: false }
  });
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Auto-trigger popup based on configuration
  useEffect(() => {
    if (chatbot.config.popupTrigger?.enabled) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        // Send initial WHY message
        const initialMessage: ConversationMessage = {
          id: Date.now().toString(),
          type: "bot",
          content: chatbot.config.popupTrigger?.message || "Hello! How can I help you today?",
          timestamp: new Date().toISOString(),
          topic: "why"
        };
        setMessages([initialMessage]);
        
        // Generate quick replies for WHY topic
        setQuickReplies([
          "I'm exploring solutions",
          "I have a specific need",
          "Just browsing for now"
        ]);
      }, (chatbot.config.popupTrigger?.delay || 5) * 1000);

      return () => clearTimeout(timer);
    }
  }, [chatbot]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; topic: string; history: ConversationMessage[] }) => {
      return apiRequest(`/api/chat`, {
        method: "POST",
        body: JSON.stringify({
          message: data.message,
          chatbotId: chatbot.id,
          currentTopic: data.topic,
          conversationHistory: data.history
        })
      });
    },
    onSuccess: (response) => {
      setIsTyping(false);
      
      // Add bot response
      const botMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: "bot",
        content: response.message,
        timestamp: new Date().toISOString(),
        topic: currentTopic
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Handle topic switching
      if (response.nextTopic && response.nextTopic !== currentTopic) {
        setCurrentTopic(response.nextTopic);
        markTopicCompleted(currentTopic);
      }
      
      // Handle topic completion
      if (response.isTopicComplete) {
        markTopicCompleted(currentTopic);
      }
      
      // Update quick replies
      setQuickReplies(response.quickReplies || []);
      
      // End conversation if complete
      if (response.shouldEndConversation) {
        handleConversationEnd();
      }
    }
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/chatbots/${chatbot.id}/leads`, {
        method: "POST",
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots", chatbot.id, "leads"] });
      onLeadUpdate?.(leadData);
    }
  });

  const markTopicCompleted = (topic: "why" | "what" | "when" | "where" | "who") => {
    setProgress(prev => ({
      ...prev,
      [topic]: { ...prev[topic], completed: true }
    }));
    
    // Create/update Firebase topic tracking
    // This would integrate with your Firebase backend for notifications
  };

  const handleSendMessage = (message?: string) => {
    const messageToSend = message || inputValue.trim();
    if (!messageToSend) return;

    // Add user message
    const userMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "user", 
      content: messageToSend,
      timestamp: new Date().toISOString(),
      topic: currentTopic
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue("");
    setIsTyping(true);
    setQuickReplies([]);

    // Send to AI for response
    chatMutation.mutate({
      message: messageToSend,
      topic: currentTopic,
      history: updatedMessages
    });
  };

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply);
  };

  const handleTabClick = (topic: "why" | "what" | "when" | "where" | "who") => {
    // Allow switching between topics
    setCurrentTopic(topic);
    
    // Add context message about topic switch
    const switchMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "bot",
      content: `Let's talk about ${topic.toUpperCase()}. ${chatbot.config.topics[topic].question}`,
      timestamp: new Date().toISOString(),
      topic: topic
    };
    
    setMessages(prev => [...prev, switchMessage]);
  };

  const handleConversationEnd = () => {
    // Create lead if we have meaningful data
    if (Object.values(progress).some(p => p.completed)) {
      const leadPayload = {
        chatbotId: chatbot.id,
        fiveWProgress: progress,
        conversationHistory: messages,
        contextSummary: generateContextSummary(),
        currentTopic: currentTopic,
        isCompleted: Object.values(progress).every(p => p.completed)
      };
      
      setLeadData(leadPayload);
      createLeadMutation.mutate(leadPayload);
    }
  };

  const generateContextSummary = (): string => {
    const completedTopics = Object.entries(progress)
      .filter(([_, data]) => data.completed)
      .map(([topic, _]) => topic);
    
    if (completedTopics.length === 0) return "User engaged but no topics completed";
    
    return `User engaged with ${completedTopics.join(", ")} topics. ${messages.length} messages exchanged.`;
  };

  const getTopicIcon = (topicKey: string) => {
    const isCompleted = progress[topicKey as keyof typeof progress]?.completed;
    const isActive = topicKey === currentTopic;
    
    if (isCompleted) {
      return <Check className="w-3 h-3" />;
    }
    if (isActive) {
      return <Clock className="w-3 h-3 animate-pulse" />;
    }
    return <Circle className="w-3 h-3" />;
  };

  const getDimensions = () => {
    const size = chatbot.config.ui?.size || "medium";
    switch (size) {
      case "small": return "w-72 h-96";
      case "medium": return "w-80 h-[500px]";
      case "large": return "w-96 h-[600px]"; 
      case "fullscreen": return "w-full h-full";
      default: return "w-80 h-96";
    }
  };

  const getPosition = () => {
    const position = chatbot.config.ui?.position || "bottom-right";
    switch (position) {
      case "bottom-left": return "bottom-6 left-6";
      case "center": return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
      case "custom": return "bottom-6 right-6"; // default fallback
      default: return "bottom-6 right-6";
    }
  };

  if (!isOpen) {
    return (
      <div className={`fixed ${getPosition()} z-50`}>
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg"
          style={{ backgroundColor: chatbot.config.ui?.theme?.primaryColor || "#3b82f6" }}
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed ${getPosition()} z-50`}>
      <Card className={cn(
        "flex flex-col overflow-hidden shadow-2xl border-0",
        getDimensions(),
        chatbot.config.ui?.transparentBackground && "bg-opacity-95 backdrop-blur-sm"
      )} style={{
        backgroundColor: chatbot.config.ui?.theme?.backgroundColor || "#ffffff",
        borderRadius: `${chatbot.config.ui?.theme?.borderRadius || 8}px`
      }}>
        {/* Header */}
        <div 
          className="p-4 text-white"
          style={{ backgroundColor: chatbot.config.ui.theme.primaryColor }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{chatbot.name}</h4>
                <div className="flex items-center space-x-1 text-xs opacity-90">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 w-6 h-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* 5W Progress Tabs */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex space-x-1">
            {TOPICS.map((topic) => {
              const isCompleted = progress[topic.key as keyof typeof progress]?.completed;
              const isActive = topic.key === currentTopic;
              
              return (
                <div key={topic.key} className="flex-1 text-center">
                  <button
                    onClick={() => handleTabClick(topic.key as any)}
                    className={cn(
                      "w-6 h-6 rounded-full text-xs flex items-center justify-center mx-auto mb-1 font-medium transition-colors",
                      isCompleted ? `${topic.color} text-white tab-completed` :
                      isActive ? `${topic.color} text-white animate-pulse` :
                      "bg-gray-300 text-gray-600 hover:bg-gray-400"
                    )}
                  >
                    {getTopicIcon(topic.key)}
                  </button>
                  <span className={cn(
                    "text-xs font-medium",
                    isActive ? "text-yellow-600" : "text-gray-600"
                  )}>
                    {topic.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Messages */}
        <div className={cn(
          "flex-1 p-4 space-y-3 overflow-y-auto",
          chatbot.config.ui.scrollMode ? "chat-scroll-mode" : "chat-bubble-mode"
        )}>
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-2">
              {message.type === "bot" && (
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: chatbot.config.ui.theme.primaryColor }}
                >
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={cn(
                "rounded-2xl px-3 py-2 max-w-xs",
                message.type === "bot" 
                  ? "bg-gray-100 rounded-tl-sm" 
                  : `text-white rounded-tr-sm ml-auto`
              )} style={message.type === "user" ? { 
                backgroundColor: chatbot.config.ui.theme.primaryColor 
              } : {}}>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}

          {/* Quick Reply Options */}
          {quickReplies.length > 0 && !isTyping && (
            <div className="flex flex-wrap gap-2 ml-8">
              {quickReplies.map((reply, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickReply(reply)}
                  className="px-3 py-1 text-xs rounded-full hover:bg-opacity-80"
                  style={{ 
                    backgroundColor: chatbot.config.ui.theme.secondaryColor,
                    color: chatbot.config.ui.theme.primaryColor,
                    borderColor: chatbot.config.ui.theme.primaryColor
                  }}
                >
                  {reply}
                </Button>
              ))}
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start space-x-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: chatbot.config.ui.theme.primaryColor }}
              >
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping}
            />
            <Button 
              onClick={() => handleSendMessage()} 
              size="sm" 
              disabled={isTyping || !inputValue.trim()}
              style={{ backgroundColor: chatbot.config.ui.theme.primaryColor }}
              className="hover:opacity-90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}