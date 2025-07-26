# Replit.md

## Overview

This is a full-stack TypeScript application for an AI-powered chatbot creation and management platform called "wwwwwai". The application allows users to create, configure, and deploy customizable chatbots that use a "5W framework" (Why, What, When, Where, Who) to guide conversations and collect leads. The system features real-time chat capabilities, AI-powered website analysis, comprehensive lead management, and a toggleable widget UI for seamless website integration.

## Recent Changes (January 26, 2025)

✓ **Enhanced Gemini AI Integration** - Implemented real-time AI responses with intelligent topic switching
✓ **Toggleable Widget UI** - Created collapsible chat widget with minimize/maximize functionality  
✓ **5W Conversation Flow** - Built structured conversation management with visual progress indicators
✓ **Complete Installation System** - Added embed code generation for multiple platforms (HTML, WordPress, React, Shopify)
✓ **Configuration Adapter** - Built seamless bridge between database config and chatbot requirements
✓ **Universal Embed Script** - Generated embeddable JavaScript with customizable positioning and styling
✓ **Intelligent Topic Switching** - AI now switches to appropriate topic tab BEFORE responding, ensuring conversation continuity
✓ **Give Before Take Philosophy** - AI provides value, expertise, and solutions before asking for user information

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and build processes
- **Routing**: Wouter for client-side routing
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Database Provider**: Neon Database (@neondatabase/serverless) with connection pooling
- **AI Integration**: Google Gemini AI for website analysis and chat responses
- **Storage Layer**: DatabaseStorage implementing IStorage interface for all CRUD operations

### Project Structure
- `client/`: Frontend React application
- `server/`: Backend Express application
- `shared/`: Shared types, schemas, and utilities
- `migrations/`: Database migration files

## Key Components

### Database Schema
- **Users**: Basic user authentication (id, username, password)
- **Chatbots**: Complete chatbot configurations with JSONB config storage
- **Leads**: Customer interactions with 5W progress tracking and conversation history
- **Firebase Topics**: Topic completion tracking for push notifications
- **Database Features**: Auto-generated UUIDs, timestamps, foreign key relationships, JSONB for complex data

### AI Services
- **Website Analyzer**: Analyzes websites to extract company information, ethos, and generates chatbot configurations
- **Gemini Integration**: Handles chat responses, website analysis, and chatbot personality generation
- **5W Framework**: Structured conversation flow (Why, What, When, Where, Who) for lead qualification

### Frontend Features
- **Dashboard**: Main interface for managing chatbots and viewing analytics
- **Chatbot Preview**: Real-time preview of chatbot conversations
- **Configuration Tabs**: Multi-tab interface for chatbot setup, UI customization, AI settings, and installation
- **Lead Management**: Comprehensive lead tracking with search, sorting, and filtering
- **UI Customization**: Extensive chatbot appearance and behavior customization options

## Data Flow

1. **User Authentication**: Users log in and are assigned a session
2. **Chatbot Creation**: Users create chatbots by providing website URLs
3. **AI Analysis**: Gemini AI analyzes the website and generates chatbot configuration
4. **Configuration**: Users customize chatbot appearance, behavior, and conversation flow
5. **Deployment**: Chatbots are deployed and can be embedded on websites
6. **Lead Collection**: Conversations follow the 5W framework to collect qualified leads
7. **Analytics**: Progress tracking and lead management through the dashboard

## External Dependencies

### AI and Analytics
- **Google Gemini AI**: Website analysis, chat responses, and content generation
- **Firebase**: Push notifications for topic completion tracking

### Database and Storage
- **Neon Database**: PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database queries and migrations

### UI and Styling
- **Radix UI**: Accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Replit Integration**: Development environment integration with cartographer and error handling
- **ESBuild**: Production bundling for server code
- **TypeScript**: Type safety across the entire stack

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- Express server with automatic restart via tsx
- Replit-specific development tooling and error overlays

### Production Build
- Frontend: Vite builds static assets to `dist/public`
- Backend: ESBuild bundles server code to `dist/index.js`
- Database: Drizzle migrations handle schema changes

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY`: Google AI API access
- `NODE_ENV`: Environment configuration

### Deployment Architecture
- Single repository with frontend and backend
- Static file serving through Express in production
- Database migrations run via `npm run db:push`
- Environment-specific configuration through process.env

The application is designed to be deployed on platforms like Replit, with automatic builds and seamless development-to-production workflows.