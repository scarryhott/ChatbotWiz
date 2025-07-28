import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const chatbots = pgTable("chatbots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  config: jsonb("config").$type<ChatbotConfig>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  chatbotId: varchar("chatbot_id").notNull().references(() => chatbots.id),
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  fiveWProgress: jsonb("five_w_progress").$type<FiveWProgress>().notNull(),
  specificRequests: text("specific_requests"), // Added for capturing user's specific needs
  contextSummary: text("context_summary"),
  conversationHistory: jsonb("conversation_history").$type<ConversationMessage[]>().default([]),
  currentTopic: text("current_topic").default("why"), // Track which topic user is on
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const firebaseTopics = pgTable("firebase_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  leadId: varchar("lead_id").notNull().references(() => leads.id),
  topic: text("topic").notNull(), // WHY, WHAT, WHEN, WHERE, WHO
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
});

// Type definitions
export interface ChatbotConfig {
  company: {
    name: string;
    ethos: string;
    website?: string;
    knowledgeBase?: string; // Additional context for AI responses
  };
  topics: {
    why: { question: string; completed: boolean; value?: string };
    what: { question: string; completed: boolean; value?: string };
    when: { question: string; completed: boolean; value?: string };
    where: { question: string; completed: boolean; value?: string };
    who: { question: string; completed: boolean; value?: string };
  };
  conversation: {
    customQuestions: {
      WHY: string;
      WHAT: string;
      WHERE: string;
      WHEN: string;
      WHO: string;
    };
    flow: '5W' | 'linear' | 'custom';
    maxFollowUps: number;
  };
  ui: {
    size: "small" | "medium" | "large" | "fullscreen";
    position: "bottom-right" | "bottom-left" | "center" | "custom";
    transparentBackground: boolean;
    scrollMode: boolean; // true for scroll, false for bubbles
    entryAnimation: "slide-up" | "fade-in" | "bounce" | "none";
    typingIndicator: "dots" | "pulse" | "wave" | "disabled";
    autoStartTrigger: "page-load" | "5-second-delay" | "scroll-50" | "exit-intent" | "manual";
    theme: {
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
      textColor: string;
      borderRadius: number;
    };
  };
  ai: {
    initialModel: "gemini-2.5-flash" | "gemini-2.5-pro";
    followUpModel: "gemini-2.5-flash" | "gemini-2.5-pro";
    ethosFilter: string;
  };
  popupTrigger: {
    enabled: boolean;
    message: string; // Dynamic popup message based on website context
    delay: number; // Delay in seconds before showing
  };
}

export interface FiveWProgress {
  why: { completed: boolean; answer?: string };
  what: { completed: boolean; answer?: string };
  when: { completed: boolean; answer?: string };
  where: { completed: boolean; answer?: string };
  who: { completed: boolean; answer?: string };
}

export interface ConversationMessage {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: string;
  topic?: "why" | "what" | "when" | "where" | "who";
}

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatbotSchema = createInsertSchema(chatbots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFirebaseTopicSchema = createInsertSchema(firebaseTopics).omit({
  id: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type Chatbot = typeof chatbots.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type FirebaseTopic = typeof firebaseTopics.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertFirebaseTopic = z.infer<typeof insertFirebaseTopicSchema>;
