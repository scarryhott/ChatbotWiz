import { users, chatbots, leads, firebaseTopics, type User, type InsertUser, type Chatbot, type InsertChatbot, type Lead, type InsertLead, type FirebaseTopic, type InsertFirebaseTopic } from "@shared/schema";
import { db } from "./db";
import { eq, like, and } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize demo data on first run
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    try {
      // Check if demo user already exists
      const existingUser = await this.getUser("demo-user-1");
      if (existingUser) return; // Demo data already exists

      // Demo user
      const demoUser = {
        id: "demo-user-1",
        username: "demo",
        password: "password"
      };
      await db.insert(users).values(demoUser);

      // Demo chatbot with comprehensive 5W configuration
      const demoChatbot = {
        id: "demo-chatbot-1",
        userId: "demo-user-1",
        name: "EcoSolutions Assistant",
        config: {
          company: {
            name: "EcoSolutions",
            ethos: "We believe in sustainable technology solutions that help businesses reduce their environmental impact while increasing efficiency and profitability.",
            website: "https://www.ecosolutions.com",
            knowledgeBase: "Solar Panel Installation, Energy Audits, Green Building Consulting, Sustainable IT Solutions. Pricing: Solar audit $299, Energy audit $199, Consulting $150/hour. Service areas: Austin, Dallas, Houston, San Antonio. Certifications: LEED Certified, Energy Star Partner, Solar Power International Member."
          },
          topics: {
            why: {
              question: "What environmental or cost concerns are driving your interest in sustainable solutions?",
              completed: false,
              value: undefined
            },
            what: {
              question: "What specific sustainable solutions are you most interested in learning about?", 
              completed: false,
              value: undefined
            },
            when: {
              question: "When are you looking to implement these sustainable solutions?",
              completed: false,
              value: undefined
            },
            where: {
              question: "Where is your business or property located?",
              completed: false,
              value: undefined
            },
            who: {
              question: "Who is the main decision-maker for sustainability initiatives at your organization?",
              completed: false,
              value: undefined
            }
          },
          conversation: {
            customQuestions: {
              WHY: "What environmental or cost concerns are driving your interest in sustainable solutions?",
              WHAT: "What specific sustainable solutions are you most interested in learning about?",
              WHERE: "Where is your business or property located?",
              WHEN: "When are you looking to implement these sustainable solutions?",
              WHO: "Who is the main decision-maker for sustainability initiatives at your organization?"
            },
            flow: "5W" as const,
            maxFollowUps: 3
          },
          ui: {
            size: "medium",
            position: "bottom-right",
            transparentBackground: false,
            scrollMode: false,
            entryAnimation: "slide-up",
            typingIndicator: "dots",
            autoStartTrigger: "page-load",
            theme: {
              primaryColor: "#22c55e",
              secondaryColor: "#16a34a",
              backgroundColor: "#f0fdf4",
              textColor: "#15803d",
              borderRadius: 12
            }
          },
          ai: {
            initialModel: "gemini-2.5-flash",
            followUpModel: "gemini-2.5-flash",
            ethosFilter: "Filter all responses through EcoSolutions' commitment to environmental sustainability and business profitability. Always emphasize both environmental benefits and cost savings."
          },
          popupTrigger: {
            enabled: true,
            message: "Get sustainable solutions for your business",
            delay: 30000
          }
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.insert(chatbots).values(demoChatbot);

      // Demo leads with various 5W completion states
      const demoLeads = [
        {
          id: "demo-lead-1",
          chatbotId: "demo-chatbot-1",
          fiveWProgress: {
            why: { completed: true, answer: "Looking to reduce energy costs and meet ESG requirements" },
            what: { completed: true, answer: "Solar panels and energy audit" },
            when: { completed: true, answer: "Next quarter" },
            where: { completed: true, answer: "Austin, Texas" },
            who: { completed: true, answer: "Sarah Johnson, Operations Manager" }
          },
          specificRequests: "Solar installation for corporate office",
          contextSummary: "TechStartup Inc operations manager interested in ESG compliance",
          conversationHistory: [],
          currentTopic: "who",
          isCompleted: true
        },
        {
          id: "demo-lead-2",
          chatbotId: "demo-chatbot-1",
          name: "Mike Chen", 
          email: "m.chen@retailcorp.com",
          phone: null,
          fiveWProgress: {
            why: { completed: true, answer: "Corporate mandate to reduce carbon footprint" },
            what: { completed: true, answer: "Comprehensive energy audit and LEED consulting" },
            when: { completed: false },
            where: { completed: false },
            who: { completed: false }
          },
          specificRequests: "Energy audit for retail chain",
          contextSummary: "RetailCorp facilities director exploring LEED certification",
          conversationHistory: [],
          currentTopic: "when",
          isCompleted: false
        },
        {
          id: "demo-lead-3",
          chatbotId: "demo-chatbot-1",
          name: "Jennifer Rodriguez",
          email: "jen.rodriguez@hospitalgroup.org", 
          phone: "+1-555-0456",
          fiveWProgress: {
            why: { completed: true, answer: "Hospital system wants to reduce operating costs and environmental impact" },
            what: { completed: false },
            when: { completed: false },
            where: { completed: false },
            who: { completed: false }
          },
          specificRequests: "Sustainability solutions for healthcare",
          contextSummary: "Hospital group sustainability coordinator",
          conversationHistory: [],
          currentTopic: "what",
          isCompleted: false
        }
      ];

      await db.insert(leads).values(demoLeads);

      // Demo Firebase topics
      const demoTopics: FirebaseTopic[] = [
        {
          id: "demo-topic-1",
          userId: "demo-user-1",
          leadId: "demo-lead-1",
          topic: "why",
          isCompleted: true,
          completedAt: new Date(Date.now() - 86400000)
        },
        {
          id: "demo-topic-2",
          userId: "demo-user-1",
          leadId: "demo-lead-1", 
          topic: "what",
          isCompleted: true,
          completedAt: new Date(Date.now() - 86400000)
        },
        {
          id: "demo-topic-3",
          userId: "demo-user-1",
          leadId: "demo-lead-2",
          topic: "why",
          isCompleted: true,
          completedAt: new Date(Date.now() - 172800000)
        }
      ];

      await db.insert(firebaseTopics).values(demoTopics);
    } catch (error) {
      console.error("Error initializing demo data:", error);
      // Continue anyway - this is just demo data
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Chatbot methods
  async getChatbot(id: string): Promise<Chatbot | undefined> {
    const [chatbot] = await db.select().from(chatbots).where(eq(chatbots.id, id));
    return chatbot || undefined;
  }

  async getChatbotsByUserId(userId: string): Promise<Chatbot[]> {
    return await db.select().from(chatbots).where(eq(chatbots.userId, userId));
  }

  async createChatbot(insertChatbot: InsertChatbot): Promise<Chatbot> {
    const [chatbot] = await db
      .insert(chatbots)
      .values(insertChatbot)
      .returning();
    return chatbot;
  }

  async updateChatbot(id: string, updates: Partial<InsertChatbot>): Promise<Chatbot> {
    const [chatbot] = await db
      .update(chatbots)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatbots.id, id))
      .returning();
    return chatbot;
  }

  async deleteChatbot(id: string): Promise<void> {
    await db.delete(chatbots).where(eq(chatbots.id, id));
  }

  // Lead methods
  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByChatbotId(chatbotId: string): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.chatbotId, chatbotId));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async searchLeads(chatbotId: string, query: string): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.chatbotId, chatbotId),
          like(leads.name, `%${query}%`)
        )
      );
  }

  async getLeadsByCompletion(chatbotId: string, completed: boolean): Promise<Lead[]> {
    return await db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.chatbotId, chatbotId),
          eq(leads.isCompleted, completed)
        )
      );
  }

  // Firebase topic methods
  async getFirebaseTopics(userId: string, leadId: string): Promise<FirebaseTopic[]> {
    return await db
      .select()
      .from(firebaseTopics)
      .where(
        and(
          eq(firebaseTopics.userId, userId),
          eq(firebaseTopics.leadId, leadId)
        )
      );
  }

  async createFirebaseTopic(insertTopic: InsertFirebaseTopic): Promise<FirebaseTopic> {
    const [topic] = await db
      .insert(firebaseTopics)
      .values({
        ...insertTopic,
        isCompleted: insertTopic.isCompleted ?? false,
      })
      .returning();
    return topic;
  }

  async updateFirebaseTopic(id: string, updates: Partial<InsertFirebaseTopic>): Promise<FirebaseTopic> {
    const [topic] = await db
      .update(firebaseTopics)
      .set(updates)
      .where(eq(firebaseTopics.id, id))
      .returning();
    return topic;
  }
}

export const storage = new DatabaseStorage();