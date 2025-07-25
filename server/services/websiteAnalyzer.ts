import { generateChatbotConfig as geminiGenerateConfig, analyzeWebsiteContent } from "./gemini";

export interface WebsiteAnalysis {
  company: string;
  industry: string;
  services: string[];
  keyMessages: string[];
  tone: string;
  targetAudience: string;
  ethos: string;
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  try {
    // In a real implementation, we would fetch the website content
    // For now, we'll simulate this with the Gemini API
    const mockContent = `Website content from ${url}`;
    
    const analysis = await analyzeWebsiteContent(mockContent);
    return analysis;
  } catch (error) {
    throw new Error(`Failed to analyze website: ${(error as Error).message}`);
  }
}

export async function generateChatbotConfig(analysis: WebsiteAnalysis) {
  try {
    const config = await geminiGenerateConfig(analysis);
    return config;
  } catch (error) {
    throw new Error(`Failed to generate chatbot config: ${(error as Error).message}`);
  }
}
