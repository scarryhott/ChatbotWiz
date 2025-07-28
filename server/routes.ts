import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatbotSchema, insertLeadSchema, insertTopicCompletionSchema } from "@shared/schema";
import { analyzeWebsite, generateChatbotConfig } from "./services/websiteAnalyzer";
import { generateChatResponse } from "./services/gemini";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  // Protected chatbot routes
  app.get("/api/chatbots", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const chatbots = await storage.getChatbotsByUserId(userId);
      res.json(chatbots);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chatbots", error: (error as Error).message });
    }
  });

  app.get("/api/chatbots/:id", isAuthenticated, async (req: any, res) => {
    try {
      const chatbot = await storage.getChatbot(req.params.id);
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }
      res.json(chatbot);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chatbot", error: (error as Error).message });
    }
  });

  app.post("/api/chatbots", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertChatbotSchema.parse(req.body);
      const chatbot = await storage.createChatbot({
        userId: req.user.claims.sub,
        ...validatedData,
      });
      res.status(201).json(chatbot);
    } catch (error) {
      res.status(400).json({ message: "Failed to create chatbot", error: (error as Error).message });
    }
  });

  app.put("/api/chatbots/:id", isAuthenticated, async (req: any, res) => {
    try {
      const updates = insertChatbotSchema.partial().parse(req.body);
      const chatbot = await storage.updateChatbot(req.params.id, updates);
      res.json(chatbot);
    } catch (error) {
      res.status(400).json({ message: "Failed to update chatbot", error: (error as Error).message });
    }
  });

  // Chat response API for real-time AI responses
  app.post("/api/chat/response", async (req, res) => {
    try {
      const { message, topic, businessInfo, conversationHistory, chatbotId, sessionId } = req.body;
      
      const response = await generateChatResponse({
        userMessage: message,
        currentTopic: topic,
        businessInfo: businessInfo,
        conversationHistory: conversationHistory || []
      });
      
      // If topic is complete (green checkmark), save/update lead information
      if (response.isTopicComplete && sessionId && chatbotId) {
        console.log('Topic completed! Saving lead for session:', sessionId, 'topic:', topic, 'chatbotId:', chatbotId, 'extractedInfo:', response.extractedInfo);
        try {
          const savedLead = await storage.saveLeadFromSession({
            chatbotId,
            sessionId,
            topic,
            extractedInfo: response.extractedInfo || {},
            conversationHistory: conversationHistory || []
          });
          console.log('Lead saved successfully:', savedLead.id);
        } catch (leadError) {
          console.error('Error saving lead from session:', leadError);
          // Don't fail the chat response if lead saving fails
        }
      } else {
        console.log('Topic not completed or missing session info:', {
          isTopicComplete: response.isTopicComplete,
          hasSessionId: !!sessionId,
          hasChatbotId: !!chatbotId,
          extractedInfo: response.extractedInfo
        });
      }
      
      res.json({ message: response.message, nextTopic: response.nextTopic, isTopicComplete: response.isTopicComplete });
    } catch (error) {
      console.error('Chat response error:', error);
      res.status(500).json({ message: "I apologize, but I'm having trouble processing your request right now. How can I help you today?" });
    }
  });

  // Protected lead routes
  app.get("/api/chatbots/:chatbotId/leads", isAuthenticated, async (req: any, res) => {
    try {
      const { search, completed } = req.query;
      let leads;
      
      if (search) {
        leads = await storage.searchLeads(req.params.chatbotId, search as string);
      } else if (completed !== undefined) {
        leads = await storage.getLeadsByCompletion(req.params.chatbotId, completed === 'true');
      } else {
        leads = await storage.getLeadsByChatbotId(req.params.chatbotId);
      }
      
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to get leads", error: (error as Error).message });
    }
  });

  app.post("/api/chatbots/:chatbotId/leads", isAuthenticated, async (req: any, res) => {
    try {
      const leadData = {
        ...req.body,
        chatbotId: req.params.chatbotId
      };
      const validatedData = insertLeadSchema.parse(leadData);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error) {
      res.status(400).json({ message: "Failed to create lead", error: (error as Error).message });
    }
  });

  app.put("/api/leads/:id", async (req, res) => {
    try {
      const updates = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(req.params.id, updates);
      res.json(lead);
    } catch (error) {
      res.status(400).json({ message: "Failed to update lead", error: (error as Error).message });
    }
  });

  // Website analysis route
  app.post("/api/analyze-website", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      const analysis = await analyzeWebsite(url);
      const config = await generateChatbotConfig(analysis);
      
      res.json({ analysis, config });
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze website", error: (error as Error).message });
    }
  });

  // Chat response route
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, chatbotId, currentTopic, conversationHistory } = req.body;
      
      const chatbot = await storage.getChatbot(chatbotId);
      if (!chatbot) {
        return res.status(404).json({ message: "Chatbot not found" });
      }

      const response = await generateChatResponse({
        userMessage: message,
        currentTopic: currentTopic,
        businessInfo: { name: chatbot.name, ...chatbot.config },
        conversationHistory: conversationHistory || []
      });

      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate chat response", error: (error as Error).message });
    }
  });

  // Firebase topic tracking
  app.post("/api/firebase-topics", async (req, res) => {
    try {
      const validatedData = insertFirebaseTopicSchema.parse(req.body);
      const topic = await storage.createFirebaseTopic(validatedData);
      res.status(201).json(topic);
    } catch (error) {
      res.status(400).json({ message: "Failed to create firebase topic", error: (error as Error).message });
    }
  });

  app.put("/api/firebase-topics/:id/complete", async (req, res) => {
    try {
      const topic = await storage.updateFirebaseTopic(req.params.id, {
        isCompleted: true,
        completedAt: new Date()
      });
      res.json(topic);
    } catch (error) {
      res.status(400).json({ message: "Failed to complete firebase topic", error: (error as Error).message });
    }
  });

  // Mount Firebase routes
  // Firebase routes removed - using PostgreSQL database instead

  const httpServer = createServer(app);
  return httpServer;
}
