import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  sessionId: varchar("session_id").notNull(), // Session ID for tracking non-logged users
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  fiveWProgress: jsonb("five_w_progress").$type<FiveWProgress>().notNull(),
  specificRequests: text("specific_requests"), // Added for capturing user's specific needs
  contextSummary: text("context_summary"),
  conversationHistory: jsonb("conversation_history").$type<ConversationMessage[]>().default([]),
  currentTopic: text("current_topic").default("why"), // Track which topic user is on
  extractedInfo: jsonb("extracted_info").$type<Record<string, any>>().default({}), // Info extracted when green checkmark appears
  completedTopics: jsonb("completed_topics").$type<Array<string>>().default([]), // Topics that got green checkmarks
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

// Topic completion tracking (replaced Firebase functionality)
export const topicCompletions = pgTable("topic_completions", {
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
  why: { completed: boolean; value?: string };
  what: { completed: boolean; value?: string };
  when: { completed: boolean; value?: string };
  where: { completed: boolean; value?: string };
  who: { completed: boolean; value?: string };
}

export interface ConversationMessage {
  id: string;
  type: "bot" | "user";
  content: string;
  timestamp: string;
  topic?: "why" | "what" | "when" | "where" | "who";
}

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
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

export const insertTopicCompletionSchema = createInsertSchema(topicCompletions).omit({
  id: true,
});

// Select types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type Chatbot = typeof chatbots.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type TopicCompletion = typeof topicCompletions.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertTopicCompletion = z.infer<typeof insertTopicCompletionSchema>;
