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
      theme: {
        primaryColor: chatbot.config.ui.theme.primaryColor,
        secondaryColor: chatbot.config.ui.theme.secondaryColor,
        textColor: chatbot.config.ui.theme.textColor,
        backgroundColor: chatbot.config.ui.theme.backgroundColor,
      },
      position: chatbot.config.ui.position,
      animation: chatbot.config.ui.entryAnimation,
      showTabs: true,
      autoStart: true,
    },
    conversation: {
      topics: [
        {
          id: 'WHO',
          title: 'Contact Info',
          question: 'How would you prefer we contact you?',
          info: 'We can reach out via phone, email, or text - whatever works best for you.',
          icon: '👤'
        },
        {
          id: 'WHAT',
          title: 'Service Needed',
          question: 'What services do you need?',
          info: 'We offer professional services to meet your needs.',
          icon: '🔧'
        },
        {
          id: 'WHY',
          title: 'Your Needs',
          question: 'What specific challenges are you facing?',
          info: 'We specialize in providing exceptional service and solutions.',
          icon: '💡'
        },
        {
          id: 'WHERE',
          title: 'Location',
          question: 'What area are you located in?',
          info: 'We serve the local area and surrounding regions.',
          icon: '📍'
        },
        {
          id: 'WHEN',
          title: 'Timing',
          question: 'When do you need service?',
          info: 'We offer flexible scheduling to meet your needs.',
          icon: '⏰'
        }
      ],
      flow: '5W',
      maxFollowUps: 3,
    },
    ai: {
      model: chatbot.config.ai.initialModel,
      provider: 'gemini',
      maxTokens: 500,
    },
  };
}