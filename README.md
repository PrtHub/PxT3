# PxT3: High-Performance AI Chat App

PxT3 is a cutting-edge AI chat application built with the latest web technologies. It leverages the power of Next.js 15, Drizzle ORM, and Neon's serverless database to deliver a seamless, real-time chat experience with AI models. The application features a beautiful, responsive UI built with shadcn/ui and Tailwind CSS.

## 🚀 Features

### 🤖 AI & Chat
- **Multi-LLM Support**: Chat with various AI models including OpenAI, Gemini, and more
- **Real-time Streaming**: Experience fluid, real-time responses with streaming support
- **Code & Markdown Support**: Beautiful syntax highlighting and markdown rendering
- **Gemini Integration**: Generate images using Google's Gemini models
- **Web Search**: Get up-to-date information with integrated web search

### 💬 Chat Experience
- **Chat Branching**: Explore different conversation paths with branching
- **Conversation Sharing**: Share your chats via unique links
- **File Attachments**: Upload and share files in your conversations
- **Message Editing**: Edit and refine your messages
- **Context-Aware**: Maintains conversation context for more coherent discussions

### 🔐 Authentication & Data
- **Secure Authentication**: Built with NextAuth.js
- **Chat History**: Your conversations are saved and synced across devices
- **BYOK (Bring Your Own Key)**: Use your own API keys for LLM providers

### 🎨 UI/UX
- **Responsive Design**: Works on desktop and mobile
- **Accessible**: Built with accessibility in mind

## 🛠️ Tech Stack

### Core
- **Framework**: Next.js 15 with App Router
- **Database**: Neon (PostgreSQL) with Drizzle ORM
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **API Layer**: tRPC & Next JS API Routes for end-to-end typesafe APIs

### Frontend
- **Styling**: Tailwind CSS with shadcn/ui components
- **Icons**: Lucide Icons & React Icons
- **UI Components**: Radix UI Primitives
- **Form Handling**: React Hook Form with Zod validation
- **Markdown**: React Markdown with remark-gfm
- **Code Highlighting**: React Syntax Highlighter

### AI & Integrations
- **LLM Providers**: OpenAI, Gemini, OpenRouter support
- **Image Handling**: ImageKit integration

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & Bun (recommended) or npm
- PostgreSQL database (or use Neon's serverless Postgres)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PrtHub/PxT3
   cd pxt3
   ```

2. Install dependencies:
   ```bash
   # Using Bun (recommended)
   bun install
   
   # Or using npm
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   # Update the environment variables in .env.local
   ```

4. Run database migrations:
   ```bash
   bun run db:push
   ```

5. Start the development server:
   ```bash
   bun dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) to get started.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

> "A conversation that flows as fast as you can think, with real-time streaming and a UI that never gets in your way."
