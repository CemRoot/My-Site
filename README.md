# 🚀 Cem Koyluoglu - Portfolio & Tech News

Modern, AI-powered portfolio website with automated tech news aggregation and translation system.

## ✨ Features

### Portfolio
- **Modern UI/UX**: Liquid glass design with animated components
- **AI Chat Widget**: Powered by Groq AI for visitor interactions
- **Responsive Design**: Optimized for all devices
- **Dark/Light Theme**: Automatic theme switching
- **Analytics**: Vercel Analytics integration

### Tech News System 🗞️
- **Multi-Category Scraping**: 7 categories from [Nuvemmag](https://www.nuvemmag.com/)
- **AI Translation**: Turkish → English using Groq AI Llama 3.3 70B (unlimited length)
- **Smart Scheduling**: GitHub Actions with intelligent polling (weekdays/weekends)
- **Category Tagging**: Color-coded badges for each category
- **Email Newsletter**: Subscription system for future updates
- **Source Attribution**: Links to original articles and Nuvemmag
- **Duplicate Prevention**: URL-based hashing to avoid re-posting
- **SEO Optimized**: Clean markdown rendering with React Markdown
- **Fast Loading**: Static JSON database for instant access

---

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Tech News Section (React Router)
    ↓
Static JSON Database (public/data/tech-news.json)
    ↑
GitHub Actions (Scheduler)
    ↑
News Scraper (Firecrawl + Groq AI)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn
- Git

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd My-Site

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and add your API keys (see below)

# Start development server
npm run dev
```

---

## 🔑 API Keys Setup

### 1. Groq API (Required)
Used for AI chat widget and article translation

1. Visit: https://console.groq.com/
2. Sign up (free)
3. Create API key
4. Add to `.env`: `GROQ_API_KEY=your_key_here`

**Provided API Key**: Contact project owner for key

### 2. Firecrawl API (Required for scraping)
Used for web scraping

1. Visit: https://firecrawl.dev/
2. Sign up (500 free scrapes/month)
3. Get API key
4. Add to `.env`: `FIRECRAWL_API_KEY=fc-your_key_here`

---

## 📜 Available Scripts

```bash
# Development
npm run dev                  # Start dev server

# Build
npm run build               # Production build

# Tech News
npm run scrape:news         # Manually scrape and translate news
npm run test:translation    # Test Groq translation quality
```

---

## 📁 Project Structure

```
My-Site/
├── src/
│   ├── components/
│   │   ├── TechNews.tsx           # News list page
│   │   ├── TechNewsDetail.tsx     # Article detail page
│   │   ├── NewsletterSignup.tsx   # Email subscription form
│   │   ├── Navbar.tsx              # Navigation with Tech News link
│   │   └── ...
│   ├── pages/
│   │   └── HomePage.tsx           # Main portfolio page
│   ├── App.tsx                    # Router setup
│   └── main.tsx                   # Entry point
├── public/
│   └── data/
│       └── tech-news.json         # News database (auto-updated)
├── scripts/
│   ├── news-scraper.js            # Scraping + translation pipeline
│   └── test-groq-translation.js   # Translation testing
├── api/
│   └── newsletter.js               # Vercel serverless function
├── .github/
│   └── workflows/
│       └── scrape-tech-news.yml    # Auto-update workflow
├── docs/
│   └── TECH_NEWS_SETUP.md          # Detailed setup guide
└── TECH_NEWS_DEPLOYMENT.md         # Deployment checklist
```

---

## 🤖 Automated News System

### How It Works

1. **GitHub Actions** runs on schedule (every 6-12 hours)
2. **Firecrawl REST API** scrapes 7 categories from Nuvemmag (2 articles each)
3. **Duplicate Check** skips already-scraped articles using URL hashing
4. **Groq AI** translates new articles to English (title, description, full content)
5. **Image Extraction** captures article images from metadata
6. **JSON Database** stores articles with metadata (category, date, source)
7. **Git Commit** pushes changes to GitHub
8. **Vercel Auto-Deploy** updates live site automatically
9. **Frontend** displays translated articles with category badges

### Schedule
- **Weekdays**: 08:00, 14:00, 20:00, 02:00 UTC
- **Weekends**: 10:00, 22:00 UTC

### Manual Trigger
Go to: **Actions → Scrape Tech News → Run workflow**

---

## 🎨 Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Radix UI** - Component library
- **Lucide React** - Icons
- **React Markdown** - Article rendering

### Backend/Scraping
- **Node.js** - Runtime
- **Firecrawl REST API** - Web scraping (10 req/min free tier)
- **Groq AI** - Translation (llama-3.3-70b-versatile)
- **GitHub Actions** - Automation scheduler

### Hosting
- **Vercel** - Frontend hosting
- **GitHub** - Version control + Actions

---

## 📝 Environment Variables

### Local Development (.env)
```env
GROQ_API_KEY=your_groq_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

### GitHub Secrets (for Actions)
Add in: `Settings → Secrets and variables → Actions`
- `GROQ_API_KEY`
- `FIRECRAWL_API_KEY`

### Vercel (for deployment)
Add same variables in Vercel project settings

---

## 🔧 Configuration

### Scraper Settings
Edit `scripts/news-scraper.js`:
```javascript
const CONFIG = {
  CATEGORIES: [
    { name: 'Latest News', url: '...', tag: 'Latest News' },
    // Add more categories...
  ],
  MAX_ARTICLES_PER_CATEGORY: 2,  // Per category per run
  RATE_LIMIT_DELAY: 7000,         // 7s between requests
  TRANSLATION_DELAY: 300,          // 300ms between translations
};
```

### Schedule Settings
Edit `.github/workflows/scrape-tech-news.yml`:
```yaml
schedule:
  - cron: '0 8,14,20 * * 1-5'  # Weekdays
  - cron: '0 10,22 * * 0,6'    # Weekends
```

---

## 🐛 Troubleshooting

### Dev Server Won't Start
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Scraper Fails
1. Check API keys in `.env`
2. Verify Firecrawl credits: https://firecrawl.dev/dashboard
3. Check Groq status: https://status.groq.com/

### Build Errors
```bash
npm run build
# Check for TypeScript errors
```

---

## 📚 Documentation

### Setup Guides
- **📰 Tech News Setup**: [docs/TECH_NEWS_SETUP.md](./docs/TECH_NEWS_SETUP.md)
- **🗄️ Supabase Setup**: [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)
- **⚙️ General Setup**: [docs/SETUP.md](./docs/SETUP.md)

### Deployment
- **🚀 Deployment Checklist**: [docs/DEPLOYMENT_CHECKLIST.md](./docs/DEPLOYMENT_CHECKLIST.md)
- **📦 Tech News Deployment**: [docs/TECH_NEWS_DEPLOYMENT.md](./docs/TECH_NEWS_DEPLOYMENT.md)

### Project Documentation
- **📋 Project Summary**: [docs/SUMMARY.md](./docs/SUMMARY.md)
- **🗃️ Database Schema**: [docs/supabase-schema.sql](./docs/supabase-schema.sql)

### External Resources
- **Firecrawl API Docs**: https://docs.firecrawl.dev/
- **Groq AI Docs**: https://console.groq.com/docs
- **Supabase Docs**: https://supabase.com/docs

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deploy
```bash
npm run build
# Upload `build/` folder to hosting
```

---

## 📊 Performance

- **Lighthouse Score**: 95+ (all categories)
- **First Load**: < 2s
- **Translation Speed**: 3-5s per article
- **API Costs**: $0 (free tiers)

---

## 🤝 Contributing

This is a personal portfolio project, but suggestions are welcome!

---

## 📄 License

MIT License - feel free to use as template

---

## 👤 Author

**Cem Koyluoglu (CK)**
- Email: cemkoyluoglu@icloud.com
- Phone/WhatsApp: +353 87 344 5918
- Location: Dublin, Ireland
- GitHub: [@CemRoot](https://github.com/CemRoot)
- LinkedIn: [Cem Koyluoglu](https://www.linkedin.com/in/cem-koyluoglu/)

---

## 🎉 Features Roadmap

- [x] **Multi-category scraping** ✅
- [x] **Email newsletter subscription** ✅
- [x] **Article category tags with badges** ✅
- [ ] RSS feed generation
- [ ] Search functionality
- [ ] Article bookmarking
- [ ] Social sharing stats
- [ ] Analytics dashboard
- [ ] Newsletter email sending system

---

**Last Updated**: October 12, 2025  
**Version**: 1.0.0
