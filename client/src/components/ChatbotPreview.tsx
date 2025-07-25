import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, X, Send, Check, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Chatbot, ConversationMessage } from "@shared/schema";

interface ChatbotPreviewProps {
  chatbot?: Chatbot;
}

const MOCK_MESSAGES: ConversationMessage[] = [
  {
    id: "1",
    type: "bot",
    content: "Great! I understand you're looking for a CRM solution. Now let's talk timing - when are you hoping to have this implemented?",
    timestamp: new Date().toISOString(),
    topic: "when"
  }
];

const QUICK_REPLIES = [
  "Within 30 days",
  "2-3 months", 
  "Just exploring"
];

export default function ChatbotPreview({ chatbot }: ChatbotPreviewProps) {
  const [messages, setMessages] = useState<ConversationMessage[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [currentTopic, setCurrentTopic] = useState<"why" | "what" | "when" | "where" | "who">("when");

  // Mock progress - completed: why, what; active: when
  const progress = {
    why: { completed: true },
    what: { completed: true },
    when: { completed: false },
    where: { completed: false },
    who: { completed: false }
  };

  const topics = [
    { key: "why", label: "WHY", color: "bg-red-500" },
    { key: "what", label: "WHAT", color: "bg-orange-500" },
    { key: "when", label: "WHEN", color: "bg-yellow-500" },
    { key: "where", label: "WHERE", color: "bg-green-500" },
    { key: "who", label: "WHO", color: "bg-blue-500" }
  ] as const;

  const getTopicIcon = (topicKey: string) => {
    const isCompleted = progress[topicKey as keyof typeof progress]?.completed;
    const isActive = topicKey === currentTopic;
    
    if (isCompleted) {
      return <Check className="w-3 h-3" />;
    }
    if (isActive) {
      return <Clock className="w-3 h-3 animate-pulse" />;
    }
    return topics.findIndex(t => t.key === topicKey) + 1;
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: ConversationMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date().toISOString(),
      topic: currentTopic
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      setIsTyping(false);
      // TODO: Implement actual AI response
    }, 2000);
  };

  const handleQuickReply = (reply: string) => {
    setInputValue(reply);
    handleSendMessage();
  };

  if (!chatbot) {
    return (
      <div className="w-96 bg-gray-100 border-l border-gray-200 flex flex-col">
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const { size, transparentBackground, scrollMode } = chatbot.config.ui;

  const getDimensions = () => {
    switch (size) {
      case "small": return "w-72 h-96";
      case "medium": return "w-80 h-[500px]";
      case "large": return "w-96 h-[600px]";
      case "fullscreen": return "w-full h-full";
      default: return "w-80 h-96";
    }
  };

  return (
    <div className="w-96 bg-gray-100 border-l border-gray-200 flex flex-col">
      {/* Preview Header */}
      <div className="p-4 bg-white border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Live Preview</h3>
        <p className="text-sm text-gray-600">See your chatbot in action</p>
      </div>

      {/* Mock Website Container */}
      <div className="flex-1 p-4 relative">
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 relative overflow-hidden">
          {/* Fake website content */}
          <div className="p-6 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-100 rounded"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              <div className="h-3 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>

          {/* Chatbot Widget */}
          <div className={cn(
            "absolute bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden",
            getDimensions(),
            transparentBackground && "bg-opacity-95 backdrop-blur-sm"
          )}>
            {/* Chatbot Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 text-white">
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
                <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20 w-6 h-6 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* 5W Progress Tabs */}
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex space-x-1">
                {topics.map((topic, index) => {
                  const isCompleted = progress[topic.key as keyof typeof progress]?.completed;
                  const isActive = topic.key === currentTopic;
                  
                  return (
                    <div key={topic.key} className="flex-1 text-center">
                      <div className={cn(
                        "w-6 h-6 rounded-full text-xs flex items-center justify-center mx-auto mb-1 font-medium",
                        isCompleted ? `${topic.color} text-white` :
                        isActive ? `${topic.color} text-white animate-pulse` :
                        "bg-gray-300 text-gray-600"
                      )}>
                        {getTopicIcon(topic.key)}
                      </div>
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
              scrollMode ? "chat-scroll-mode" : "chat-bubble-mode"
            )}>
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-2">
                  {message.type === "bot" && (
                    <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className={cn(
                    "rounded-2xl px-3 py-2 max-w-xs",
                    message.type === "bot" 
                      ? "bg-gray-100 rounded-tl-sm" 
                      : "bg-primary-600 text-white rounded-tr-sm ml-auto"
                  )}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}

              {/* Quick Reply Options */}
              {messages.length > 0 && (
                <div className="flex flex-wrap gap-2 ml-8">
                  {QUICK_REPLIES.map((reply) => (
                    <Button
                      key={reply}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickReply(reply)}
                      className="px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full hover:bg-primary-200 border-primary-200"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              )}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                />
                <Button onClick={handleSendMessage} size="sm" className="bg-primary-600 hover:bg-primary-700">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
