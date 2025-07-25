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

export async function generateChatResponse(
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
