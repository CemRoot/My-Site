# 📰 Tech News Automation Setup

## Overview

Automated tech news scraping, translation, and publishing system that:
- Scrapes Turkish tech news from [Nuvemmag](https://www.nuvemmag.com/post-category/en-son-haberler)
- Translates articles to professional English using Groq AI
- Stores in JSON database with duplicate prevention
- Auto-updates via GitHub Actions (smart scheduling)
- Displays on frontend with beautiful UI

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions (Scheduler)               │
│  Weekdays: Every 6h  |  Weekends: Every 12h                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    News Scraper Pipeline                     │
│  1. Firecrawl → Scrape articles                             │
│  2. Groq AI → Translate (unlimited length)                  │
│  3. JSON DB → Store with deduplication                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Static JSON Database                      │
│  public/data/tech-news.json (committed to git)              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  • Tech News list page                                       │
│  • Article detail pages                                      │
│  • Responsive design                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Get API Keys (Free)

#### Groq API (Translation)
1. Visit: https://console.groq.com/
2. Sign up (free)
3. Create API key
4. Copy key

#### Firecrawl API (Scraping)
1. Visit: https://firecrawl.dev/
2. Sign up (free tier: 500 scrapes/month)
3. Get API key
4. Copy key

### 2. Setup Environment Variables

#### Local Development (.env)
```bash
# Copy example file
cp .env.example .env

# Edit .env and add your keys
GROQ_API_KEY=your_groq_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

#### GitHub Repository (Actions)
1. Go to: `Settings → Secrets and variables → Actions`
2. Add repository secrets:
   - `GROQ_API_KEY`: Your Groq API key
   - `FIRECRAWL_API_KEY`: Your Firecrawl API key

#### Vercel Deployment
Add same environment variables in Vercel project settings

---

## 📅 Scheduling Algorithm

### Smart Schedule (Optimized for Low Load)

**Weekdays (Mon-Fri):**
- 08:00 UTC (Morning news)
- 14:00 UTC (Afternoon updates)
- 20:00 UTC (Evening news)
- 02:00 UTC (Night updates)

**Weekends (Sat-Sun):**
- 10:00 UTC (Morning)
- 22:00 UTC (Evening)

### Why This Schedule?

✅ **Balanced Coverage**: Captures news throughout the day
✅ **Low Resource Usage**: 26 runs/week vs 168 runs/week (hourly)
✅ **Rate Limit Friendly**: Respects API limits
✅ **Cost Effective**: Minimal compute time
✅ **Duplicate Prevention**: Built-in hash-based deduplication

---

## 🛠️ Manual Operations

### Test Translation Quality
```bash
npm run test:translation
```

### Run Scraper Manually
```bash
npm run scrape:news
```

### Trigger GitHub Actions Manually
1. Go to: `Actions → Scrape Tech News`
2. Click: `Run workflow`
3. Options:
   - `max_articles`: Number of articles to scrape (default: 10)
   - `force_rescrape`: Rescrape existing articles (default: false)

---

## 📊 Database Structure

**File**: `public/data/tech-news.json`

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-10-12T10:30:00.000Z",
  "totalArticles": 45,
  "articles": [
    {
      "id": "a1b2c3d4e5f6...",        // MD5 hash of source URL
      "title": "Article Title (EN)",
      "originalTitle": "Başlık (TR)",
      "description": "Brief description in English",
      "content": "Full translated article content...",
      "image": "https://cdn.../image.webp",
      "date": "2/7/2025",
      "sourceUrl": "https://www.nuvemmag.com/post/...",
      "slug": "article-slug",
      "createdAt": "2025-10-12T10:30:00.000Z"
    }
  ]
}
```

---

## 🎨 Frontend Components

### TechNews (List Page)
- Grid layout with article cards
- Image thumbnails
- Date and category badges
- "Read more" links

### TechNewsDetail (Article Page)
- Full article content
- Featured image
- Publication date
- Source attribution
- Related articles

---

## 🔧 Configuration

### Scraper Config (`scripts/news-scraper.js`)

```javascript
const CONFIG = {
  SOURCE_URL: 'https://www.nuvemmag.com/post-category/en-son-haberler',
  MAX_ARTICLES_TO_SCRAPE: 10,      // Per run
  TRANSLATION_DELAY: 300,           // ms between requests
  // ... API keys from env
};
```

### Translation Model

- **Model**: `llama-3.1-70b-versatile`
- **Temperature**: 0.3 (accurate translation)
- **Max Tokens**: 4000 (supports long articles)
- **No Chunking**: Handles 1200+ word articles in one go

---

## 📈 Performance Metrics

### Translation Speed
- Short title (10 words): ~1-2 seconds
- Long article (1200 words): ~3-5 seconds

### API Costs
- **Groq AI**: FREE (generous limits)
- **Firecrawl**: FREE tier (500/month)
- **GitHub Actions**: FREE (2000 min/month)

### Resource Usage
- ~26 workflow runs/week
- ~260 articles/month (10 per run)
- ~5-10 minutes compute time/month

---

## 🐛 Troubleshooting

### Scraper Fails
1. Check API keys in GitHub Secrets
2. Verify Firecrawl credits remaining
3. Check workflow logs in Actions tab

### No New Articles
- This is normal! Duplicate prevention working
- Source site may not have published new content

### Translation Quality Issues
- Check Groq API status
- Verify API key is valid
- Model might need adjustment (edit translateText function)

---

## 🔐 Security

✅ **API Keys**: Never committed to git (in .env, ignored)
✅ **GitHub Secrets**: Encrypted at rest
✅ **Public Data**: JSON file is public (translated content only)
✅ **Source Attribution**: All articles link to original source

---

## 📝 Maintenance

### Weekly Tasks
- ✅ Check GitHub Actions success rate
- ✅ Monitor API usage (Groq & Firecrawl dashboards)

### Monthly Tasks
- ✅ Review article quality
- ✅ Update scraper if source site changes
- ✅ Clean old articles (optional)

---

## 🚢 Deployment Checklist

- [ ] Add API keys to GitHub Secrets
- [ ] Add API keys to Vercel
- [ ] Test scraper locally
- [ ] Verify GitHub Actions workflow
- [ ] Check frontend displays articles
- [ ] Monitor first automated run

---

## 📚 Resources

- **Groq Console**: https://console.groq.com/
- **Firecrawl Docs**: https://docs.firecrawl.dev/
- **GitHub Actions**: https://docs.github.com/actions
- **Source Site**: https://www.nuvemmag.com/

---

## 💡 Future Enhancements

- [ ] RSS feed generation
- [ ] Email newsletter
- [ ] Article categories/tags
- [ ] Search functionality
- [ ] Article bookmarking
- [ ] Social sharing
- [ ] Analytics tracking

---

**Last Updated**: October 12, 2025
**Maintainer**: Dr. Sam (Cem Koyluoglu)

