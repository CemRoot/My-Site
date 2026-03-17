<div align="center">

# 🌐 Tech News Automation Platform

### AI-Powered News Aggregation & Distribution System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://vercel.com)
[![Sentry](https://img.shields.io/badge/Monitored%20by-Sentry-362d59?logo=sentry)](https://sentry.io)

[Live Demo](https://cemkoyluoglu.codes) · [Report Bug](https://github.com/CemRoot/My-Site/issues) · [Request Feature](https://github.com/CemRoot/My-Site/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Telegram Bot](#-telegram-bot-control-center)
- [Automation](#-automation-workflows)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [Monitoring](#-monitoring--observability)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)

---

## 🎯 Overview

**Tech News Platform** is an enterprise-grade, fully automated news aggregation and distribution system that combines cutting-edge AI, intelligent scraping, and seamless automation to deliver tech news in real-time.

### 🌟 What Makes This Special?

- **🤖 AI-Powered**: Multi-AI system (Groq Llama 3.3 + Google Gemini 2.0 Flash)
- **💬 AI Chatbot**: Interactive portfolio chatbot with n8n fallback
- **📱 Telegram Control Center**: Full system control from your phone
- **📧 Newsletter System**: Email subscription and newsletter management
- **🔄 100% Automated**: GitHub Actions + n8n + Vercel integration
- **📊 Production-Ready**: Sentry monitoring, health checks, deployment tracking
- **⚡ Lightning Fast**: Supabase backend, optimized queries
- **🔒 Enterprise Security**: Rate limiting, API secrets, fail-safe mechanisms

---

## ✨ Key Features

### 🗞️ News Aggregation System

<table>
<tr>
<td width="50%">

#### Intelligent Scraping
- Multi-category support (7+ categories)
- Smart rate limiting (respects API limits)
- Duplicate detection & prevention
- Source attribution & tracking
- Original article link preservation
- **Manual article scraper via Telegram**

</td>
<td width="50%">

#### AI Translation & Processing
- Turkish → English translation (Groq AI)
- **Google Gemini 2.0 Flash** for content optimization
- Context-aware processing
- Social media embed preservation
- Markdown formatting retention
- **Smart content quality validation**

</td>
</tr>
</table>

### 💬 AI Chatbot System

<table>
<tr>
<td width="50%">

#### Portfolio Chatbot
- **Groq AI (Llama 3.3 70B)** primary backend
- **n8n fallback** for high availability
- Chat history persistence (Supabase)
- Session management
- Rate limiting protection

</td>
<td width="50%">

#### Smart Features
- Context-aware responses
- Page context integration
- Multi-language support
- Real-time conversation tracking
- Automatic session cleanup

</td>
</tr>
</table>

### 🤖 Telegram Bot Control Center

<table>
<tr>
<td width="50%">

#### Interactive Menu System
- 📰 Manual scraping trigger
- ➕ Manual article addition
- 🔧 System Management
  - 🤖 n8n trial tracking
  - 🔄 Webhook reset
  - 🏥 Health checks
- 📊 Real-time statistics
- 💾 Database management
- 📱 LinkedIn digest management

</td>
<td width="50%">

#### Automated Notifications
- ✅ Success reports
- ❌ Error alerts with details
- 📈 Daily health summaries
- 🚀 Deployment notifications
- 🚨 Vercel status alerts
- 📱 Real-time updates

</td>
</tr>
</table>

### 📧 Newsletter System

- Email subscription management
- Subscriber data storage (Supabase + JSON backup)
- Rate limiting protection
- Input validation

### 🔄 Full Automation

- **Scheduled Scraping**: 3x daily on weekdays (09:30, 13:00, 16:00 UTC)
- **Manual Article Scraper**: On-demand article processing via Telegram
- **LinkedIn Digest**: Daily automated post generation (via n8n)
- **Vercel Status Monitor**: 30-min interval platform health checks
- **Auto Deployment**: Vercel CI/CD with post-build hooks

---

## 🏗️ Architecture

> **Enterprise-Grade System Design** following Google Cloud Architecture best practices

### 📊 Component Architecture

| Layer | Components | Technology | Purpose |
|-------|-----------|------------|---------|
| **Edge** | CDN, Cache | Vercel Edge Network | Global content delivery, <100ms latency |
| **Frontend** | React SPA, UI Components | React 18, TypeScript, Vite | User interface, real-time updates |
| **API Gateway** | Serverless Functions | Vercel Edge Functions | Request routing, authentication |
| **Orchestration** | Workflows, Schedulers | GitHub Actions, n8n | Automation, scheduled tasks |
| **AI/ML** | Translation, Chat, Generation | Groq AI, Google Gemini, Firecrawl | Content processing, intelligence |
| **Observability** | Monitoring, Logging | Sentry, Custom Health Checks | Error tracking, performance monitoring |
| **Data** | Database, Storage | Supabase PostgreSQL | Persistent storage, real-time sync |
| **Communication** | Messaging, Notifications | Telegram Bot, LinkedIn API | User interaction, distribution |

### 🗂️ System Components

| Layer | Component | Technology | Purpose |
|-------|-----------|------------|---------|
| **Frontend** | React SPA | React 18.3 + TypeScript 5.9 | Modern, responsive UI |
| | Build Tool | Vite 6.4 | Fast build & HMR |
| | Styling | Tailwind CSS 4 (CSS-first) | Utility-first styling |
| **Backend** | API Gateway | Vercel Edge Functions | Serverless endpoints |
| | Webhooks | Telegram, Deployment | Event handling |
| **Database** | Primary DB | Supabase PostgreSQL | Structured data storage |
| | Chat History | Supabase | Conversation persistence |
| **AI/ML** | Translation | Groq AI (Llama 3.3 70B) | Multi-language support |
| | Content Gen | Google Gemini 2.0 Flash | Article processing |
| | Chat Widget | Groq AI + n8n fallback | User interaction |
| | Web Scraping | Firecrawl API | Article extraction |
| **Observability** | Error Tracking | Sentry 7.119 | Frontend & backend |
| | Health Checks | Custom Scripts | System monitoring |
| **Communication** | Bot Platform | Telegram Bot API | Interactive control |
| | Social Media | LinkedIn API (n8n OAuth) | Content distribution |
| | Email | Newsletter System | Subscriber management |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3 | UI Framework |
| **TypeScript** | 5.9 | Type Safety |
| **Vite** | 6.4 | Build Tool |
| **Tailwind CSS** | 4.x (CSS-first) | Styling |
| **Radix UI** | Selective | Dialog, Checkbox, Separator |
| **React Router** | 7.9 | Navigation |
| **React Markdown** | 10.1 | Content Rendering |

### Backend & APIs
| Service | Purpose | Notes |
|---------|---------|-------|
| **Supabase** | PostgreSQL Database | Free/Pro tier |
| **Groq AI** | Translation & Chat | Llama 3.3 70B |
| **Google Gemini** | Content Generation | 2.0 Flash |
| **Firecrawl** | Web Scraping | 500/mo free |
| **n8n** | Workflow Automation | Self-hosted/Cloud |
| **Telegram Bot API** | Notifications & Control | Unlimited |
| **GitHub Actions** | CI/CD & Automation | 2000 min/mo free |
| **Sentry** | Error Tracking | 5K errors/mo |

### Infrastructure
| Platform | Purpose | Cost |
|----------|---------|------|
| **Vercel** | Hosting & Edge Functions | Free/Pro |
| **GitHub** | Version Control & Actions | Free |

---

## 🚀 Quick Start

### Prerequisites

```bash
node >= 20.0.0
npm >= 10.0.0
git >= 2.40.0
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/CemRoot/My-Site.git
cd My-Site

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# 4. Add your API keys to .env
# See Configuration section below

# 5. Start development server
npm run dev
```

### First-Time Setup

```bash
# Setup Telegram bot menu
npm run telegram:setup-menu

# Run initial health check
npm run health:check
```

---

## 📱 Telegram Bot Control Center

### Features

The Telegram bot provides complete system control from your mobile device:

```
┌─────────────────────────────────┐
│     🤖 TECH NEWS BOT MENU       │
├─────────────────────────────────┤
│  📰 Haberleri Çek               │
│  📱 LinkedIn Posts              │
│  🏥 Sağlık Kontrolü             │
│  📊 Sistem Durumu               │
│  📈 İstatistikler               │
│  🔧 GitHub Actions              │
│  💾 Veritabanı                  │
│  🔄 Menüyü Yenile               │
│  ℹ️ Yardım                      │
└─────────────────────────────────┘
```

### Available Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize bot and show menu |
| `/menu` | Display main control menu |
| `/linkedin` | LinkedIn digest management |
| `/status` | Quick system status |
| `/scrape` | Trigger news scraping |
| `/health` | Run health check |
| `/help` | Show help and commands |

### Setup

```bash
# 1. Create Telegram bot with @BotFather
# 2. Get bot token and chat ID
# 3. Add to environment variables
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# 4. Setup bot menu
npm run telegram:setup-menu

# 5. Test in Telegram
# Send: /start
```

---

## 🔄 Automation Workflows

### Scheduled Jobs

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| **Scrape Tech News** | 09:30, 13:00, 16:00 UTC (M-F) | Collect & translate news |
| **Manual Article Scraper** | On-demand via Telegram | Process single articles |
| **System Health Check** | 08:00 UTC (Daily) | Monitor system health |
| **Vercel Status Monitor** | Every 30 minutes | Monitor Vercel platform status |
| **LinkedIn Digest** | Daily via n8n | Generate & post digest |

### Manual Triggers

All workflows can be triggered manually:

```bash
# Via Telegram Bot
/menu      # Open interactive menu
/scrape    # Trigger news scraping
/health    # Run health check
/linkedin  # Manage LinkedIn digests

# Via npm scripts
npm run scrape:news          # Manual scraping
npm run health:check         # Health check
npm run vercel:status        # Check Vercel status
```

---

## ⚙️ Configuration

### Environment Variables

#### Required for Development

```env
# AI Services
GROQ_API_KEY=gsk_your_key_here                    # Groq AI for translation & chat
FIRECRAWL_API_KEY=fc-your_key_here                # Firecrawl for scraping
GEMINI_API_KEY=your_gemini_key_here               # Google Gemini for content gen

# Database
NEXT_PUBLIC_SUPABASE_URL=https://...              # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...              # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...                  # Service role key (admin)

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456:ABC...                  # Bot token from @BotFather
TELEGRAM_CHAT_ID=123456789                        # Your chat ID
```

#### Optional (Production)

```env
# Security
TELEGRAM_CONTROL_API_SECRET=random_key            # API endpoint security
DEPLOYMENT_WEBHOOK_SECRET=random_hex              # Deployment webhook security

# Sentry Error Tracking
VITE_SENTRY_DSN=https://key@org.ingest.sentry.io/project
SENTRY_DSN=https://key@org.ingest.sentry.io/project

# GitHub Integration
GITHUB_TOKEN=ghp_...                              # For workflow triggers
GITHUB_REPOSITORY=username/repo                   # Repository name

# n8n Integration
N8N_LINKEDIN_WORKFLOW_WEBHOOK=https://...         # LinkedIn digest workflow
N8N_CHATBOT_WEBHOOK=https://...                   # Chatbot fallback webhook
```

### GitHub Secrets

Add these in: `Repository Settings → Secrets and variables → Actions`

```
GROQ_API_KEY
FIRECRAWL_API_KEY
GEMINI_API_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

---

## 🚢 Deployment

### Vercel (Recommended)

#### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CemRoot/My-Site)

#### Manual Deploy

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Deploy to production
vercel --prod
```

### Post-Deployment

```bash
# Automatic (via postbuild hook)
# - Bot commands configured
# - Telegram notification sent
# - Menu updated

# Manual setup (if needed)
npm run telegram:setup-menu
```

---

## 📊 Monitoring & Observability

### 🔍 Error Tracking (Sentry)

**Real-time error monitoring across frontend and backend:**

- Automatic error capture (React Error Boundaries)
- Performance monitoring (Core Web Vitals)
- Session replay
- Source maps for readable stack traces
- Release tracking per deployment

### 🏥 Health Checks

```bash
# Comprehensive system health check
npm run health:check

# Automated (daily at 08:00 UTC)
✅ Supabase database connectivity
✅ Firecrawl API availability  
✅ Groq AI API status
✅ Telegram Bot responsiveness
✅ Vercel platform health
✅ Recent article metrics
```

### 📱 Telegram Notifications

| Event | Notification Type | Frequency |
|-------|------------------|-----------|
| ✅ **Scraping Success** | Success report + stats | Per workflow run |
| ❌ **Scraping Errors** | Error details + logs | Immediate |
| 🏥 **Health Reports** | System status summary | Daily |
| 🚀 **Deploy Success** | Deployment confirmed | Per deployment |
| 🚨 **Vercel Incidents** | Platform status alerts | Real-time |

---

## 📁 Project Structure

```
My-Site/
├── api/                          # Vercel Serverless Functions
│   ├── lib/                      # Shared API modules
│   │   ├── supabaseAdmin.js      # Shared Supabase admin client
│   │   ├── telegram.js           # Shared Telegram utilities
│   │   ├── chatHelpers.js        # Chat endpoint helpers
│   │   └── chatSystemPrompt.js   # AI system prompt
│   ├── chat.js                   # AI Chatbot endpoint
│   ├── tech-news.js              # News API (Edge Runtime)
│   ├── telegram-webhook.js       # Telegram bot webhook
│   ├── telegram-control.js       # Bot control endpoint
│   ├── newsletter.js             # Newsletter subscription
│   ├── og-meta.js                # Dynamic Open Graph meta
│   ├── deployment-webhook.js     # Deploy notifications
│   ├── frontend-health-monitor.js# Error monitoring
│   ├── conversation-state.js     # Telegram state management
│   └── revalidate-news.js        # News cache revalidation
├── docs/                         # Workflow & SQL references
│   ├── n8n-chatbot-ai.json
│   ├── n8n-linkedin-unified-workflow.json
│   ├── n8n-linkedin-digest-for-groups.json
│   └── supabase-*.sql            # Database schema files
├── lib/                          # Server-side shared libraries
│   ├── rate-limit.js             # Rate limiting
│   ├── sentry-server.js          # Sentry integration
│   ├── supabase.js               # Database client
│   └── conversation-state.js     # Conversation state logic
├── scripts/                      # Automation & CI scripts
│   ├── lib/                      # Shared script modules
│   │   ├── config.js             # Centralized env config
│   │   ├── supabaseAdmin.js      # Shared Supabase client
│   │   ├── telegram.js           # Shared Telegram utilities
│   │   ├── scraper/              # News scraper sub-modules
│   │   │   ├── config.js         # Scraper configuration
│   │   │   ├── database.js       # Article storage & dedup
│   │   │   ├── dateUtils.js      # Date parsing utilities
│   │   │   └── translator.js     # AI translation pipeline
│   │   └── menu/                 # Telegram bot menu modules
│   │       └── keyboards.js      # Keyboard layouts
│   ├── news-scraper.js           # News scraping orchestrator
│   ├── telegram-menu-handler.js  # Telegram bot menu handler
│   ├── manual-article-scraper.js # Manual article processing
│   ├── system-health-check.js    # Health monitoring
│   ├── validation/               # Content validation
│   └── translate/                # Translation prompts
├── src/                          # React Frontend
│   ├── components/               # UI Components
│   │   ├── ui/                   # shadcn/radix primitives
│   │   ├── chat/                 # Chat widget sub-components
│   │   ├── embeds/               # Social media embeds
│   │   └── markdown/             # Markdown rendering
│   ├── pages/                    # Page components
│   ├── lib/                      # Frontend shared modules
│   │   ├── constants/            # Centralized constants
│   │   ├── types/                # Shared TypeScript types
│   │   ├── hooks/                # Custom React hooks
│   │   ├── utils/                # Utility functions
│   │   └── context/              # React context providers
│   └── styles/                   # CSS files
└── public/                       # Static assets
```

---

## 📜 Scripts Reference

### Development
```bash
npm run dev                     # Start dev server (port 3000)
npm run build                   # Production build
```

### Tech News System
```bash
npm run scrape:news             # Manual news scraping
npm run cleanup:db              # Clean up old/invalid articles
```

### LinkedIn Automation
```bash
npm run linkedin:analyze        # Analyze content for posting
npm run linkedin:post           # Post to LinkedIn
npm run linkedin:test           # Test LinkedIn workflow
npm run linkedin:groups         # Daily LinkedIn groups digest
npm run linkedin:groups-weekly  # Weekly LinkedIn groups digest
```

### Telegram Bot
```bash
npm run telegram:setup-menu     # Setup bot menu
npm run telegram:webhook-setup  # Configure webhook
npm run telegram:webhook-remove # Remove webhook
npm run telegram:reset          # Reset webhook & clear queue
npm run telegram:check          # Check webhook status
```

### n8n Trial Management
```bash
npm run n8n:status              # Check trial status
npm run n8n:check               # Check & send notification
npm run n8n:reset               # Reset trial period
```

### Monitoring
```bash
npm run health:check            # System health check
npm run vercel:status           # Check Vercel status
```

---

## 🔒 Security

### Reporting Vulnerabilities

Please report security vulnerabilities to: **cemkoyluoglu@icloud.com**

### Security Features

- ✅ **API Rate Limiting** (10 requests/minute per user)
- ✅ **UUID Validation** (RFC 4122 compliant)
- ✅ **Chat ID Authorization** (Telegram webhook)
- ✅ **Environment Variable Encryption**
- ✅ **Webhook Signature Verification**
- ✅ **SQL Injection Prevention** (Parameterized queries)
- ✅ **XSS Protection** (HTML sanitization)
- ✅ **CORS Configuration** (Origin whitelisting)

---

## 🎯 Roadmap

### ✅ Completed
- [x] Multi-category news scraping
- [x] AI-powered translation (Groq)
- [x] Google Gemini content generation
- [x] AI Chatbot with n8n fallback
- [x] Telegram bot control system
- [x] GitHub Actions automation
- [x] Supabase migration
- [x] Health monitoring system
- [x] LinkedIn digest automation
- [x] Newsletter system
- [x] Manual article scraper
- [x] Chat history persistence
- [x] Smart content validation

### 🚧 In Progress
- [ ] RSS feed generation
- [ ] Article search functionality
- [ ] Advanced analytics dashboard

### 📋 Planned
- [ ] Multi-language support (Spanish, French)
- [ ] Mobile app (React Native)
- [ ] AI-powered article summarization
- [ ] Newsletter email delivery

---

## 🤝 Contributing

We welcome contributions! 

### Development Workflow

```bash
# 1. Fork the repository
# 2. Create your feature branch
git checkout -b feature/AmazingFeature

# 3. Commit your changes
git commit -m 'Add some AmazingFeature'

# 4. Push to the branch
git push origin feature/AmazingFeature

# 5. Open a Pull Request
```

---

## 🏆 Acknowledgments

- [Groq AI](https://groq.com/) - Lightning-fast AI inference
- [Google Gemini](https://ai.google.dev/) - Advanced content generation
- [Firecrawl](https://firecrawl.dev/) - Reliable web scraping
- [Supabase](https://supabase.com/) - Open-source Firebase alternative
- [Vercel](https://vercel.com/) - Seamless deployment platform
- [n8n](https://n8n.io/) - Workflow automation
- [Telegram](https://telegram.org/) - Secure messaging platform

---

## 📞 Contact & Support

<div align="center">

### Dr. Cem Koyluoglu (CK)

[![Email](https://img.shields.io/badge/Email-cemkoyluoglu%40icloud.com-red?style=for-the-badge&logo=gmail)](mailto:cemkoyluoglu@icloud.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Cem%20Koyluoglu-blue?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/cem-koyluoglu/)
[![GitHub](https://img.shields.io/badge/GitHub-CemRoot-black?style=for-the-badge&logo=github)](https://github.com/CemRoot)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-%2B353%2087%20344%205918-green?style=for-the-badge&logo=whatsapp)](https://wa.me/353873445918)

📍 **Dublin, Ireland** | 🌍 **Available Worldwide**

</div>

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Cem Koyluoglu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

<div align="center">

### ⭐ If you find this project useful, please consider giving it a star!

**Made with ❤️ in Dublin, Ireland**

[⬆ Back to Top](#-tech-news-automation-platform)

---

**Last Updated**: March 16, 2026 | **Version**: 3.0.0

[![Built with Love](https://img.shields.io/badge/Built%20with-❤️-red?style=flat-square)](https://github.com/CemRoot/My-Site)
[![Maintained](https://img.shields.io/badge/Maintained-Yes-green?style=flat-square)](https://github.com/CemRoot/My-Site)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](http://makeapullrequest.com)

</div>
