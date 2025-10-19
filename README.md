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
- 🏥 System health checks
- 📊 Real-time statistics
- 💾 Database management
- 🔧 GitHub Actions control

</td>
<td width="50%">

#### Automated Notifications
- ✅ Success reports
- ❌ Error alerts with details
- 📈 Daily health summaries
- 🚀 Deployment notifications
- 📱 Real-time updates

</td>
</tr>
</table>

### 🔄 Full Automation

- **Scheduled Scraping**: 3x daily on weekdays, health checks
- **Auto Deployment**: Vercel CI/CD with post-build hooks
- **Self-Healing**: Automatic retries, fallback mechanisms
- **Monitoring**: System health tracking, API status checks
- **GitHub Integration**: Workflow triggers, status reporting

### 💼 Portfolio Website

- Modern liquid glass design
- AI-powered chat widget (Groq)
- Responsive & accessible
- SEO optimized
- Dark/Light theme support

---

## 🏗️ Architecture

```mermaid
%%{init: {
  "theme": "base",
  "flowchart": { "curve": "basis", "nodeSpacing": 44, "rankSpacing": 72, "htmlLabels": true }
}}%%
flowchart LR

%% ---------- KATMAN STİLLERİ ----------
classDef client fill:#0ea5e9,stroke:#0284c7,color:#fff,rx:12,ry:12
classDef api fill:#22c55e,stroke:#16a34a,color:#083b17,rx:12,ry:12
classDef auto fill:#f59e0b,stroke:#d97706,color:#3b2600,rx:12,ry:12
classDef ai fill:#a78bfa,stroke:#7c3aed,color:#1f1147,rx:12,ry:12
classDef data fill:#94a3b8,stroke:#64748b,color:#0b1220,rx:12,ry:12
classDef msg fill:#ef4444,stroke:#b91c1c,color:#fff,rx:12,ry:12
classDef light fill:#f8fafc,stroke:#cbd5e1,color:#0f172a,rx:12,ry:12

%% ---------- SUBGRAFLAR ----------
subgraph S1["Client Layer"]
A[React SPA]:::client
B[Tech News UI]:::client
C[Portfolio UI]:::client
D[Chat Widget]:::client
end

subgraph S2["API Layer · Vercel Edge Functions"]
E[Telegram Webhook]:::api
F[Menu Handler]:::api
G[Control API]:::api
H[Newsletter API]:::api
I[Tech News API]:::api
end

subgraph S3["Automation · GitHub Actions"]
J[Scrape Tech News]:::auto
K[Health Check]:::auto
L[Telegram Setup]:::auto
end

subgraph S4["Automation · n8n"]
M[LinkedIn Digest Workflow]:::auto
M1[Daily Schedule 16:30]:::light
M2[Manual Trigger]:::light
M3[Callback Handler]:::light
end

subgraph S5["AI Services"]
N[Groq AI]:::ai
O[Translation]:::ai
P[Chat Responses]:::ai
Q[OpenAI GPT-4o-mini]:::ai
R[LinkedIn Digest]:::ai
S[Firecrawl]:::ai
T[Web Scraping]:::ai
end

subgraph S6["Data Layer · Supabase"]
U[(Supabase)]:::data
V[Tech Articles]:::data
W[LinkedIn Digest Posts]:::data
X[Analytics]:::data
end

subgraph S7["Messaging"]
Y[Telegram Bot]:::msg
Z[Commands]:::light
AA[Notifications]:::light
end

%% ---------- ANA AKIŞ (ok sırası önemlidir) ----------
%% Client fan-out
A --> I
A --> B
A --> C
A --> D

%% Client/API -> Data & AI
B --> U
C --> H
D --> N

%% API -> n8n
E --> F
F --> M
E --> M3
M3 --> M
G -. control .- M

%% GitHub Actions
J --> S
S --> T
J --> N
J --> U
K --> U
K --> Y
J --> Y
L --> Y

%% n8n -> Data/AI/Messaging & Triggers
M --> U
M --> Q
Q --> R
M --> Y
M1 --> M
M2 --> M

%% Groq AI subtasks
N --> O
N --> P

%% Messaging fan-out
Y --> Z
Y --> AA

%% Supabase fan-out
U --> V
U --> W
U --> X

%% ---------- OK RENKLERİ (index'e göre) ----------
%% 0-based index: İlk ok A-->I = 0
%% Client fan-out (mavi)
linkStyle 0,1,2,3 stroke:#3b82f6,stroke-width:2px

%% Client/API -> Data (slate)
linkStyle 4,5 stroke:#475569,stroke-width:2px

%% Client -> AI (mor)
linkStyle 6 stroke:#7c3aed,stroke-width:2px

%% API -> n8n (turuncu)
linkStyle 7,8,9,10 stroke:#d97706,stroke-width:2px

%% (11) dotted control zaten noktalı; renklendirmiyoruz

%% GitHub Actions akışı (amber)
linkStyle 12,13,14,15,16,17,18,19 stroke:#f59e0b,stroke-width:2px

%% n8n → Data/AI/Messaging (yeşil ton)
linkStyle 20,21,23 stroke:#16a34a,stroke-width:2px

%% Schedules (gri açık)
linkStyle 24,25 stroke:#94a3b8,stroke-width:2px

%% Q → R (AI zinciri lavanta)
linkStyle 22 stroke:#a78bfa,stroke-width:2px

%% Groq AI subtasks (lavanta)
linkStyle 26,27 stroke:#a78bfa,stroke-width:2px

%% Messaging fan-out (kırmızı)
linkStyle 28,29 stroke:#ef4444,stroke-width:2px

%% Supabase fan-out (slate koyu)
linkStyle 30,31,32 stroke:#334155,stroke-width:2px

%% ---------- LEJAND ----------
subgraph Legend["Legend"]
direction LR
LC[Client]:::client --- LAI[AI]:::ai --- LAPI[API]:::api --- LAU[Automation]:::auto --- LD[Data]:::data --- LM[Messaging]:::msg
end
```

### 🔄 Data Flow

#### News Aggregation Flow
```
User Request → Vercel Edge Function → Supabase → Response
      ↓
GitHub Actions (Scheduled)
      ↓
Firecrawl Scraping → Groq Translation → Supabase Storage
      ↓
Telegram Notification (Success/Error)
```

#### LinkedIn Digest Flow (n8n + Vercel)
```
n8n Unified Workflow: LinkedIn Digest System
      ↓
TRIGGER 1: Schedule (16:30 UTC Daily - Automatic)
      OR
TRIGGER 2: Manual Digest Button (/linkedin menu - User action)
      ↓
Workflow Configuration → Check Duplicate
      ↓
Fetch Today's Articles → OpenAI GPT-4o-mini (Digest Generation)
      ↓
Save to linkedin_digest_posts (status: pending)
      ↓
Telegram Message (4 Buttons: ✅ Approve / ❌ Reject / 👁️ View / ✏️ Edit)
      ↓
User Clicks Button → Telegram Bot API
      ↓
Vercel Webhook (api/telegram-webhook.js) - Security Layer
      ├── UUID Validation (RFC 4122)
      ├── Rate Limiting (10 req/min per user)
      ├── Chat Authorization
      └── Forward to n8n Callback Webhook →
                         ↓
n8n Callback Handler (Same Workflow)
      ↓
Parse Callback → Switch (approve/reject/view/edit)
      ↓
Get Digest from DB
      ↓
Action Based on Button:
   • APPROVE → Post to LinkedIn (n8n OAuth) → Update DB (posted) → ✅ Confirmation
   • REJECT  → Update DB (rejected) → ❌ Rejected Message
   • VIEW    → Send Full Digest Content → 👁️ Full Content
   • EDIT    → "Coming Soon" Message → ✏️ Edit Mode
      ↓
Telegram Confirmation ✅
```

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
| **System Health Check** | 08:00 UTC (Daily) | Monitor system health |
| **LinkedIn Automation** | 16:30 UTC (Daily) | Analyze & post content |

### Manual Triggers

All workflows can be triggered manually:

```bash
# Via GitHub Actions UI
Actions → [Workflow Name] → Run workflow

# Via Telegram Bot
/scrape   # Trigger news scraping
/health   # Run health check

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

# LinkedIn Automation (n8n Integration)
N8N_LINKEDIN_CALLBACK_WEBHOOK=https://your-n8n.app.n8n.cloud/webhook/linkedin-digest-callback  # n8n callback webhook
N8N_MANUAL_DIGEST_WEBHOOK=https://your-n8n.app.n8n.cloud/webhook/manuel-start-linkedin         # n8n manual digest webhook
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
# Manual health check
npm run health:check

# Automated (daily at 08:00 UTC)
# - Supabase connection
# - API services status
# - Recent article count
# - System metrics
```

### Telegram Notifications

Automatic notifications for:
- ✅ Successful scraping runs
- ❌ Errors with detailed logs
- 🏥 Daily health reports
- 🚀 Deployment notifications
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

### System Documentation
- [🏗️ Architecture](./docs/IMPLEMENTATION_SUMMARY.md) - System architecture
- [🔄 Automation](./docs/SYSTEM_RELIABILITY.md) - Reliability & automation
- [📊 Monitoring](./docs/TECH_NEWS_MONITORING.md) - Monitoring system
- [🗃️ Database Schema](./docs/supabase-schema.sql) - PostgreSQL schema

### Deployment Guides
- [🚀 Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md) - Pre-deployment checks
- [📦 Vercel Setup](./docs/VERCEL_SETUP_GUIDE.md) - Vercel configuration
- [🔧 Tech News Deployment](./docs/TECH_NEWS_DEPLOYMENT.md) - News system deployment

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
2. **One Unified n8n Workflow** (see `docs/n8n-linkedin-digest-FINAL.json`)
3. **Vercel Environment Variables:**
   ```bash
   N8N_LINKEDIN_CALLBACK_WEBHOOK=https://your-n8n.app.n8n.cloud/webhook/linkedin-digest-callback
   N8N_MANUAL_DIGEST_WEBHOOK=https://your-n8n.app.n8n.cloud/webhook/manuel-start-linkedin
   ```

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
