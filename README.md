<div align="center">

# 🌐 Tech News Automation Platform

### AI-Powered News Aggregation & Distribution System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://vercel.com)

[Live Demo](https://cemkoyluoglu.codes) · [Documentation](#-documentation) · [Report Bug](https://github.com/CemRoot/My-Site/issues) · [Request Feature](https://github.com/CemRoot/My-Site/issues)

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
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [Security](#-security)
- [License](#-license)

---

## 🎯 Overview

**Tech News Platform** is an enterprise-grade, fully automated news aggregation and distribution system that combines cutting-edge AI, intelligent scraping, and seamless automation to deliver tech news in real-time.

### 🌟 What Makes This Special?

- **🤖 AI-Powered**: Unlimited-length translation using Groq AI (Llama 3.3 70B)
- **📱 Telegram Control Center**: Full system control from your phone
- **🔄 100% Automated**: GitHub Actions + Vercel integration
- **📊 Production-Ready**: Monitoring, health checks, error handling
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

</td>
<td width="50%">

#### AI Translation
- Turkish → English translation
- Context-aware processing
- Social media embed preservation
- Markdown formatting retention
- Quality validation checks

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
- 🏥 System health checks
- 📊 Real-time statistics
- 💾 Database management
- 🔧 GitHub Actions control
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

### 🔄 Full Automation

- **Scheduled Scraping**: 3x daily on weekdays (09:30, 13:00, 16:00 UTC)
- **Manual Article Scraper**: On-demand article processing via Telegram
- **LinkedIn Digest**: Daily automated post generation (16:30 UTC via n8n)
- **Vercel Status Monitor**: 30-min interval platform health checks
- **Auto Deployment**: Vercel CI/CD with post-build hooks
- **Self-Healing**: Automatic retries, fallback mechanisms
- **Monitoring**: System health tracking, API status checks, RSS monitoring
- **GitHub Integration**: Workflow triggers, status reporting

### 💼 Portfolio Website

- Modern liquid glass design
- AI-powered chat widget (Groq)
- Responsive & accessible
- SEO optimized
- Dark/Light theme support

---

## 🏗️ Architecture

### System Overview

```mermaid
%%{init: {"theme": "base", "themeVariables": {"primaryColor":"#0ea5e9","primaryTextColor":"#fff","primaryBorderColor":"#0284c7","lineColor":"#64748b","secondaryColor":"#22c55e","tertiaryColor":"#f59e0b"}}}%%

graph TB
    subgraph CLIENT["🌐 Client Layer"]
        A[React SPA]
        B[Tech News UI]
        C[Portfolio]
    end

    subgraph API["⚡ Vercel Serverless"]
        D[Telegram Webhook]
        E[Menu Handler]
        F[Tech News API]
    end

    subgraph AUTO["🤖 Automation"]
        G[GitHub Actions<br/>News Scraping]
        H[n8n Workflows<br/>LinkedIn Digest]
    end

    subgraph AI["🧠 AI Services"]
        I[Groq AI<br/>Translation]
        J[OpenAI<br/>Digest Generation]
        K[Firecrawl<br/>Web Scraping]
    end

    subgraph DATA["💾 Data Layer"]
        L[(Supabase<br/>PostgreSQL)]
    end

    subgraph MSG["📱 Messaging"]
        M[Telegram Bot]
    end

    A --> F
    B --> L
    M --> D
    D --> E
    E --> H
    G --> K
    G --> I
    G --> L
    H --> J
    H --> L
    H --> M
    K --> L
    I --> L

    style CLIENT fill:#0ea5e9,stroke:#0284c7,color:#fff
    style API fill:#22c55e,stroke:#16a34a,color:#fff
    style AUTO fill:#f59e0b,stroke:#d97706,color:#fff
    style AI fill:#a78bfa,stroke:#7c3aed,color:#fff
    style DATA fill:#64748b,stroke:#475569,color:#fff
    style MSG fill:#ef4444,stroke:#b91c1c,color:#fff
```

---

### 📊 LinkedIn Digest Workflow (n8n)

```mermaid
%%{init: {"theme": "base"}}%%

graph LR
    subgraph TRIGGER["🎯 Triggers"]
        T1[Daily Schedule<br/>16:30 UTC]
        T2[Manual /linkedin]
        T3[Callback Approve/Reject/Edit]
    end

    subgraph PROCESS["⚙️ Processing"]
        P1[Fetch Articles<br/>from Supabase]
        P2[OpenAI GPT-4<br/>Generate Digest]
        P3[Save to Database<br/>status: pending]
    end

    subgraph ACTION["✅ Actions"]
        A1[Edit Content<br/>Conversation State]
        A2[Approve<br/>Post to LinkedIn]
        A3[Reject<br/>Mark as Rejected]
    end

    subgraph OUTPUT["📤 Output"]
        O1[Telegram<br/>Digest Message]
        O2[LinkedIn<br/>Professional Post]
        O3[Supabase<br/>Status Updated]
    end

    T1 --> P1
    T2 --> P1
    P1 --> P2
    P2 --> P3
    P3 --> O1
    O1 --> T3
    T3 --> A1
    T3 --> A2
    T3 --> A3
    A1 --> A2
    A2 --> O2
    A2 --> O3
    A3 --> O3

    style TRIGGER fill:#0ea5e9,stroke:#0284c7,color:#fff
    style PROCESS fill:#22c55e,stroke:#16a34a,color:#fff
    style ACTION fill:#f59e0b,stroke:#d97706,color:#fff
    style OUTPUT fill:#a78bfa,stroke:#7c3aed,color:#fff
```

---

### 🔄 Data Flow

```mermaid
%%{init: {"theme": "base"}}%%

sequenceDiagram
    participant U as 👤 User (Telegram)
    participant V as ⚡ Vercel
    participant N as 🤖 n8n
    participant AI as 🧠 OpenAI
    participant DB as 💾 Supabase
    participant LI as 💼 LinkedIn

    Note over U,LI: Daily Digest Creation
    N->>DB: Fetch today's articles
    DB-->>N: Return articles
    N->>AI: Generate digest
    AI-->>N: Optimized content
    N->>DB: Save (status: pending)
    N->>U: Send for approval

    Note over U,LI: User Interaction
    U->>V: Click "Edit"
    V->>DB: Set conversation state
    V->>U: Show content
    U->>V: Send edited text
    V->>DB: Update edited_content
    V->>U: Show Approve button

    Note over U,LI: LinkedIn Posting
    U->>V: Click "Approve"
    V->>N: Forward callback
    N->>DB: Fetch digest
    N->>N: Clean markdown
    N->>LI: Post content
    LI-->>N: Post ID
    N->>DB: Update (status: posted)
    N->>U: Success message
```

---

### 🗂️ Key Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | User interface & portfolio |
| **Backend** | Vercel Serverless Functions | API endpoints & webhooks |
| **Database** | Supabase (PostgreSQL) | Data storage & real-time subscriptions |
| **Automation** | GitHub Actions + n8n | Scheduled tasks & workflows |
| **AI Translation** | Groq AI (Llama 3.3 70B) | Turkish → English translation |
| **AI Digest** | OpenAI GPT-4o-mini | LinkedIn content generation |
| **Web Scraping** | Firecrawl API | Article extraction |
| **Messaging** | Telegram Bot API | Interactive control & notifications |
| **Hosting** | Vercel Edge Network | Global CDN & serverless deployment |

---

### 🔐 Security Architecture

- **API Keys**: Stored in GitHub Secrets & Vercel Environment Variables
- **Rate Limiting**: Implemented in Vercel Edge Functions
- **Webhook Validation**: Telegram webhook signature verification
- **Database Security**: Row Level Security (RLS) in Supabase
- **Conversation State**: Time-limited sessions (10 minutes)
- **Callback Deduplication**: Prevents infinite loops & retries

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3 | UI Framework |
| **TypeScript** | 5.0 | Type Safety |
| **Vite** | 6.3 | Build Tool |
| **Tailwind CSS** | 3.x | Styling |
| **Radix UI** | Latest | Components |
| **React Router** | 7.9 | Navigation |
| **React Markdown** | 10.1 | Content Rendering |

### Backend & APIs
| Service | Purpose | Tier |
|---------|---------|------|
| **Supabase** | PostgreSQL Database | Free/Pro |
| **Groq AI** | Translation & Chat | Free |
| **OpenAI** | LinkedIn Digest Generation | Free Credits |
| **Firecrawl** | Web Scraping | Free (500/mo) |
| **n8n** | Workflow Automation | Free/Self-hosted |
| **Telegram Bot API** | Notifications & Control | Free |
| **GitHub Actions** | CI/CD & Automation | Free |

### Infrastructure
| Platform | Purpose | Cost |
|----------|---------|------|
| **Vercel** | Hosting & Edge Functions | Free/Pro |
| **GitHub** | Version Control & Actions | Free |
| **Cloudflare** | DNS & CDN (optional) | Free |

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

# Test translation system
npm run test:translation
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

LinkedIn Posts Sub-Menu:
┌─────────────────────────────────┐
│  🚀 Manuel Digest Oluştur       │
│  📊 Pending Digests             │
│  ✅ Posted Digests              │
│  🔙 Ana Menü                    │
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
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id

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
| **LinkedIn Digest** | 16:30 UTC (Daily) | Generate & post digest (n8n) |

### Manual Triggers

All workflows can be triggered manually:

```bash
# Via GitHub Actions UI
Actions → [Workflow Name] → Run workflow

# Via Telegram Bot
/menu      # Open interactive menu
/scrape    # Trigger news scraping
/health    # Run health check
/linkedin  # Manage LinkedIn digests

# Via npm scripts
npm run scrape:news          # Manual scraping
npm run health:check         # Health check
npm run vercel:status        # Check Vercel status

# Via API
curl -X POST "https://your-site.com/api/telegram-control?action=trigger-scrape" \
  -H "Authorization: Bearer YOUR_SECRET"
```

### Deployment Automation

```
Git Push → Vercel Build → Post-Build Hook → Bot Setup → Telegram Notification
```

---

## ⚙️ Configuration

### Environment Variables

#### Required for Development

```env
# AI Services
GROQ_API_KEY=gsk_...                    # Groq AI for translation
FIRECRAWL_API_KEY=fc-...                # Firecrawl for scraping

# Database
NEXT_PUBLIC_SUPABASE_URL=https://...    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...        # Service role key (admin)

# Telegram Bot
TELEGRAM_BOT_TOKEN=123456:ABC...        # Bot token from @BotFather
TELEGRAM_CHAT_ID=123456789              # Your chat ID
```

#### Optional (Production)

```env
# Security
TELEGRAM_CONTROL_API_SECRET=random_key  # API endpoint security

# GitHub Integration
GITHUB_TOKEN=ghp_...                    # For workflow triggers
GITHUB_REPOSITORY=username/repo         # Repository name

# Analytics
VERCEL_ANALYTICS_ID=your_id            # Vercel Analytics

# n8n Integration (Unified Workflow)
N8N_LINKEDIN_WORKFLOW_WEBHOOK=https://your-n8n.app.n8n.cloud/webhook/linkedin-digest  # Unified LinkedIn digest workflow
```

### GitHub Secrets

Add these in: `Repository Settings → Secrets and variables → Actions`

```
GROQ_API_KEY
FIRECRAWL_API_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
GITHUB_TOKEN (auto-provided)
```

### Vercel Environment Variables

Add in: `Vercel Dashboard → Project → Settings → Environment Variables`

- Copy all variables from `.env`
- Select: Production, Preview, Development
- Click "Save"

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

### Health Checks

```bash
# System health check
npm run health:check

# Automated (daily at 08:00 UTC)
# - Supabase connection
# - API services status
# - Recent article count
# - Vercel platform status
# - System metrics

# Vercel status monitoring
npm run vercel:status

# Automated (every 30 minutes)
# - RSS feed monitoring
# - Incident detection
# - Duplicate prevention
# - Telegram alerts
```

### Telegram Notifications

Automatic notifications for:
- ✅ Successful scraping runs
- ❌ Errors with detailed logs
- 🏥 Daily health reports
- 🚀 Deployment notifications
- 🚨 Vercel platform incidents
- 📱 LinkedIn digest updates
- 📊 Weekly summaries

### System Dashboard

Access via Telegram bot:
- Real-time statistics
- API status monitoring
- Database metrics
- Error logs
- Performance metrics

---

## 📚 Documentation

### Setup Guides
- [📰 Tech News Setup](./docs/TECH_NEWS_SETUP.md) - Complete scraping system setup
- [🗄️ Supabase Setup](./docs/SUPABASE_SETUP.md) - Database configuration
- [📱 Telegram Bot Setup](./docs/TELEGRAM_NOTIFICATIONS_SETUP.md) - Bot configuration
- [🔧 General Setup](./docs/SETUP.md) - Initial project setup
- [💼 LinkedIn n8n Setup](./docs/n8n-setup-instructions.md) - **NEW!** Step-by-step n8n workflow setup
- [🚨 Vercel Status Monitor](./docs/VERCEL_STATUS_SETUP.md) - **NEW!** Platform monitoring setup

### System Documentation
- [🏗️ Architecture](./docs/IMPLEMENTATION_SUMMARY.md) - System architecture
- [🔄 Automation](./docs/SYSTEM_RELIABILITY.md) - Reliability & automation
- [📊 Monitoring](./docs/TECH_NEWS_MONITORING.md) - Monitoring system
- [🗃️ Database Schema](./docs/supabase-schema.sql) - PostgreSQL schema
- [📋 LinkedIn Workflow Guide](./docs/N8N_UNIFIED_WORKFLOW_GUIDE.md) - **NEW!** Unified workflow architecture
- [📝 Vercel Status Changelog](./docs/CHANGELOG_VERCEL_STATUS.md) - **NEW!** Recent system updates

### Deployment Guides
- [🚀 Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md) - Pre-deployment checks
- [📦 Vercel Setup](./docs/VERCEL_SETUP_GUIDE.md) - Vercel configuration
- [🔧 Tech News Deployment](./docs/TECH_NEWS_DEPLOYMENT.md) - News system deployment
- [✅ Vercel Env Checklist](./docs/VERCEL_ENV_CHECKLIST.md) - **NEW!** Environment variables guide

### Testing & Quality
- [🧪 Test Scenarios](./docs/TEST_SCENARIOS.md) - **NEW!** Complete testing guide for LinkedIn system

### API Documentation
- [📡 Telegram Webhook](./api/telegram-webhook.js) - Webhook handler
- [🎛️ Control API](./api/telegram-control.js) - Control endpoints
- [📰 Tech News API](./api/tech-news.js) - News endpoints

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

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

### Code Style

- TypeScript for new code
- ESLint + Prettier for formatting
- Meaningful commit messages
- Test your changes locally

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
- ✅ **LinkedIn OAuth Security** (n8n handles authentication)
- ✅ **Duplicate Post Prevention** (Status checks)
- ✅ **Error Message Sanitization** (No sensitive data exposure)

### Best Practices

```bash
# Never commit secrets
echo ".env" >> .gitignore

# Use API secrets
TELEGRAM_CONTROL_API_SECRET=random_64_char_string

# Rotate keys regularly
# - Every 90 days for production
# - Immediately if compromised
```

---

## 📈 Performance

### Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| **Lighthouse Score** | > 90 | 95+ |
| **First Contentful Paint** | < 1.5s | ~1.2s |
| **Time to Interactive** | < 3s | ~2.5s |
| **API Response Time** | < 200ms | ~150ms |
| **Translation Speed** | < 5s | ~3-4s |

### Optimization

- Static generation for pages
- Image optimization (WebP)
- Code splitting & lazy loading
- CDN caching (Vercel Edge)
- Database query optimization
- API response caching

---

## 📜 Scripts Reference

### Development
```bash
npm run dev                     # Start dev server (port 5173)
npm run build                   # Production build
npm run preview                 # Preview production build
```

### Tech News System
```bash
npm run scrape:news             # Manual news scraping
npm run fix:original-sources    # Fix missing source links
npm run migrate:supabase        # Migrate to Supabase
npm run test:translation        # Test translation quality
```

### Telegram Bot
```bash
npm run telegram:setup-menu     # Setup bot menu
npm run telegram:webhook-setup  # Configure webhook
npm run telegram:webhook-remove # Remove webhook
```

### LinkedIn Automation (n8n + Vercel)

**The new system uses ONE unified n8n workflow + Vercel for secure LinkedIn digest automation.**

#### Architecture:
```
┌──────────────────────────────────────────────────────┐
│  n8n Unified Workflow: LinkedIn Digest System       │
│                                                      │
│  ENTRY POINT 1: Daily Schedule (16:30 UTC Daily)   │
│  ENTRY POINT 2: Manual Trigger (Telegram Button)   │
│           ↓                                          │
│  ├── Workflow Configuration                         │
│  ├── Check Duplicate (Skip if exists)              │
│  ├── Fetch articles from Supabase                  │
│  ├── Generate digest with OpenAI GPT-4o-mini       │
│  ├── Save to linkedin_digest_posts (pending)       │
│  └── Send Telegram message (4 buttons)             │
└──────────────────────────────────────────────────────┘
                    ↓ User clicks "Approve/Reject/View/Edit"
┌──────────────────────────────────────────────────────┐
│  Vercel Webhook: Security Layer                     │
│  ├── UUID validation (RFC 4122)                    │
│  ├── Rate limiting (10 req/min per user)           │
│  ├── Chat ID authorization                         │
│  └── Forward to n8n callback webhook →             │
└──────────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────────┐
│  n8n Callback Handler (Same Workflow)               │
│  ├── Parse callback data                            │
│  ├── Switch (approve/reject/view/edit)             │
│  ├── Get digest from DB                            │
│  ├── Post to LinkedIn (n8n OAuth)                  │
│  ├── Update DB (status: posted/rejected)           │
│  └── Send Telegram confirmation                     │
└──────────────────────────────────────────────────────┘
```

#### Setup Requirements:
1. **n8n LinkedIn OAuth** (in n8n credentials)
   - Connect LinkedIn account in n8n
   - OAuth handles token refresh automatically
2. **One Unified n8n Workflow** (see `docs/n8n-setup-instructions.md` for step-by-step guide)
3. **Vercel Environment Variables:**
   ```bash
   N8N_LINKEDIN_WORKFLOW_WEBHOOK=https://your-n8n.app.n8n.cloud/webhook/linkedin-digest
   ```
   **Note:** This is the ONLY webhook needed. Old webhook variables are deprecated:
   - ~~N8N_LINKEDIN_CALLBACK_WEBHOOK~~ (Deprecated)
   - ~~N8N_MANUAL_DIGEST_WEBHOOK~~ (Deprecated)

#### How It Works:

**Automatic Daily Digest:**
1. **n8n Schedule Trigger** activates at 16:30 UTC (Weekdays)
2. **Workflow** checks for duplicates, fetches articles
3. **OpenAI GPT-4o-mini** generates LinkedIn digest
4. **Telegram** sends approval message with 4 buttons

**Manual Digest (New Feature!):**
1. **User** opens `/linkedin` command or menu
2. **Clicks** "🚀 Manuel Digest Oluştur" button
3. **Vercel** forwards request to n8n
4. **n8n** generates digest for today's articles
5. **Telegram** sends approval message immediately

**Approval Flow:**
1. **User clicks "Approve"** → Telegram forwards to Vercel
2. **Vercel** performs security checks & forwards to n8n
3. **n8n Callback Handler** posts to LinkedIn (OAuth)
4. **Confirmation** sent to Telegram ✅

#### Why This Design?
- ✅ **No LinkedIn API tokens in Vercel** (Security)
- ✅ **n8n handles OAuth** (Automatic refresh)
- ✅ **Vercel provides security layer** (Rate limiting, validation)
- ✅ **Unified workflow** (Easier maintenance, single source of truth)
- ✅ **Manual + Automatic** (Flexibility for both scheduled and on-demand)
- ✅ **Duplicate prevention** (Check database before creation)

#### Legacy Commands (Deprecated):
```bash
npm run linkedin:analyze        # Deprecated - Use n8n Workflow #1
npm run linkedin:post           # Deprecated - Use Telegram approval
npm run linkedin:test           # Not needed - n8n OAuth handles auth
```

**Note:** The legacy `linkedin_posts` table and Vercel-based LinkedIn posting are deprecated. New system uses `linkedin_digest_posts` with n8n OAuth for better security and UX.

### Monitoring
```bash
npm run health:check            # System health check
npm run test:webhook            # Test webhook
```

---

## 🎯 Roadmap

### ✅ Completed
- [x] Multi-category news scraping
- [x] AI-powered translation
- [x] Telegram bot control system
- [x] GitHub Actions automation
- [x] Supabase migration
- [x] Health monitoring system
- [x] LinkedIn digest automation (n8n + Vercel)
- [x] Manual digest creation (Telegram)
- [x] LinkedIn OAuth integration (n8n)
- [x] Email newsletter signup

### 🚧 In Progress
- [ ] RSS feed generation
- [ ] Article search functionality
- [ ] User bookmarking system
- [ ] Advanced analytics dashboard

### 📋 Planned
- [ ] Multi-language support (Spanish, French)
- [ ] Mobile app (React Native)
- [ ] AI-powered article summarization
- [ ] Social media auto-posting
- [ ] Newsletter email delivery
- [ ] Custom category subscriptions

---

## 💼 Use Cases

### For News Outlets
- Automated content aggregation
- Multi-language translation
- Social media distribution
- Analytics & insights

### For Developers
- Modern React/TypeScript template
- CI/CD best practices
- API integration examples
- Telegram bot implementation

### For Businesses
- Internal news distribution
- Team notifications
- Content curation
- Automated reporting

---

## 🏆 Acknowledgments

- [Groq AI](https://groq.com/) - Lightning-fast AI inference
- [Firecrawl](https://firecrawl.dev/) - Reliable web scraping
- [Supabase](https://supabase.com/) - Open-source Firebase alternative
- [Vercel](https://vercel.com/) - Seamless deployment platform
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

**Last Updated**: October 18, 2025 | **Version**: 2.1.0

[![Built with Love](https://img.shields.io/badge/Built%20with-❤️-red?style=flat-square)](https://github.com/CemRoot/My-Site)
[![Maintained](https://img.shields.io/badge/Maintained-Yes-green?style=flat-square)](https://github.com/CemRoot/My-Site)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=flat-square)](http://makeapullrequest.com)

</div>
