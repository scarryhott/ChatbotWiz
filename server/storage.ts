import { type User, type InsertUser, type Chatbot, type InsertChatbot, type Lead, type InsertLead, type FirebaseTopic, type InsertFirebaseTopic, type ChatbotConfig, type FiveWProgress } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Chatbot methods
  getChatbot(id: string): Promise<Chatbot | undefined>;
  getChatbotsByUserId(userId: string): Promise<Chatbot[]>;
  createChatbot(chatbot: InsertChatbot): Promise<Chatbot>;
  updateChatbot(id: string, updates: Partial<InsertChatbot>): Promise<Chatbot>;
  deleteChatbot(id: string): Promise<void>;

  // Lead methods
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByChatbotId(chatbotId: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead>;
  searchLeads(chatbotId: string, query: string): Promise<Lead[]>;
  getLeadsByCompletion(chatbotId: string, completed: boolean): Promise<Lead[]>;

  // Firebase topic methods
  getFirebaseTopics(userId: string, leadId: string): Promise<FirebaseTopic[]>;
  createFirebaseTopic(topic: InsertFirebaseTopic): Promise<FirebaseTopic>;
  updateFirebaseTopic(id: string, updates: Partial<InsertFirebaseTopic>): Promise<FirebaseTopic>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatbots: Map<string, Chatbot>;
  private leads: Map<string, Lead>;
  private firebaseTopics: Map<string, FirebaseTopic>;

  constructor() {
    this.users = new Map();
    this.chatbots = new Map();
    this.leads = new Map();
    this.firebaseTopics = new Map();

    // Initialize with demo user and chatbot
    this.initializeDemo();
  }

  private initializeDemo() {
    const demoUser: User = {
      id: "demo-user-1",
      username: "demo",
      password: "demo123"
    };
    this.users.set(demoUser.id, demoUser);

    const demoChatbot: Chatbot = {
      id: "demo-chatbot-1",
      userId: demoUser.id,
      name: "Demo AI Assistant",
      domain: "demo.wwwwwai.com",
      config: {
        company: {
          name: "Demo Company",
          ethos: "We believe in empowering businesses through AI-driven customer engagement and innovative solutions.",
          website: "https://demo.company.com",
          knowledgeBase: "Our company specializes in AI solutions, customer engagement tools, and business automation."
        },
        topics: {
          why: { 
            question: "I noticed you're exploring our services - what's driving your interest in AI solutions today?", 
            completed: false 
          },
          what: { 
            question: "What specific challenges or goals are you looking to address?", 
            completed: false 
          },
          when: { 
            question: "What's your timeline for implementing these solutions?", 
            completed: false 
          },
          where: { 
            question: "Where would you be implementing this - what's the scope of your project?", 
            completed: false 
          },
          who: { 
            question: "Who else would be involved in this decision-making process?", 
            completed: false 
          }
        },
        ui: {
          size: "medium",
          position: "bottom-right",
          transparentBackground: false,
          scrollMode: false,
          entryAnimation: "slide-up",
          typingIndicator: "dots",
          autoStartTrigger: "5-second-delay",
          theme: {
            primaryColor: "#4F46E5",
            secondaryColor: "#E0E7FF",
            backgroundColor: "#FFFFFF",
            textColor: "#1F2937",
            borderRadius: 16
          }
        },
        ai: {
          initialModel: "gemini-2.5-flash",
          followUpModel: "gemini-2.5-flash",
          ethosFilter: "Focus on understanding business needs and providing valuable insights about our solutions. Be conversational and helpful."
        },
        popupTrigger: {
          enabled: true,
          message: "Hi! I noticed you're checking out our AI solutions. I'm here to help you find exactly what you need. What brings you here today?",
          delay: 3
        }
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chatbots.set(demoChatbot.id, demoChatbot);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Chatbot methods
  async getChatbot(id: string): Promise<Chatbot | undefined> {
    return this.chatbots.get(id);
  }

  async getChatbotsByUserId(userId: string): Promise<Chatbot[]> {
    return Array.from(this.chatbots.values()).filter(chatbot => chatbot.userId === userId);
  }

  async createChatbot(insertChatbot: InsertChatbot): Promise<Chatbot> {
    const id = randomUUID();
    const chatbot: Chatbot = {
      ...insertChatbot,
      id,
      domain: insertChatbot.domain || null,
      isActive: insertChatbot.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chatbots.set(id, chatbot);
    return chatbot;
  }

  async updateChatbot(id: string, updates: Partial<InsertChatbot>): Promise<Chatbot> {
    const existing = this.chatbots.get(id);
    if (!existing) {
      throw new Error(`Chatbot with id ${id} not found`);
    }
    const updated: Chatbot = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.chatbots.set(id, updated);
    return updated;
  }

  async deleteChatbot(id: string): Promise<void> {
    if (!this.chatbots.has(id)) {
      throw new Error(`Chatbot with id ${id} not found`);
    }
    this.chatbots.delete(id);
  }

  // Lead methods
  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async getLeadsByChatbotId(chatbotId: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.chatbotId === chatbotId);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = randomUUID();
    const lead: Lead = {
      ...insertLead,
      id,
      name: insertLead.name || null,
      email: insertLead.email || null,
      phone: insertLead.phone || null,
      isCompleted: insertLead.isCompleted ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead> {
    const existing = this.leads.get(id);
    if (!existing) {
      throw new Error(`Lead with id ${id} not found`);
    }
    const updated: Lead = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.leads.set(id, updated);
    return updated;
  }

  async searchLeads(chatbotId: string, query: string): Promise<Lead[]> {
    const leads = await this.getLeadsByChatbotId(chatbotId);
    if (!query.trim()) return leads;
    
    const lowerQuery = query.toLowerCase();
    return leads.filter(lead => 
      (lead.name?.toLowerCase().includes(lowerQuery)) ||
      (lead.email?.toLowerCase().includes(lowerQuery)) ||
      (lead.contextSummary?.toLowerCase().includes(lowerQuery))
    );
  }

  async getLeadsByCompletion(chatbotId: string, completed: boolean): Promise<Lead[]> {
    const leads = await this.getLeadsByChatbotId(chatbotId);
    return leads.filter(lead => lead.isCompleted === completed);
  }

  // Firebase topic methods
  async getFirebaseTopics(userId: string, leadId: string): Promise<FirebaseTopic[]> {
    return Array.from(this.firebaseTopics.values()).filter(
      topic => topic.userId === userId && topic.leadId === leadId
    );
  }

  async createFirebaseTopic(insertTopic: InsertFirebaseTopic): Promise<FirebaseTopic> {
    const id = randomUUID();
    const topic: FirebaseTopic = { ...insertTopic, id };
    this.firebaseTopics.set(id, topic);
    return topic;
  }

  async updateFirebaseTopic(id: string, updates: Partial<InsertFirebaseTopic>): Promise<FirebaseTopic> {
    const existing = this.firebaseTopics.get(id);
    if (!existing) {
      throw new Error(`Firebase topic with id ${id} not found`);
    }
    const updated: FirebaseTopic = { ...existing, ...updates };
    this.firebaseTopics.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
