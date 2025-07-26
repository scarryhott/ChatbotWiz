import type { Chatbot } from '@shared/schema';

// Adapter to convert database chatbot config to EnhancedChatbot config format
export function adaptChatbotConfig(chatbot: Chatbot) {
  return {
    businessName: chatbot.name,
    location: chatbot.domain || 'Your Location',
    services: 'Professional Services',
    experience: 'Experienced professionals',
    specialties: 'Quality service, competitive pricing',
    serviceAreas: 'Local area',
    industry: 'service',
    phone: '',
    email: '',
    website: `https://${chatbot.domain || 'example.com'}`,
    ui: {
      size: chatbot.config.ui?.size || 'medium',
      theme: {
        primaryColor: chatbot.config.ui?.theme?.primaryColor || '#3b82f6',
        secondaryColor: chatbot.config.ui?.theme?.secondaryColor || '#8b5cf6',
        textColor: chatbot.config.ui?.theme?.textColor || '#1f2937',
        backgroundColor: chatbot.config.ui?.theme?.backgroundColor || '#ffffff',
        borderRadius: chatbot.config.ui?.theme?.borderRadius || 12,
      },
      position: chatbot.config.ui?.position || 'bottom-right',
      animation: chatbot.config.ui?.entryAnimation || 'slide-up',
      showTabs: true,
      autoStart: chatbot.config.ui?.autoStartTrigger !== 'manual',
    },
    conversation: {
      topics: [
        {
          id: 'WHY',
          title: 'Your Needs',
          question: chatbot.config.conversation?.customQuestions?.WHY || 'What brings you here today? How can we help you?',
          info: 'We specialize in providing exceptional service and solutions.',
          icon: '💡'
        },
        {
          id: 'WHAT',
          title: 'Service Needed',
          question: chatbot.config.conversation?.customQuestions?.WHAT || 'What specific services or solutions are you looking for?',
          info: 'We offer professional services to meet your needs.',
          icon: '🔧'
        },
        {
          id: 'WHERE',
          title: 'Location',
          question: chatbot.config.conversation?.customQuestions?.WHERE || 'What area do you need service in? Where are you located?',
          info: 'We serve the local area and surrounding regions.',
          icon: '📍'
        },
        {
          id: 'WHEN',
          title: 'Timing',
          question: chatbot.config.conversation?.customQuestions?.WHEN || 'When do you need this service? What\'s your timeline?',
          info: 'We offer flexible scheduling to meet your needs.',
          icon: '⏰'
        },
        {
          id: 'WHO',
          title: 'Contact Info',
          question: chatbot.config.conversation?.customQuestions?.WHO || 'How would you like us to contact you? What\'s the best way to reach you?',
          info: 'We can reach out via phone, email, or text - whatever works best for you.',
          icon: '👤'
        }
      ],
      flow: '5W',
      maxFollowUps: 3,
    },
    ai: {
      model: chatbot.config.ai?.initialModel || 'gemini-2.5-flash',
      provider: 'gemini',
      maxTokens: 500,
    },
  };
}