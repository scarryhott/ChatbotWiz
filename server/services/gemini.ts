import { GoogleGenAI } from "@google/genai";
import type { ChatbotConfig, ConversationMessage } from "@shared/schema";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "" 
});

export interface WebsiteAnalysis {
  company: string;
  industry: string;
  services: string[];
  keyMessages: string[];
  tone: string;
  targetAudience: string;
  ethos: string;
}

export interface ChatResponse {
  message: string;
  nextTopic?: "why" | "what" | "when" | "where" | "who";
  isTopicComplete: boolean;
  quickReplies?: string[];
  shouldEndConversation: boolean;
  extractedInfo?: Record<string, any>; // Information extracted when topic is completed
}

export async function analyzeWebsiteContent(content: string): Promise<WebsiteAnalysis> {
  try {
    const systemPrompt = `You are a website analysis expert. Analyze the website content and extract key business information.
    
Provide a JSON response with the following structure:
{
  "company": "Company name",
  "industry": "Industry sector",
  "services": ["service1", "service2"],
  "keyMessages": ["message1", "message2"],
  "tone": "professional/casual/friendly/etc",
  "targetAudience": "description of target audience",
  "ethos": "company philosophy and values in one paragraph"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            company: { type: "string" },
            industry: { type: "string" },
            services: { type: "array", items: { type: "string" } },
            keyMessages: { type: "array", items: { type: "string" } },
            tone: { type: "string" },
            targetAudience: { type: "string" },
            ethos: { type: "string" }
          },
          required: ["company", "industry", "services", "keyMessages", "tone", "targetAudience", "ethos"]
        }
      },
      contents: `Analyze this website content: ${content}`
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    throw new Error(`Failed to analyze website content: ${(error as Error).message}`);
  }
}

export async function generateChatbotConfig(analysis: WebsiteAnalysis): Promise<Partial<ChatbotConfig>> {
  try {
    const systemPrompt = `You are a chatbot configuration expert. Based on the website analysis, generate an optimal chatbot configuration.

Create a JSON response with this structure:
{
  "company": {
    "name": "company name",
    "ethos": "refined company ethos for chatbot personality",
    "website": "website url if available"
  },
  "topics": {
    "why": { "question": "why-focused question", "completed": false },
    "what": { "question": "what-focused question", "completed": false },
    "when": { "question": "when-focused question", "completed": false },
    "where": { "question": "where-focused question", "completed": false },
    "who": { "question": "who-focused question", "completed": false }
  },
  "ai": {
    "ethosFilter": "guidance for AI responses based on company values"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            company: {
              type: "object",
              properties: {
                name: { type: "string" },
                ethos: { type: "string" },
                website: { type: "string" }
              }
            },
            topics: {
              type: "object",
              properties: {
                why: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    completed: { type: "boolean" }
                  }
                },
                what: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    completed: { type: "boolean" }
                  }
                },
                when: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    completed: { type: "boolean" }
                  }
                },
                where: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    completed: { type: "boolean" }
                  }
                },
                who: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    completed: { type: "boolean" }
                  }
                }
              }
            },
            ai: {
              type: "object",
              properties: {
                ethosFilter: { type: "string" }
              }
            }
          }
        }
      },
      contents: `Generate chatbot config for: ${JSON.stringify(analysis)}`
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    throw new Error(`Failed to generate chatbot config: ${(error as Error).message}`);
  }
}

export async function generateChatResponse(params: {
  userMessage: string;
  currentTopic: string;
  businessInfo: any;
  conversationHistory: any[];
}): Promise<ChatResponse> {
  const { userMessage, currentTopic, businessInfo, conversationHistory } = params;
  
  try {
    const systemPrompt = `You are an intelligent AI assistant for ${businessInfo.businessName || businessInfo.name}, a professional service business.

Business Context:
- Company: ${businessInfo.businessName || businessInfo.name}
- Services: ${businessInfo.services}
- Service Areas: ${businessInfo.serviceAreas || businessInfo.location}
- Experience: ${businessInfo.experience}
- Industry: ${businessInfo.industry}

INTELLIGENT CONVERSATION FLOW:
Use "GIVE BEFORE TAKE" approach - provide value, information, and assistance before asking for personal details.

5W Framework - Flexible Navigation:
- WHY: Understand their motivation/problem (provide helpful info, then explore needs)
- WHAT: Identify specific services (offer solutions, explain benefits)
- WHERE: Determine location/scope (share service areas, explain logistics)
- WHEN: Establish timeline (discuss availability, suggest optimal timing, capture specific times with AM/PM and dates when provided)
- WHO: Collect contact info (ONLY after building trust and providing value)

INTELLIGENT TAB SWITCHING - ALWAYS REQUIRED:
1. MANDATORY: You MUST provide "suggestedTab" in every response 
2. Analyze user message context and suggest the most appropriate tab:
   - Location keywords (area, address, city, where, location) → suggestedTab: "WHERE"
   - Timing keywords (when, schedule, time, date, urgency, deadline) → suggestedTab: "WHEN" 
   - Service keywords (what, services, solutions, offerings, help) → suggestedTab: "WHAT"
   - Problem/motivation keywords (why, need, problem, issue, goal) → suggestedTab: "WHY"
   - Contact keywords (who, contact, reach, call, email, info) → suggestedTab: "WHO"
3. If current conversation naturally continues in current tab, suggest current tab
4. Only suggest WHO after user shows clear interest and engagement
5. Base tab selection on conversation flow, not rigid rules
6. CRITICAL: Every response must include a suggestedTab decision

CONVERSATION STYLE - CRITICAL:
- Keep responses BRIEF, CONCISE, and DYNAMIC - max 2-3 sentences unless explaining complex services
- ALWAYS provide helpful information, services details, or solutions BEFORE asking questions
- When user asks about services, immediately share service details and benefits
- When user mentions a need, offer specific solutions and expertise
- Never ask "what prompted you to..." - instead explain how you can help
- Give value first: "We offer X, Y, Z services that solve..." then "What specific area interests you?"
- Build trust by demonstrating knowledge, not by interrogating
- Respond naturally to user's tone and style - match their energy level
- Avoid repetitive phrases - vary your responses dynamically

Current Topic: ${currentTopic} (but be flexible to move based on user responses)`;

    const conversationContext = conversationHistory.slice(-6).map((msg: any) => 
      `${msg.type}: ${msg.content}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
            nextTopic: { type: "string", enum: ["WHY", "WHAT", "WHEN", "WHERE", "WHO"] },
            suggestedTab: { type: "string", enum: ["WHY", "WHAT", "WHEN", "WHERE", "WHO"] },
            isTopicComplete: { type: "boolean" },
            quickReplies: { type: "array", items: { type: "string" } },
            shouldEndConversation: { type: "boolean" }
          },
          required: ["message", "isTopicComplete", "shouldEndConversation", "suggestedTab"]
        }
      },
      contents: `
Recent conversation:
${conversationContext}

Current topic: ${currentTopic}
User message: ${userMessage}

ANALYZE AND RESPOND INTELLIGENTLY:

1. What topic is the user naturally discussing? (location=WHERE, timing=WHEN, services=WHAT, etc.)
2. Should you switch topics based on their response?
3. Are you providing value/help before asking for information?
4. Have you gathered enough info for current topic to move forward?

Generate a response that:
- Is BRIEF and DYNAMIC (1-2 sentences max unless explaining services)
- FIRST provides valuable information, service details, or solutions
- Shows expertise and knowledge before asking any questions
- If user asks about services, immediately explain what you offer and how it helps
- If user mentions a problem, immediately offer relevant solutions
- NEVER ask "what prompted this" or "tell me more about your motivation"
- Switch topics naturally when user indicates different focus
- For WHEN topic: Validate timing as realistic dates/times, ask for clarification if unrealistic
- For WHERE topic: Ensure location is within service area, clarify if outside coverage
- For WHO topic: Validate contact info format (proper email/phone format)
- Only collect contact info after demonstrating clear value
- Match user's communication style and energy

WHEN TOPIC ENHANCED GUIDELINES:
- When user mentions times, capture both time AND AM/PM preferences
- If they mention days, ask about preferred time of day (morning/afternoon/evening)
- If they say "next week" or similar, help them narrow down to specific days
- For emergencies or urgent needs, immediately offer emergency service options
- Always confirm scheduling details: "So Thursday at 7:30 AM works for you?"
- Be helpful and informative, not interrogative
- Offer quick reply options for common timing scenarios (morning/afternoon/evening, weekdays/weekends, ASAP/flexible)
- When user provides incomplete timing info, suggest specific time ranges that work best for your services

Set isTopicComplete=true and suggest nextTopic when:
- You have sufficient information for current topic
- User's responses indicate readiness to move forward
- Natural conversation flow suggests topic transition
`
    });

    const rawJson = response.text;
    if (rawJson) {
      const parsedResponse = JSON.parse(rawJson);
      
      // Extract information when topic is complete
      let extractedInfo: Record<string, any> = {};
      if (parsedResponse.isTopicComplete) {
        extractedInfo = await extractTopicInformation(userMessage, currentTopic, parsedResponse.message, conversationHistory);
      }
      
      return {
        message: parsedResponse.message,
        nextTopic: parsedResponse.nextTopic,
        isTopicComplete: parsedResponse.isTopicComplete || false,
        quickReplies: parsedResponse.quickReplies || [],
        shouldEndConversation: parsedResponse.shouldEndConversation || false,
        extractedInfo: parsedResponse.isTopicComplete ? extractedInfo : undefined
      };
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      message: `I'd be happy to help with your ${currentTopic.toLowerCase()} questions! Could you tell me more about what you're looking for?`,
      isTopicComplete: false,
      shouldEndConversation: false
    };
  }
}

// Extract specific information when a topic is completed
async function extractTopicInformation(
  userMessage: string, 
  topic: string, 
  aiResponse: string, 
  conversationHistory: any[]
): Promise<Record<string, any>> {
  try {
    const fullConversation = conversationHistory.map((msg: any) => `${msg.role || msg.type}: ${msg.content}`).join('\n');
    
    const extractionPrompt = `Extract ALL relevant information from the ENTIRE conversation for the ${topic.toUpperCase()} topic.

FULL CONVERSATION HISTORY:
${fullConversation}
Current User Message: ${userMessage}
Current AI Response: ${aiResponse}

Based on the ENTIRE conversation above, extract the following information for the ${topic} topic:

${getExtractionSchema(topic)}

IMPORTANT: 
- Look through ALL conversation messages, not just the most recent ones
- Extract ANY contact information mentioned anywhere in the conversation (name, email, phone, company)
- Extract ANY location information mentioned anywhere (address, city, state, area)
- Extract ANY timing information mentioned anywhere (dates, times, availability)
- If no specific information is available for a field, use null

Return a JSON object with the extracted information.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: extractionPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: getExtractionProperties(topic),
          additionalProperties: true
        }
      },
      contents: `Extract information for ${topic} topic from the conversation above.`
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    }
    return {};
  } catch (error) {
    console.error('Information extraction error:', error);
    return {};
  }
}

function getExtractionSchema(topic: string): string {
  switch (topic.toLowerCase()) {
    case 'why':
      return `- motivation: Main reason for interest/inquiry
- pain_points: Current challenges or problems
- goals: What they want to achieve
- urgency: How urgent their need is`;
    case 'what':
      return `- services_needed: Specific services or products they want
- requirements: Technical or specific requirements
- preferences: Preferences or specific needs
- budget_range: Any budget information mentioned`;
    case 'when':
      return `- timeline: When they need service/solution (validate as realistic date/time)
- deadline: Any specific deadlines (validate as realistic dates)
- availability: Their availability for scheduling (validate time format)
- preferred_times: Specific times mentioned (validate AM/PM format and realistic times)
- valid_date: true/false if timing is realistic and achievable`;
    case 'where':
      return `- location: Service location or address (validate if in service area)
- service_area: Geographic area needing service
- property_type: Type of property/building
- accessibility: Any location-specific requirements
- in_service_area: true/false if location is within company's service coverage`;
    case 'who':
      return `- name: Contact person's name (validate as real name, not placeholder)
- title: Job title or role
- company: Company/organization name
- email: Email address (validate email format)
- phone: Phone number (validate phone format)
- decision_maker: Whether they make decisions
- valid_contact: true/false if contact info appears legitimate`;
    default:
      return `- ${topic}: Relevant information for this topic`;
  }
}

function getExtractionProperties(topic: string): Record<string, any> {
  // Base properties for all topics to capture contact info
  const baseProperties = {
    name: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    company: { type: "string" }
  };

  switch (topic.toLowerCase()) {
    case 'why':
      return {
        ...baseProperties,
        motivation: { type: "string" },
        pain_points: { type: "string" },
        goals: { type: "string" },
        urgency: { type: "string" },
        why: { type: "string" }
      };
    case 'what':
      return {
        ...baseProperties,
        services_needed: { type: "string" },
        requirements: { type: "string" },
        preferences: { type: "string" },
        budget_range: { type: "string" },
        what: { type: "string" }
      };
    case 'when':
      return {
        ...baseProperties,
        timeline: { type: "string" },
        deadline: { type: "string" },
        availability: { type: "string" },
        preferred_times: { type: "string" },
        specific_dates: { type: "string" },
        time_preferences: { type: "string" },
        valid_date: { type: "boolean" },
        when: { type: "string" }
      };
    case 'where':
      return {
        ...baseProperties,
        location: { type: "string" },
        service_area: { type: "string" },
        property_type: { type: "string" },
        accessibility: { type: "string" },
        address: { type: "string" },
        in_service_area: { type: "boolean" },
        where: { type: "string" }
      };
    case 'who':
      return {
        ...baseProperties,
        title: { type: "string" },
        decision_maker: { type: "string" },
        valid_contact: { type: "boolean" },
        who: { type: "string" }
      };
    default:
      return {
        ...baseProperties,
        [topic]: { type: "string" }
      };
  }
}

export async function generateChatResponseOriginal(
  userMessage: string,
  chatbotConfig: ChatbotConfig,
  currentTopic: "why" | "what" | "when" | "where" | "who",
  conversationHistory: ConversationMessage[]
): Promise<ChatResponse> {
  try {
    const systemPrompt = `You are an AI assistant for ${chatbotConfig.company.name}. 

Company ethos: ${chatbotConfig.company.ethos}
AI guidance: ${chatbotConfig.ai.ethosFilter}

Your goal is to guide users through the 5W framework:
- WHY: Understanding their motivation and goals
- WHAT: Identifying specific products/services needed
- WHEN: Timeline and urgency
- WHERE: Location and scope
- WHO: Decision makers involved

Current topic focus: ${currentTopic.toUpperCase()}
Current question: ${chatbotConfig.topics[currentTopic].question}

Rules:
1. Keep responses conversational and helpful
2. Focus on the current topic but be natural
3. Don't force topic completion - let conversation flow naturally
4. Provide value and information before asking questions
5. Generate relevant quick reply options when appropriate
6. Determine if the current topic is sufficiently addressed
7. Suggest moving to next topic when appropriate
8. End conversation gracefully when all topics are covered or user indicates no more questions

Respond with JSON:
{
  "message": "your response",
  "nextTopic": "next topic or null if staying on current",
  "isTopicComplete": true/false,
  "quickReplies": ["option1", "option2"] or null,
  "shouldEndConversation": true/false
}`;

    const conversationContext = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.type}: ${msg.content}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: chatbotConfig.ai.initialModel,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            message: { type: "string" },
            nextTopic: { type: "string", enum: ["why", "what", "when", "where", "who"] },
            isTopicComplete: { type: "boolean" },
            quickReplies: { type: "array", items: { type: "string" } },
            shouldEndConversation: { type: "boolean" }
          },
          required: ["message", "isTopicComplete", "shouldEndConversation"]
        }
      },
      contents: `Conversation history:\n${conversationContext}\n\nUser message: ${userMessage}`
    });

    const rawJson = response.text;
    if (rawJson) {
      return JSON.parse(rawJson);
    } else {
      throw new Error("Empty response from Gemini");
    }
  } catch (error) {
    throw new Error(`Failed to generate chat response: ${(error as Error).message}`);
  }
}

export async function generateEthosFromWebsite(websiteUrl: string): Promise<string> {
  try {
    // In a real implementation, we would fetch and parse the website
    // For now, we'll use the URL to generate a contextual ethos
    const systemPrompt = `Generate a professional company ethos statement based on the website URL and implied business type. 
    
The ethos should be 2-3 sentences that capture the company's values, mission, and approach to serving customers.
Make it specific and authentic-sounding, not generic corporate speak.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate an ethos for a company with website: ${websiteUrl}`
    });

    return response.text || "We believe in delivering exceptional value through innovative solutions tailored to our clients' unique needs.";
  } catch (error) {
    throw new Error(`Failed to generate ethos: ${(error as Error).message}`);
  }
}
