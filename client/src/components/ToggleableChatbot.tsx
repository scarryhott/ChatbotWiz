import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';
import { EnhancedChatbot } from './EnhancedChatbot';
interface ChatbotConfig {
  businessName?: string;
  industry?: string;
  services?: string;
  location?: string;
  ui?: {
    size?: 'small' | 'medium' | 'large' | 'fullscreen';
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      textColor?: string;
      backgroundColor?: string;
      borderRadius?: number;
    };
  };
}

interface ToggleableChatbotProps {
  config: ChatbotConfig;
  chatbotId?: string;
  onLeadUpdate?: (leadData: any) => void;
  onConversationUpdate?: (messages: any[]) => void;
  position?: 'bottom-right' | 'bottom-left' | 'center';
  autoOpen?: boolean;
  className?: string;
  previewMode?: 'desktop' | 'mobile' | 'fullscreen';
}

export function ToggleableChatbot({
  config,
  chatbotId,
  onLeadUpdate,
  onConversationUpdate,
  position = 'bottom-right',
  autoOpen = false,
  className = '',
  previewMode = 'desktop'
}: ToggleableChatbotProps) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const positionClasses = {
    'bottom-right': 'fixed bottom-4 right-4 z-50',
    'bottom-left': 'fixed bottom-4 left-4 z-50',
    'center': 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50'
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
      setHasNewMessage(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    // Save conversation history before closing
    if (conversationHistory.length > 0 && chatbotId) {
      console.log('Saving conversation history on close:', conversationHistory);
      // The conversation is already being saved automatically via onConversationUpdate
    }
    setIsOpen(false);
    setIsMinimized(false);
  };



  // Auto-open after delay if configured
  useEffect(() => {
    if (!autoOpen) return;
    
    const timer = setTimeout(() => {
      setIsOpen(true);
      setHasNewMessage(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [autoOpen]);

  // Handle conversation updates to show notification
  const handleConversationUpdate = (messages: any[]) => {
    setConversationHistory(messages);
    onConversationUpdate?.(messages);
    
    // Show notification for new bot messages when closed
    if (!isOpen && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.type === 'bot') {
        setHasNewMessage(true);
      }
    }
  };

  // Get widget dimensions based on size configuration (proportional to preview or screen)
  const getWidgetDimensions = () => {
    const size = config.ui?.size || 'medium';
    if (isMinimized) {
      return 'w-80 h-16'; // Minimized state stays consistent
    }
    
    // If in fullscreen preview mode, use screen dimensions
    if (previewMode === 'fullscreen') {
      switch (size) {
        case 'small':
          return 'w-[min(90vw,320px)] h-[min(70vh,450px)]';
        case 'medium':
          return 'w-[min(90vw,380px)] h-[min(80vh,600px)]';
        case 'large':
          return 'w-[min(95vw,450px)] h-[min(85vh,700px)]';
        case 'fullscreen':
          return 'w-screen h-screen fixed inset-0';
        default:
          return 'w-[min(90vw,380px)] h-[min(80vh,600px)]';
      }
    }
    
    // For preview mode, use proportional sizing to the preview container with better height ratios
    switch (size) {
      case 'small':
        return previewMode === 'mobile' ? 'w-20 h-32' : 'w-32 h-48';
      case 'medium':
        return previewMode === 'mobile' ? 'w-24 h-36' : 'w-40 h-56';
      case 'large':
        return previewMode === 'mobile' ? 'w-28 h-40' : 'w-48 h-64';
      case 'fullscreen':
        return 'w-full h-full';
      default:
        return previewMode === 'mobile' ? 'w-24 h-36' : 'w-40 h-56';
    }
  };

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      {/* Chat Widget */}
      {isOpen && (
        <Card className={`
          transition-all duration-300 ease-in-out
          ${getWidgetDimensions()}
          ${config.ui?.size !== 'fullscreen' ? 'max-h-[80vh]' : ''}
          shadow-2xl border-0 ring-1 ring-gray-200
          animate-in slide-in-from-bottom-2
        `}>
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b text-white rounded-t-lg"
            style={{
              background: `linear-gradient(135deg, ${config.ui?.theme?.primaryColor || '#3b82f6'}, ${config.ui?.theme?.secondaryColor || config.ui?.theme?.primaryColor || '#8b5cf6'})`,
              borderTopLeftRadius: `${config.ui?.theme?.borderRadius || 12}px`,
              borderTopRightRadius: `${config.ui?.theme?.borderRadius || 12}px`
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {config.businessName || 'Chat Assistant'}
                </h3>
                <p className="text-xs opacity-80">Online now</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <Minimize2 size={14} />
                </Button>
              )}
              {isMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaximize}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  <Maximize2 size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X size={14} />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <EnhancedChatbot
                  config={{
                    id: chatbotId,
                    businessName: config.businessName || 'Assistant',
                    location: config.location || 'Local area',
                    services: config.services || 'Professional services',
                    experience: 'Experienced professionals',
                    specialties: 'Quality service',
                    serviceAreas: config.location || 'Local area',
                    industry: config.industry || 'service',
                    phone: '',
                    email: '',
                    website: '',
                    ui: {
                      theme: {
                        primaryColor: config.ui?.theme?.primaryColor || '#3b82f6',
                        secondaryColor: config.ui?.theme?.secondaryColor || '#8b5cf6',
                        textColor: config.ui?.theme?.textColor || '#1f2937',
                        backgroundColor: config.ui?.theme?.backgroundColor || '#ffffff',
                      },
                      position: 'bottom-right',
                      animation: 'slide-up',
                      showTabs: true,
                      autoStart: false,
                    },
                    conversation: {
                      topics: [],
                      flow: '5W' as const,
                      maxFollowUps: 3,
                    },
                    ai: {
                      model: 'gemini-2.5-flash',
                      provider: 'gemini',
                      maxTokens: 500,
                    }
                  }}
                  onLeadUpdate={onLeadUpdate}
                  onConversationUpdate={handleConversationUpdate}
                  className="h-full w-full border-0 rounded-none"
                  widgetSize={config.ui?.size || 'medium'}
                />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className="
            w-16 h-16 rounded-full 
            bg-gradient-to-r from-blue-600 to-purple-600 
            hover:from-blue-700 hover:to-purple-700
            shadow-2xl border-0
            transition-all duration-300 hover:scale-110
            animate-in slide-in-from-bottom-2
            relative
          "
        >
          <MessageCircle size={24} className="text-white" />
          
          {/* Notification Dot */}
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          )}
          
          {/* Pulse Animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-ping opacity-20" />
        </Button>
      )}
    </div>
  );
}