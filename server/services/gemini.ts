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

INTELLIGENT BEHAVIOR:
1. Listen for natural topic transitions in user responses
2. If user mentions location details, consider moving to WHERE topic
3. If user mentions timing/urgency, consider moving to WHEN topic
4. If user asks about services/solutions, move to WHAT topic
5. Only move to WHO (contact collection) after user shows clear interest
6. Always provide helpful information before asking questions
7. Be conversational and adaptive, not rigid or form-like

CONVERSATION STYLE - CRITICAL:
- ALWAYS provide helpful information, services details, or solutions BEFORE asking questions
- When user asks about services, immediately share service details and benefits
- When user mentions a need, offer specific solutions and expertise
- Never ask "what prompted you to..." - instead explain how you can help
- Give value first: "We offer X, Y, Z services that solve..." then "What specific area interests you?"
- Build trust by demonstrating knowledge, not by interrogating

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
            isTopicComplete: { type: "boolean" },
            quickReplies: { type: "array", items: { type: "string" } },
            shouldEndConversation: { type: "boolean" }
          },
          required: ["message", "isTopicComplete", "shouldEndConversation"]
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
- FIRST provides valuable information, service details, or solutions
- Shows expertise and knowledge before asking any questions
- If user asks about services, immediately explain what you offer and how it helps
- If user mentions a problem, immediately offer relevant solutions
- NEVER ask "what prompted this" or "tell me more about your motivation"
- Switch topics naturally when user indicates different focus
- For WHEN topic: If user mentions vague times (like "Thursday" or "morning"), gently ask for more specific details like AM/PM or preferred time ranges
- Only collect contact info after demonstrating clear value

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
      return {
        message: parsedResponse.message,
        nextTopic: parsedResponse.nextTopic,
        isTopicComplete: parsedResponse.isTopicComplete || false,
        quickReplies: parsedResponse.quickReplies || [],
        shouldEndConversation: parsedResponse.shouldEndConversation || false
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
