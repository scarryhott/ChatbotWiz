import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatbotSchema, insertLeadSchema, insertFirebaseTopicSchema } from "@shared/schema";
import { analyzeWebsite, generateChatbotConfig } from "./services/websiteAnalyzer";
import { generateChatResponse } from "./services/gemini";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (demo user for now)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser("demo-user-1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error: (error as Error).message });
    }
  });

  // Chatbot routes
  app.get("/api/chatbots", async (req, res) => {
    try {
      const chatbots = await storage.getChatbotsByUserId("demo-user-1");
      res.json(chatbots);
    } catch (error) {
      res.status(500).json({ message: "Failed to get chatbots", error: (error as Error).message });
    }
  });

  app.get("/api/chatbots/:id", async (req, res) => {
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

  app.post("/api/chatbots", async (req, res) => {
    try {
      const validatedData = insertChatbotSchema.parse(req.body);
      const chatbot = await storage.createChatbot(validatedData);
      res.status(201).json(chatbot);
    } catch (error) {
      res.status(400).json({ message: "Failed to create chatbot", error: (error as Error).message });
    }
  });

  app.put("/api/chatbots/:id", async (req, res) => {
    try {
      const updates = insertChatbotSchema.partial().parse(req.body);
      const chatbot = await storage.updateChatbot(req.params.id, updates);
      res.json(chatbot);
    } catch (error) {
      res.status(400).json({ message: "Failed to update chatbot", error: (error as Error).message });
    }
  });

  // Lead routes
  app.get("/api/chatbots/:chatbotId/leads", async (req, res) => {
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

  app.post("/api/chatbots/:chatbotId/leads", async (req, res) => {
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

      const response = await generateChatResponse(
        message,
        chatbot.config,
        currentTopic,
        conversationHistory || []
      );

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

  const httpServer = createServer(app);
  return httpServer;
}
